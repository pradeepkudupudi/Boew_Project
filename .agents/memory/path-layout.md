---
name: Path layout
description: API server CWD vs ML service BASE_DIR — they point to different directories.
---
**Rule:** API server CWD is `artifacts/api-server/` (set by pnpm workflow). ML service `BASE_DIR = Path(__file__).parent.parent` = `/home/runner/workspace/`. These diverge for file storage:
- Dataset images: `artifacts/api-server/dataset/<uuid>.jpg`
- Encrypted features: `/home/runner/workspace/encrypted_features/<id>.enc`
- FAISS index/metadata: `/home/runner/workspace/faiss_index/metadata.json`

**Why:** The API server is run from its own package dir; the ML service is run from `ml_service/` with `BASE_DIR` set to workspace root. They were designed to share `encrypted_features/` and `faiss_index/` at the workspace root but the dataset lives in the API server's own dir.

**How to apply:** When writing re-index or rebuild scripts, always use `artifacts/api-server/dataset/<filename>` as the image source. The ML service's `reindex_all_dataset_images()` searches `BASE_DIR / "artifacts" / "api-server" / "dataset"` as the first candidate, then falls back to `BASE_DIR / "dataset"`.
