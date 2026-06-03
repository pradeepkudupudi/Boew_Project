# BOEW — Bag-of-Encrypted-Words Image Retrieval

A full-stack Content-Based Image Retrieval (CBIR) system. Users upload images to an encrypted dataset, then submit query images to find visually similar matches using AI feature extraction and AES-encrypted vector search.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from $PORT, defaults to 5000)
- `cd ml_service && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000` — run ML service
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — used as JWT secret and AES encryption key derivation

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Pino logger
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- ML: FastAPI + Python, ResNet50 (TensorFlow, falls back to content-aware mock), FAISS (falls back to NumPy cosine/euclidean)
- Encryption: AES-CBC (cryptography lib), key derived from SESSION_SECRET
- Frontend: React + Vite, Tailwind, shadcn/ui, wouter, TanStack Query

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all routes)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit manually)
- `lib/api-zod/src/generated/` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle DB schema (users, dataset_images, retrieval_history)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, dataset, retrieval, history, admin)
- `artifacts/api-server/src/lib/auth.ts` — JWT middleware, `requireAuth`
- `ml_service/main.py` — FastAPI ML service (feature extraction, encryption, similarity search)
- `artifacts/boew-frontend/src/` — React frontend

## Architecture decisions

- **BOEW encryption**: Feature vectors are AES-CBC encrypted before being persisted to `encrypted_features/<id>.enc`. The key is derived via SHA-256 from SESSION_SECRET. Decryption happens only in-memory during index rebuild and query.
- **FAISS optional**: The ML service tries `import faiss` at startup; if it fails (e.g. v1.9.0 SuperKMeans bug), it falls back to NumPy matrix operations for cosine/euclidean similarity search transparently.
- **TensorFlow optional**: ResNet50 feature extraction requires TensorFlow. If unavailable, a deterministic content-aware mock extractor (PIL pixel stats + per-file hash noise) is used, so the service always starts.
- **In-memory index**: Feature matrix is held in RAM as a NumPy array, rebuilt from encrypted `.enc` files on startup. Metadata (image IDs, filenames, categories) is persisted to `faiss_index/metadata.json`.
- **Auth token via fetch patch**: The frontend patches `window.fetch` in `use-auth.tsx` to auto-attach `Authorization: Bearer <token>` from localStorage, rather than threading the token through every call site.

## Product

- **Upload**: Drag-and-drop upload of images to the encrypted dataset; ML service indexes them immediately.
- **Query**: Upload a query image; system returns top-K visually similar images with similarity scores.
- **Dataset**: Browse all indexed images, filter by category, delete entries.
- **History**: Full retrieval log with per-query metrics (mAP, precision, recall, latency).
- **Admin**: System stats dashboard, ML service health, index rebuild trigger.

## User preferences

- Dark "command center" terminal aesthetic throughout the UI
- Admin credentials: `admin@boew.ai` / `admin123`

## Gotchas

- **Re-seeding admin**: If the admin password hash gets stale, run `node artifacts/api-server/seed.mjs` (uses pnpm store paths for bcrypt/pg directly).
- **faiss-cpu 1.9.0 bug**: `SuperKMeans` NameError on import — handled by try/except in `ml_service/main.py`. Do not attempt to use FAISS directly without the guard.
- **bcrypt native build**: bcrypt requires `pnpm approve-builds` for native bindings. The JS fallback handles this gracefully.
- **Static files**: API server serves uploads at `/api/uploads/` and dataset images at `/api/images/` (from `./uploads/` and `./dataset/` relative to the api-server CWD).
- **ML service CWD**: The ML service is started from `ml_service/` but reads/writes `encrypted_features/`, `faiss_index/`, `dataset/`, and `uploads/` relative to the **parent** directory (`BASE_DIR = Path(__file__).parent.parent`).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
