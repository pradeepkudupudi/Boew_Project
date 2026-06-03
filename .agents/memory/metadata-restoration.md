---
name: Metadata restoration
description: How to restore ML service metadata.json if it gets wiped.
---
**Rule:** If `faiss_index/metadata.json` gets wiped (e.g. after extractor upgrade), restore by calling the ML `/index` endpoint once per image using data from the DB.

**How to apply:**
```bash
node -e "
const pg = require('/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  const res = await client.query('SELECT id, filename, category FROM dataset_images ORDER BY id');
  // then call http://localhost:8000/index for each row with abs_path = artifacts/api-server/dataset/<filename>
  await client.end();
});
"
```
The ML service now stores `abs_path` in metadata so re-index candidates are found automatically on next restart.
