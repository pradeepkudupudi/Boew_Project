import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { createLocalDb } from "./local-db";

const { Pool } = pg;

export let pool: any = null;
export let db: any;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.warn("PostgreSQL connection failed, using local standalone DB", err);
    db = createLocalDb();
  }
} else {
  // Offline & standalone local laptop mode
  db = createLocalDb();
}

export * from "./schema";
