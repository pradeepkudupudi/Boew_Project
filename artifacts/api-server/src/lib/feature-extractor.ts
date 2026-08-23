import fs from "fs";
import path from "path";
import crypto from "crypto";

const BASE_DIR = path.resolve(process.cwd());
const FEATURES_DIR = path.resolve(BASE_DIR, "encrypted_features");
const INDEX_DIR = path.resolve(BASE_DIR, "faiss_index");
const META_PATH = path.resolve(INDEX_DIR, "metadata.json");

[FEATURES_DIR, INDEX_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ENCRYPTION_KEY = crypto.createHash("sha256").update(process.env.SESSION_SECRET || "boew-encryption-key").digest();

export function encryptFeatureVector(vector: number[]): Buffer {
  const iv = crypto.randomBytes(16);
  const floatBuffer = Buffer.from(new Float32Array(vector).buffer);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(floatBuffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

export function decryptFeatureVector(data: Buffer): number[] {
  const iv = data.subarray(0, 16);
  const ct = data.subarray(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]);
  const float32 = new Float32Array(decrypted.buffer, decrypted.byteOffset, decrypted.byteLength / 4);
  return Array.from(float32);
}

/**
 * Deterministic color/byte-distribution feature extractor for local standalone mode
 */
export function extractLocalFeatures(filePath: string): number[] {
  try {
    const buffer = fs.readFileSync(filePath);
    const dims = 256;
    const vector = new Array(dims).fill(0);

    // Byte histogram distribution
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      vector[byte % dims] += 1;
    }

    // Add positional chunk distribution
    const chunkSize = Math.max(1, Math.floor(buffer.length / 64));
    for (let c = 0; c < 64; c++) {
      let sum = 0;
      const start = c * chunkSize;
      const end = Math.min(buffer.length, start + chunkSize);
      for (let j = start; j < end; j++) {
        sum += buffer[j];
      }
      vector[192 + (c % 64)] += sum / (chunkSize || 1);
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < dims; i++) norm += vector[i] * vector[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < dims; i++) vector[i] = vector[i] / norm;

    return vector;
  } catch (err) {
    // Deterministic fallback from path
    const hash = crypto.createHash("sha256").update(filePath).digest();
    const dims = 256;
    const vector = new Array(dims).fill(0);
    for (let i = 0; i < dims; i++) {
      vector[i] = (hash[i % hash.length] / 255) - 0.5;
    }
    return vector;
  }
}

export function saveLocalIndexEntry(imageId: number, filename: string, filePath: string, category: string | null) {
  try {
    const vector = extractLocalFeatures(filePath);
    const encrypted = encryptFeatureVector(vector);
    const encPath = path.resolve(FEATURES_DIR, `${imageId}.enc`);
    fs.writeFileSync(encPath, encrypted);

    let metaList: any[] = [];
    if (fs.existsSync(META_PATH)) {
      try {
        const raw = fs.readFileSync(META_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        metaList = parsed.metadata || [];
      } catch {}
    }

    metaList = metaList.filter((m) => m.id !== imageId);
    metaList.push({
      id: imageId,
      filename,
      abs_path: filePath,
      path: filename,
      category,
    });

    fs.writeFileSync(
      META_PATH,
      JSON.stringify({ metadata: metaList, last_indexed_at: new Date().toISOString() }, null, 2),
      "utf-8"
    );

    return true;
  } catch (err) {
    console.error("saveLocalIndexEntry error", err);
    return false;
  }
}

export function localCosineSearch(queryPath: string, topK: number = 10) {
  const queryVector = extractLocalFeatures(queryPath);
  let metaList: any[] = [];
  if (fs.existsSync(META_PATH)) {
    try {
      const raw = fs.readFileSync(META_PATH, "utf-8");
      metaList = JSON.parse(raw).metadata || [];
    } catch {}
  }

  const scored: Array<{
    rank: number;
    imageId: number;
    filename: string;
    path: string;
    category: string | null;
    similarityScore: number;
    distance: number;
  }> = [];

  for (const item of metaList) {
    const encPath = path.resolve(FEATURES_DIR, `${item.id}.enc`);
    if (fs.existsSync(encPath)) {
      try {
        const encData = fs.readFileSync(encPath);
        const itemVector = decryptFeatureVector(encData);

        // Cosine similarity
        let dot = 0;
        const len = Math.min(queryVector.length, itemVector.length);
        for (let i = 0; i < len; i++) {
          dot += queryVector[i] * itemVector[i];
        }

        const sim = Math.max(0, Math.min(1, dot));
        scored.push({
          rank: 0,
          imageId: item.id,
          filename: item.filename,
          path: item.path,
          category: item.category || null,
          similarityScore: Number(sim.toFixed(4)),
          distance: Number((1 - sim).toFixed(4)),
        });
      } catch {}
    }
  }

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  const top = scored.slice(0, topK).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return top;
}
