"""
BOEW ML Service — Bag-of-Encrypted-Words Content-Based Image Retrieval
FastAPI service with HOG+color feature extraction, NumPy/FAISS indexing, and AES-CBC encryption.
"""

import os
import json
import time
import hashlib
import logging
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── FAISS (optional) ─────────────────────────────────────────────────────────
try:
    import faiss
    FAISS_AVAILABLE = True
except Exception:
    FAISS_AVAILABLE = False

# ─── scikit-image (real feature extractor) ────────────────────────────────────
# Installed to .pythonlibs; ensure it's on the path
_plib = Path(__file__).parent.parent / ".pythonlibs"
if _plib.exists() and str(_plib) not in sys.path:
    sys.path.insert(0, str(_plib))

try:
    from skimage.feature import hog
    from skimage.color import rgb2gray
    from skimage.transform import resize as sk_resize
    import skimage
    SKIMAGE_AVAILABLE = True
except Exception:
    SKIMAGE_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("boew")

app = FastAPI(title="BOEW ML Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
DATASET_DIR = BASE_DIR / "dataset"
FEATURES_DIR = BASE_DIR / "encrypted_features"
INDEX_DIR = BASE_DIR / "faiss_index"

for d in [FEATURES_DIR, INDEX_DIR]:
    d.mkdir(parents=True, exist_ok=True)

META_PATH = INDEX_DIR / "metadata.json"
EXTRACTOR_TAG_PATH = INDEX_DIR / "extractor_tag.txt"

# Encryption key derived from SESSION_SECRET
ENCRYPTION_KEY = hashlib.sha256(
    (os.getenv("SESSION_SECRET", "boew-encryption-key")).encode()
).digest()

# ─── Global State ─────────────────────────────────────────────────────────────
# TF/ResNet50 (optional)
tf_model = None
tf_loaded = False

# Feature matrix (in-memory)
feature_matrix: Optional[np.ndarray] = None
metadata: list = []
last_indexed_at: Optional[str] = None

# Extractor selects feature dim dynamically — computed once from a probe
_FEATURE_DIM: Optional[int] = None


def get_feature_dim() -> int:
    global _FEATURE_DIM
    if _FEATURE_DIM is None:
        _FEATURE_DIM = _probe_feature_dim()
    return _FEATURE_DIM


def extractor_tag() -> str:
    """Short string that identifies the active extractor. Used to detect upgrades."""
    if tf_loaded:
        return "resnet50-2048"
    if SKIMAGE_AVAILABLE:
        return f"hog-color-{get_feature_dim()}"
    return f"pixelstats-{get_feature_dim()}"


def _probe_feature_dim() -> int:
    """Extract features from a tiny synthetic image to discover the output dimension."""
    import tempfile
    from PIL import Image
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        tmp = f.name
    try:
        Image.new("RGB", (224, 224), (128, 64, 32)).save(tmp)
        feat = _extract_raw(tmp)
        return len(feat)
    finally:
        os.unlink(tmp)


# ─── AES-CBC Encryption ───────────────────────────────────────────────────────

def encrypt_features(features: np.ndarray) -> bytes:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend
    iv = os.urandom(16)
    raw = features.astype(np.float32).tobytes()
    pad_len = 16 - (len(raw) % 16)
    padded = raw + bytes([pad_len] * pad_len)
    c = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
    enc = c.encryptor()
    return iv + enc.update(padded) + enc.finalize()


def decrypt_features(data: bytes) -> np.ndarray:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend
    iv, ct = data[:16], data[16:]
    c = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
    dec = c.decryptor()
    padded = dec.update(ct) + dec.finalize()
    raw = padded[:-padded[-1]]
    return np.frombuffer(raw, dtype=np.float32).copy()


# ─── Feature Extraction ───────────────────────────────────────────────────────

def load_tf_model():
    global tf_model, tf_loaded
    try:
        import tensorflow as tf
        from tensorflow.keras.applications import ResNet50
        from tensorflow.keras.models import Model
        base = ResNet50(weights="imagenet", include_top=True)
        tf_model = Model(inputs=base.input, outputs=base.layers[-2].output)
        tf_loaded = True
        logger.info("ResNet50 (TensorFlow) loaded")
    except Exception as e:
        logger.warning(f"TF unavailable: {e}")
        tf_loaded = False


def _extract_hog_color(image_path: str) -> np.ndarray:
    """
    HOG + multi-scale color histogram feature extractor using scikit-image.
    Produces a rich, perceptually meaningful feature vector.
    """
    from PIL import Image as PILImage

    img_pil = PILImage.open(image_path).convert("RGB").resize((128, 128))
    img = np.array(img_pil, dtype=np.float32) / 255.0  # (128,128,3) in [0,1]

    # ── HOG features on grayscale ──────────────────────────────────────────
    gray = rgb2gray(img)  # (128,128)
    hog_feats = hog(
        gray,
        orientations=9,
        pixels_per_cell=(16, 16),
        cells_per_block=(2, 2),
        block_norm="L2-Hys",
        feature_vector=True,
    )  # length = 7*7 * 2*2 * 9 = 1764 ... actually for 128px with 16px cells:
    #   cells = 8x8; blocks = (8-2+1)x(8-2+1) = 7x7; feats = 7*7*4*9 = 1764

    # ── Color histograms per channel (global + 4-region) ──────────────────
    bins = 32
    color_feats_parts = []

    # Global histogram for each channel
    for c in range(3):
        hist, _ = np.histogram(img[:, :, c], bins=bins, range=(0.0, 1.0))
        color_feats_parts.append(hist.astype(np.float32))

    # 4-quadrant histograms for spatial color info
    h2, w2 = 64, 64
    for row in range(2):
        for col in range(2):
            patch = img[row * h2:(row + 1) * h2, col * w2:(col + 1) * w2]
            for c in range(3):
                hist, _ = np.histogram(patch[:, :, c], bins=bins // 2, range=(0.0, 1.0))
                color_feats_parts.append(hist.astype(np.float32))

    # global: 3 * 32 = 96;  quadrants: 4 * 3 * 16 = 192;  total color = 288
    color_feats = np.concatenate(color_feats_parts)  # (288,)

    # ── HOG on each color channel (adds texture-per-channel info) ─────────
    ch_hog_parts = []
    for c in range(3):
        ch_hog = hog(
            img[:, :, c],
            orientations=6,
            pixels_per_cell=(32, 32),
            cells_per_block=(2, 2),
            block_norm="L2-Hys",
            feature_vector=True,
        )  # cells = 4x4; blocks = (4-2+1)² = 9; feats = 9*4*6 = 216 per channel
        ch_hog_parts.append(ch_hog)
    ch_hog_feats = np.concatenate(ch_hog_parts)  # (648,)

    # ── Concatenate all ────────────────────────────────────────────────────
    feat = np.concatenate([hog_feats, color_feats, ch_hog_feats]).astype(np.float32)
    norm = np.linalg.norm(feat)
    return feat / norm if norm > 0 else feat


def _extract_pixelstats(image_path: str) -> np.ndarray:
    """Deterministic pixel-stats fallback — still better than random."""
    from PIL import Image as PILImage
    DIMS = 512
    try:
        img = PILImage.open(image_path).convert("RGB").resize((64, 64))
        arr = np.array(img, dtype=np.float32) / 255.0
        flat = arr.flatten()  # 64*64*3 = 12288

        # Sub-sample 512 dims via deterministic stride
        stride = max(1, len(flat) // DIMS)
        feat = flat[::stride][:DIMS]
        if len(feat) < DIMS:
            feat = np.pad(feat, (0, DIMS - len(feat)))

        # Add multi-scale stats for richness
        for scale in [16, 32]:
            thumb = np.array(PILImage.open(image_path).convert("RGB").resize((scale, scale)),
                             dtype=np.float32) / 255.0
            feat = np.append(feat[:DIMS - scale * scale * 3],
                             thumb.flatten()[:scale * scale * 3])
    except Exception:
        seed = int(hashlib.md5(image_path.encode()).hexdigest(), 16) % (2**32)
        feat = np.random.RandomState(seed).randn(DIMS).astype(np.float32)

    feat = feat.astype(np.float32)
    norm = np.linalg.norm(feat)
    return feat / norm if norm > 0 else feat


def _extract_tf(image_path: str) -> np.ndarray:
    from tensorflow.keras.applications.resnet50 import preprocess_input
    from tensorflow.keras.preprocessing import image as kimg
    img = kimg.load_img(image_path, target_size=(224, 224))
    x = preprocess_input(np.expand_dims(kimg.img_to_array(img), 0))
    feat = tf_model.predict(x, verbose=0)[0].astype(np.float32)
    n = np.linalg.norm(feat)
    return feat / n if n > 0 else feat


def _extract_raw(image_path: str) -> np.ndarray:
    if tf_loaded:
        return _extract_tf(image_path)
    if SKIMAGE_AVAILABLE:
        return _extract_hog_color(image_path)
    return _extract_pixelstats(image_path)


def extract_features(image_path: str) -> np.ndarray:
    return _extract_raw(image_path)


# ─── Index Management ─────────────────────────────────────────────────────────

def rebuild_matrix_from_files():
    global feature_matrix, metadata
    dim = get_feature_dim()
    loaded_meta, vectors = [], []
    for meta in metadata:
        fp = FEATURES_DIR / f"{meta['id']}.enc"
        if fp.exists():
            try:
                v = decrypt_features(fp.read_bytes())
                if len(v) == dim:
                    vectors.append(v)
                    loaded_meta.append(meta)
                else:
                    logger.warning(f"Skipping id={meta['id']}: dim mismatch ({len(v)} != {dim})")
            except Exception as e:
                logger.warning(f"Decrypt failed id={meta['id']}: {e}")
    metadata = loaded_meta
    feature_matrix = np.stack(vectors) if vectors else np.empty((0, dim), dtype=np.float32)
    logger.info(f"Feature matrix: {feature_matrix.shape}")


def save_metadata():
    with open(META_PATH, "w") as f:
        json.dump({"metadata": metadata, "last_indexed_at": last_indexed_at}, f)


def load_persisted_state():
    global metadata, last_indexed_at
    if META_PATH.exists():
        try:
            with open(META_PATH) as f:
                data = json.load(f)
            metadata = data.get("metadata", [])
            last_indexed_at = data.get("last_indexed_at")
        except Exception as e:
            logger.error(f"Failed to load metadata: {e}")
            metadata = []
    rebuild_matrix_from_files()


def reindex_all_dataset_images():
    """Re-extract features for every image in metadata using stored absolute paths."""
    global last_indexed_at
    images_reindexed = 0
    for meta in list(metadata):
        # Prefer stored absolute path, fall back to searching known dirs
        abs_path = meta.get("abs_path")
        if not abs_path or not Path(abs_path).exists():
            # Search known candidate locations by filename
            fname = meta.get("filename", "")
            candidates = [
                BASE_DIR / "artifacts" / "api-server" / "dataset" / fname,
                BASE_DIR / "dataset" / fname,
            ]
            abs_path = next((str(p) for p in candidates if p.exists()), None)
        if not abs_path:
            logger.warning(f"Image file not found for id={meta['id']}, skipping")
            continue
        try:
            feat = extract_features(abs_path)
            enc = encrypt_features(feat)
            (FEATURES_DIR / f"{meta['id']}.enc").write_bytes(enc)
            # Update stored abs_path
            meta["abs_path"] = abs_path
            images_reindexed += 1
        except Exception as e:
            logger.warning(f"Re-index failed for id={meta['id']}: {e}")

    if images_reindexed:
        rebuild_matrix_from_files()
        last_indexed_at = datetime.utcnow().isoformat()
        save_metadata()
        logger.info(f"Re-indexed {images_reindexed} images with extractor={extractor_tag()}")
    return images_reindexed


# ─── Similarity Search ────────────────────────────────────────────────────────

def cosine_search(query: np.ndarray, matrix: np.ndarray, top_k: int):
    if FAISS_AVAILABLE and matrix.shape[0] > 0:
        try:
            idx = faiss.IndexFlatIP(matrix.shape[1])
            idx.add(matrix.copy())
            dists, idxs = idx.search(query.reshape(1, -1), top_k)
            return dists[0], idxs[0]
        except Exception:
            pass
    sims = matrix @ query
    top = np.argsort(-sims)[:top_k]
    return sims[top], top


def euclidean_search(query: np.ndarray, matrix: np.ndarray, top_k: int):
    if FAISS_AVAILABLE and matrix.shape[0] > 0:
        try:
            idx = faiss.IndexFlatL2(matrix.shape[1])
            idx.add(matrix.copy())
            dists, idxs = idx.search(query.reshape(1, -1), top_k)
            return dists[0], idxs[0]
        except Exception:
            pass
    dists = np.linalg.norm(matrix - query, axis=1)
    top = np.argsort(dists)[:top_k]
    return dists[top], top


# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    load_tf_model()

    # Detect extractor upgrade: if the tag changed, re-index everything
    current_tag = extractor_tag()
    previous_tag = EXTRACTOR_TAG_PATH.read_text().strip() if EXTRACTOR_TAG_PATH.exists() else ""

    load_persisted_state()

    needs_reindex = (
        (previous_tag != current_tag and len(metadata) > 0) or
        (feature_matrix is not None and feature_matrix.shape[0] == 0 and len(metadata) > 0)
    )
    if needs_reindex:
        logger.info(f"Re-indexing {len(metadata)} images (extractor: {previous_tag!r} → {current_tag!r})")
        reindexed = reindex_all_dataset_images()
        logger.info(f"Re-indexed {reindexed} images")

    EXTRACTOR_TAG_PATH.write_text(current_tag)

    logger.info(
        f"BOEW ML Service ready | extractor={current_tag} | "
        f"index={len(metadata)} images | FAISS={'yes' if FAISS_AVAILABLE else 'numpy'}"
    )


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class IndexRequest(BaseModel):
    image_path: str
    image_id: int
    category: Optional[str] = None


class RetrieveRequest(BaseModel):
    image_path: str
    top_k: int = 10
    metric: str = "cosine"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/healthz")
def health():
    return {"status": "ok", "index_size": len(metadata)}


@app.get("/status")
def get_status():
    return {
        "online": True,
        "index_size": len(metadata),
        "model_loaded": tf_loaded,
        "extractor": extractor_tag(),
        "skimage_available": SKIMAGE_AVAILABLE,
        "encryption_enabled": True,
        "last_indexed_at": last_indexed_at,
        "faiss_available": FAISS_AVAILABLE,
    }


@app.post("/index")
def index_image(req: IndexRequest):
    global feature_matrix, last_indexed_at

    if not Path(req.image_path).exists():
        raise HTTPException(404, f"Image not found: {req.image_path}")

    try:
        features = extract_features(req.image_path)
    except Exception as e:
        raise HTTPException(500, f"Feature extraction failed: {e}")

    enc = encrypt_features(features)
    (FEATURES_DIR / f"{req.image_id}.enc").write_bytes(enc)

    filename = Path(req.image_path).name

    global metadata
    metadata = [m for m in metadata if m["id"] != req.image_id]
    metadata.append({
        "id": req.image_id,
        "filename": filename,
        "abs_path": req.image_path,
        "path": filename,
        "category": req.category,
    })

    rebuild_matrix_from_files()
    last_indexed_at = datetime.utcnow().isoformat()
    save_metadata()

    return {"indexed": True, "image_id": req.image_id, "index_size": len(metadata)}


@app.delete("/index/{image_id}")
def remove_from_index(image_id: int):
    global metadata

    fp = FEATURES_DIR / f"{image_id}.enc"
    if fp.exists():
        fp.unlink()

    metadata = [m for m in metadata if m["id"] != image_id]
    rebuild_matrix_from_files()
    save_metadata()

    return {"removed": True, "image_id": image_id, "index_size": len(metadata)}


@app.post("/retrieve")
def retrieve_similar(req: RetrieveRequest):
    global feature_matrix

    if not Path(req.image_path).exists():
        raise HTTPException(404, f"Query image not found: {req.image_path}")

    if not metadata or feature_matrix is None or feature_matrix.shape[0] == 0:
        raise HTTPException(400, "Dataset is empty. Upload images first.")

    t0 = time.time()

    try:
        query_feat = extract_features(req.image_path)
    except Exception as e:
        raise HTTPException(500, f"Feature extraction failed: {e}")

    top_k = min(req.top_k, len(metadata))

    if req.metric == "cosine":
        scores, idxs = cosine_search(query_feat, feature_matrix, top_k)
        sim_scores = [float(max(0.0, min(1.0, s))) for s in scores]
        distances = [float(1.0 - s) for s in scores]
    else:
        dists, idxs = euclidean_search(query_feat, feature_matrix, top_k)
        max_d = float(max(dists)) + 1e-10
        sim_scores = [float(1.0 - d / max_d) for d in dists]
        distances = [float(d) for d in dists]

    results = []
    for rank, (idx, sim, dist) in enumerate(zip(idxs, sim_scores, distances), 1):
        if idx < 0 or idx >= len(metadata):
            continue
        meta = metadata[idx]
        results.append({
            "rank": rank,
            "image_id": meta["id"],
            "filename": meta["filename"],
            "path": meta["path"],
            "category": meta.get("category"),
            "similarity_score": round(sim, 4),
            "distance": round(dist, 4),
        })

    elapsed_ms = (time.time() - t0) * 1000
    return {"results": results, "retrieval_time_ms": round(elapsed_ms, 2)}


@app.post("/rebuild-index")
def rebuild_index_endpoint():
    global last_indexed_at
    reindexed = reindex_all_dataset_images()
    if reindexed == 0:
        # fallback: just rebuild matrix from existing .enc files
        rebuild_matrix_from_files()
        last_indexed_at = datetime.utcnow().isoformat()
        save_metadata()
    return {"indexed_count": len(metadata)}
