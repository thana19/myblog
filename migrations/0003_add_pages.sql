CREATE TABLE pages (
  slug TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pages (slug, content) VALUES
  ('about', ''),
  ('contact', ''),
  ('profile', '');
