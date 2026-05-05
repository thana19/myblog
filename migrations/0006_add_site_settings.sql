CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('site_name', 'My Blog');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('tagline', 'A personal blog.');
