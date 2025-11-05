import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

declare global {
  var __pgPool: Pool | undefined;
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const pool = global.__pgPool ?? new Pool({ connectionString });

export const db = global.__db ?? drizzle(pool, { schema });

if (!global.__pgPool) {
  global.__pgPool = pool;
}
if (!global.__db) {
  global.__db = db;
}
