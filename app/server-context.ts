import "dotenv/config";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { loadEnv, type Env } from "~/env.server";
import { createS3Storage, type Storage } from "~/lib/storage.server";
import { createSessionStorage } from "~/lib/session.server";

type DB = ReturnType<typeof createDb>;

function createDb(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export interface ServerContext {
  db: DB;
  storage: Storage;
  env: Env;
  sessionStorage: ReturnType<typeof createSessionStorage>;
}

let cached: ServerContext | undefined;

export function getServerContext(): ServerContext {
  if (cached) return cached;
  const env = loadEnv();
  cached = {
    db: createDb(env.DB_PATH),
    storage: createS3Storage(env),
    env,
    sessionStorage: createSessionStorage(env.SESSION_SECRET),
  };
  return cached;
}
