import "dotenv/config";
import Database from "better-sqlite3";
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const dbPath = process.env.DB_PATH ?? "./data/myblog.db";
const migrationsDir = "./migrations";

mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const applied = new Set(
  db.prepare("SELECT name FROM _migrations").all().map((r) => r.name)
);

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  db.transaction(() => {
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  })();
  console.log(`✓ applied ${file}`);
  count++;
}

if (count === 0) {
  console.log("✓ no pending migrations");
} else {
  console.log(`\n✓ applied ${count} migration(s) → ${dbPath}`);
}

db.close();
