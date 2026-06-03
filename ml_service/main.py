"""
BOEW ML Service — Bag-of-Encrypted-Words Content-Based Image Retrieval
FastAPI service with ResNet50 feature extraction, FAISS/NumPy indexing, and AES encryption.
"""

import os
import json
import time
import hashlib
import logging
import traceback
from pathlib import Path
from typing import Optional
from datetime import datetime

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Try importing faiss; fall back to pure NumPy similarity search
try:
    import faiss
    FAISS_AVAILABLE = True
    logging.getLogger("boew").info("FAISS loaded successfully")
except Exception:
    FAISS_AVAILABLE = False
    logging.getLogger("boew").warning("FAISS unavailable — using NumPy fallback for similarity search")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("boew")

app = FastAPI(title="BOEW ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
DATASET_DIR = BASE_DIR / "dataset"
FEATURES_DIR = BASE_DIR / "encrypted_features"
INDEX_DIR = BASE_DIR / "faiss_index"

for d in [FEATURES_DIR, INDEX_DIR]:
    d.mkdir(parents=True, exist_ok=True)

INDEX_PATH = INDEX_DIR / "boew.index"
META_PATH = INDEX_DIR / "metadata.json"

# BOEW encryption key derived from SESSION_SECRET
ENCRYPTION_KEY = hashlib.sha256(
    (os.getenv("SESSION_SECRET", "boew-encryption-key")).encode()
).digest()

# ─── Global State ─────────────────────────────────────────────────────────────
model = None
model_loaded = False
last_indexed_at: Optional[str] = None

# In-memory numpy arrays for similarity search (fallback + primary store)
feature_matrix: Optional[np.ndarray] = None  # shape (N, FEATURE_DIM)
metadata: list = []  # [{id, filename, path, category}]
FEATURE_DIM = 2048  # ResNet50 penultimate layer


# ─── BOEW Encryption (AES-CBC) ────────────────────────────────────────────────

def encrypt_features(features: np.ndarray) -> bytes:
    """Encrypt feature vectors using AES-CBC (Bag-of-Encrypted-Words)."""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend
    iv = os.urandom(16)
    feature_bytes = features.astype(np.float32).tobytes()
    pad_len = 16 - (len(feature_bytes) % 16)
    feature_bytes_padded = feature_bytes + bytes([pad_len] * pad_len)
    cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
    enc = cipher.encryptor()
    ciphertext = enc.update(feature_bytes_padded) + enc.finalize()
    return iv + ciphertext


def decrypt_features(data: bytes) -> np.ndarray:
    """Decrypt AES-CBC encrypted feature vectors."""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend
    iv = data[:16]
    ciphertext = data[16:]
    cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
    dec = cipher.decryptor()
    padded = dec.update(ciphertext) + dec.finalize()
    pad_len = padded[-1]
    feature_bytes = padded[:-pad_len]
    return np.frombuffer(feature_bytes, dtype=np.float32).copy()


# ─── Feature Extraction ───────────────────────────────────────────────────────

def load_model():
    global model, model_loaded
    try:
        import tensorflow as tf
        from tensorflow.keras.applications import ResNet50
        from tensorflow.keras.models import Model
        base = ResNet50(weights="imagenet", include_top=True)
        model = Model(inputs=base.input, outputs=base.layers[-2].output)
        model_loaded = True
        logger.info("ResNet50 loaded successfully")
    except Exception as e:
        logger.warning(f"TF/ResNet50 unavailable — using deterministic mock extractor: {e}")
        model_loaded = False


def extract_features_tf(image_path: str) -> np.ndarray:
    from tensorflow.keras.applications.resnet50 import preprocess_input
    from tensorflow.keras.preprocessing import image as keras_image
    img = keras_image.load_img(image_path, target_size=(224, 224))
    x = keras_image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    feat = model.predict(x, verbose=0)[0]
    norm = np.linalg.norm(feat)
    return (feat / norm if norm > 0 else feat).astype(np.float32)


def extract_features_mock(image_path: str) -> np.ndarray:
    """Deterministic content-aware mock extractor using image pixel stats."""
    try:
        from PIL import Image
        img = Image.open(image_path).convert("RGB").resize((32, 32))
        arr = np.array(img, dtype=np.float32).flatten()
        # Tile to FEATURE_DIM with some variation
        reps = FEATURE_DIM // len(arr) + 1
        feat = np.tile(arr, reps)[:FEATURE_DIM]
        # Add per-file hash noise for uniqueness
        seed = int(hashlib.md5(image_path.encode()).hexdigest(), 16) % (2**32)
        rng = np.random.RandomState(seed)
        feat = feat + rng.randn(FEATURE_DIM).astype(np.float32) * 10.0
    except Exception:
        seed = int(hashlib.md5(image_path.encode()).hexdigest(), 16) % (2**32)
        rng = np.random.RandomState(seed)
        feat = rng.randn(FEATURE_DIM).astype(np.float32)
    norm = np.linalg.norm(feat)
    return (feat / norm if norm > 0 else feat).astype(np.float32)


def extract_features(image_path: str) -> np.ndarray:
    return extract_features_tf(image_path) if model_loaded else extract_features_mock(image_path)


# ─── Index Management ─────────────────────────────────────────────────────────

def rebuild_matrix_from_files():
    """Rebuild in-memory feature matrix by decrypting all .enc files."""
    global feature_matrix, metadata
    loaded_meta = []
    vectors = []
    for meta in metadata:
        feat_path = FEATURES_DIR / f"{meta['id']}.enc"
        if feat_path.exists():
            try:
                feat = decrypt_features(feat_path.read_bytes())
                vectors.append(feat)
                loaded_meta.append(meta)
            except Exception as e:
                logger.warning(f"Failed to decrypt features for {meta['id']}: {e}")
    metadata = loaded_meta
    feature_matrix = np.stack(vectors, axis=0) if vectors else np.empty((0, FEATURE_DIM), dtype=np.float32)


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
            logger.info(f"Loaded metadata for {len(metadata)} images")
        except Exception as e:
            logger.error(f"Failed to load metadata: {e}")
            metadata = []
    rebuild_matrix_from_files()


# ─── Similarity Search ────────────────────────────────────────────────────────

def cosine_search(query: np.ndarray, matrix: np.ndarray, top_k: int):
    """Cosine similarity search using NumPy (or FAISS if available)."""
    if FAISS_AVAILABLE and matrix.shape[0] > 0:
        try:
            idx_flat = faiss.IndexFlatIP(matrix.shape[1])
            idx_flat.add(matrix.copy())
            dists, idxs = idx_flat.search(query.reshape(1, -1), top_k)
            return dists[0], idxs[0]
        except Exception:
            pass
    # NumPy fallback
    sims = matrix @ query  # dot product of normalized vectors = cosine similarity
    top = np.argsort(-sims)[:top_k]
    return sims[top], top


def euclidean_search(query: np.ndarray, matrix: np.ndarray, top_k: int):
    """Euclidean distance search using NumPy (or FAISS if available)."""
    if FAISS_AVAILABLE and matrix.shape[0] > 0:
        try:
            idx_flat = faiss.IndexFlatL2(matrix.shape[1])
            idx_flat.add(matrix.copy())
            dists, idxs = idx_flat.search(query.reshape(1, -1), top_k)
            return dists[0], idxs[0]
        except Exception:
            pass
    # NumPy fallback
    diffs = matrix - query
    dists = np.linalg.norm(diffs, axis=1)
    top = np.argsort(dists)[:top_k]
    return dists[top], top


# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    load_model()
    load_persisted_state()
    logger.info(f"BOEW ML Service ready — {len(metadata)} images indexed, FAISS={'yes' if FAISS_AVAILABLE else 'no (numpy fallback)'}")


# ─── Request Models ───────────────────────────────────────────────────────────

class IndexRequest(BaseModel):
    image_path: str
    image_id: int
    category: Optional[str] = None


class RetrieveRequest(BaseModel):
    image_path: str
    top_k: int = 10
    metric: str = "cosine"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/status")
def get_status():
    return {
        "online": True,
        "index_size": len(metadata),
        "model_loaded": model_loaded,
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

    # BOEW: Encrypt and persist feature vector
    encrypted = encrypt_features(features)
    feat_path = FEATURES_DIR / f"{req.image_id}.enc"
    feat_path.write_bytes(encrypted)

    filename = Path(req.image_path).name

    # Remove old entry if exists
    global metadata
    metadata = [m for m in metadata if m["id"] != req.image_id]

    metadata.append({
        "id": req.image_id,
        "filename": filename,
        "path": filename,
        "category": req.category,
    })

    # Rebuild in-memory matrix
    rebuild_matrix_from_files()
    last_indexed_at = datetime.utcnow().isoformat()
    save_metadata()

    return {"indexed": True, "image_id": req.image_id, "index_size": len(metadata)}


@app.delete("/index/{image_id}")
def remove_from_index(image_id: int):
    global metadata

    feat_path = FEATURES_DIR / f"{image_id}.enc"
    if feat_path.exists():
        feat_path.unlink()

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
        raise HTTPException(400, "Dataset is empty. Please upload images first.")

    start = time.time()

    try:
        query_feat = extract_features(req.image_path)
    except Exception as e:
        raise HTTPException(500, f"Feature extraction failed: {e}")

    top_k = min(req.top_k, len(metadata))

    if req.metric == "cosine":
        scores, idxs = cosine_search(query_feat, feature_matrix, top_k)
        # Scores are cosine similarities in [-1, 1]; clip to [0, 1]
        similarity_scores = [float(max(0.0, min(1.0, s))) for s in scores]
        distances = [float(1.0 - s) for s in scores]
    else:
        dists, idxs = euclidean_search(query_feat, feature_matrix, top_k)
        max_dist = float(max(dists)) + 1e-10
        similarity_scores = [float(1.0 - d / max_dist) for d in dists]
        distances = [float(d) for d in dists]

    results = []
    for rank, (idx, sim, dist) in enumerate(zip(idxs, similarity_scores, distances), 1):
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

    elapsed_ms = (time.time() - start) * 1000
    return {"results": results, "retrieval_time_ms": round(elapsed_ms, 2)}


@app.post("/rebuild-index")
def rebuild_index_endpoint():
    """Rebuild the in-memory feature matrix from all encrypted feature files."""
    global last_indexed_at

    # Rebuild from all .enc files
    rebuild_matrix_from_files()
    last_indexed_at = datetime.utcnow().isoformat()
    save_metadata()

    return {"indexed_count": len(metadata)}


@app.get("/healthz")
def health():
    return {"status": "ok", "index_size": len(metadata)}
