type DB = import("better-sqlite3").Database;

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  pinned: number;
  view_count: number;
}

export interface Page {
  slug: string;
  content: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export async function getPublishedPosts(
  db: DB,
  opts: { categorySlug?: string; search?: string; limit?: number; offset?: number } = {}
): Promise<Post[]> {
  const { categorySlug, search, limit = 12, offset = 0 } = opts;

  if (search) {
    const sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM posts_fts fts
      JOIN posts p ON p.id = fts.rowid
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE fts.posts_fts MATCH ?
        AND p.status = 'published'
        ${categorySlug ? "AND c.slug = ?" : ""}
      ORDER BY p.pinned DESC, p.published_at DESC
      LIMIT ? OFFSET ?
    `;
    const params = categorySlug
      ? [search, categorySlug, limit, offset]
      : [search, limit, offset];
    return db.prepare(sql).all(...params) as Post[];
  }

  let query = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'published'
  `;
  const params: (string | number)[] = [];

  if (categorySlug) {
    query += " AND c.slug = ?";
    params.push(categorySlug);
  }

  query += " ORDER BY p.pinned DESC, p.published_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  return db.prepare(query).all(...params) as Post[];
}

export async function getPostBySlug(db: DB, slug: string): Promise<Post | null> {
  const result = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ?`
    )
    .get(slug) as Post | undefined;
  return result ?? null;
}

export async function getPostById(db: DB, id: number): Promise<Post | null> {
  const result = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`
    )
    .get(id) as Post | undefined;
  return result ?? null;
}

export async function getAllPosts(
  db: DB,
  opts: { limit?: number; offset?: number } = {}
): Promise<Post[]> {
  const { limit = 50, offset = 0 } = opts;
  return db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.pinned DESC, p.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as Post[];
}

export async function createPost(
  db: DB,
  data: {
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
    featured_image?: string;
    category_id?: number;
    status: "draft" | "published";
    pinned?: number;
    published_at?: string | null;
  }
): Promise<number> {
  const published_at =
    data.published_at !== undefined
      ? data.published_at
      : data.status === "published"
      ? new Date().toISOString()
      : null;
  const result = db
    .prepare(
      `INSERT INTO posts (slug, title, excerpt, content, featured_image, category_id, status, published_at, pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.slug,
      data.title,
      data.excerpt ?? null,
      data.content,
      data.featured_image ?? null,
      data.category_id ?? null,
      data.status,
      published_at,
      data.pinned ?? 0
    );
  return Number(result.lastInsertRowid);
}

export async function updatePost(
  db: DB,
  id: number,
  data: {
    slug?: string;
    title?: string;
    excerpt?: string;
    content?: string;
    featured_image?: string;
    category_id?: number | null;
    status?: "draft" | "published";
    pinned?: number;
    published_at?: string | null;
  }
): Promise<void> {
  const current = await getPostById(db, id);
  if (!current) throw new Error("Post not found");

  const published_at =
    data.published_at !== undefined
      ? data.published_at
      : data.status === "published" && current.status === "draft"
      ? new Date().toISOString()
      : current.published_at;

  db.prepare(
    `UPDATE posts
     SET slug = ?, title = ?, excerpt = ?, content = ?, featured_image = ?,
         category_id = ?, status = ?, published_at = ?, pinned = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    data.slug ?? current.slug,
    data.title ?? current.title,
    data.excerpt !== undefined ? data.excerpt : current.excerpt,
    data.content ?? current.content,
    data.featured_image !== undefined ? data.featured_image : current.featured_image,
    data.category_id !== undefined ? data.category_id : current.category_id,
    data.status ?? current.status,
    published_at,
    data.pinned !== undefined ? data.pinned : current.pinned,
    id
  );
}

export async function deletePost(db: DB, id: number): Promise<void> {
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
}

export async function incrementViewCount(db: DB, slug: string): Promise<void> {
  db.prepare("UPDATE posts SET view_count = view_count + 1 WHERE slug = ?").run(slug);
}

export async function getCategories(db: DB): Promise<Category[]> {
  return db.prepare("SELECT * FROM categories ORDER BY name ASC").all() as Category[];
}

export async function createCategory(db: DB, name: string, slug: string): Promise<void> {
  db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run(name, slug);
}

export async function updateCategory(
  db: DB,
  id: number,
  name: string,
  slug: string
): Promise<void> {
  db.prepare("UPDATE categories SET name = ?, slug = ? WHERE id = ?").run(name, slug, id);
}

export async function deleteCategory(db: DB, id: number): Promise<void> {
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
}

export async function getPostTags(db: DB, postId: number): Promise<Tag[]> {
  return db
    .prepare(
      `SELECT t.* FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       WHERE pt.post_id = ?`
    )
    .all(postId) as Tag[];
}

export async function syncPostTags(
  db: DB,
  postId: number,
  tagNames: string[]
): Promise<void> {
  const tx = db.transaction((names: string[]) => {
    db.prepare("DELETE FROM post_tags WHERE post_id = ?").run(postId);
    const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)");
    const findTag = db.prepare("SELECT id FROM tags WHERE slug = ?");
    const linkTag = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");
    for (const name of names) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      insertTag.run(name, slug);
      const tag = findTag.get(slug) as { id: number } | undefined;
      if (tag) linkTag.run(postId, tag.id);
    }
  });
  tx(tagNames);
}

export async function getPage(db: DB, slug: string): Promise<Page | null> {
  const result = db.prepare("SELECT * FROM pages WHERE slug = ?").get(slug) as
    | Page
    | undefined;
  return result ?? null;
}

export async function upsertPage(db: DB, slug: string, content: string): Promise<void> {
  db.prepare(
    `INSERT INTO pages (slug, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slug) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP`
  ).run(slug, content);
}

export interface AdminCredential {
  username: string;
  password_hash: string;
}

export async function getAdminCredentials(
  db: DB,
  username: string
): Promise<AdminCredential | null> {
  const result = db
    .prepare("SELECT username, password_hash FROM admin_credentials WHERE username = ?")
    .get(username) as AdminCredential | undefined;
  return result ?? null;
}

export async function upsertAdminPassword(
  db: DB,
  username: string,
  passwordHash: string
): Promise<void> {
  db.prepare(
    `INSERT INTO admin_credentials (username, password_hash, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, updated_at = CURRENT_TIMESTAMP`
  ).run(username, passwordHash);
}

export async function getAnyAdminCredential(db: DB): Promise<AdminCredential | null> {
  const result = db
    .prepare("SELECT username, password_hash FROM admin_credentials LIMIT 1")
    .get() as AdminCredential | undefined;
  return result ?? null;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
}

const SITE_DEFAULTS: SiteSettings = {
  site_name: "My Blog",
  tagline: "A personal blog.",
};

export async function getSiteSettings(db: DB): Promise<SiteSettings> {
  const rows = db.prepare("SELECT key, value FROM site_settings").all() as {
    key: string;
    value: string;
  }[];
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    site_name: map.site_name ?? SITE_DEFAULTS.site_name,
    tagline: map.tagline ?? SITE_DEFAULTS.tagline,
  };
}

export async function updateSiteSettings(
  db: DB,
  settings: Partial<SiteSettings>
): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  );
  const tx = db.transaction((entries: [string, string][]) => {
    for (const [key, value] of entries) {
      stmt.run(key, value);
    }
  });
  const entries = Object.entries(settings).filter(([, v]) => v !== undefined) as [
    string,
    string
  ][];
  tx(entries);
}
