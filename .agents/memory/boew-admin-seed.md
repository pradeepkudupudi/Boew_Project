---
name: BOEW Admin Seeding
description: How to re-seed the admin user when the bcrypt hash is stale or missing.
---

The admin user (`admin@boew.ai` / `admin123`, role=`admin`) is seeded by running `artifacts/api-server/seed.mjs` directly with `node`.

**Why:** pnpm hoists packages into a virtual store, so there's no `node_modules/pg` or `node_modules/bcrypt` directly in the artifact directory. The seed script imports from the absolute pnpm store paths to work around this.

**How to apply:** If login fails with "Invalid credentials" after a fresh environment, run:
```
node artifacts/api-server/seed.mjs
```
The script uses hardcoded pnpm store paths:
- `/home/runner/workspace/node_modules/.pnpm/bcrypt@6.0.0/node_modules/bcrypt/bcrypt.js`
- `/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js`

If bcrypt or pg versions change, update these paths in seed.mjs.
