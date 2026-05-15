# Features — myblog

## Public Pages

| Feature | Route | Description |
|---------|-------|-------------|
| Home / Blog Feed | `/` | Featured layout (1 large + 2 sidebar + grid), full-text search, Load More pagination (9 posts/page) |
| Post Detail | `/post/:slug` | Markdown rendering, view count, tags (clickable links), social share (Facebook/X), edit button for admin |
| Category Archive | `/:slug` | Posts filtered by category, 3-column grid, Load More pagination |
| Tag Archive | `/tag/:slug` | Posts filtered by tag (via post_tags join), 3-column grid, Load More pagination |
| About | `/about` | Static page — markdown content from database |
| Contact | `/contact` | Static page — markdown content from database |
| Profile | `/profile` | Static page — markdown content from database |
| RSS Feed | `/feed.xml` | RSS 2.0, 20 most recent published posts, cache 1 hour |

## Authentication & Setup

| Feature | Route | Description |
|---------|-------|-------------|
| Setup Wizard | `/setup` | First-time admin creation (username + password), auto-redirects to admin if already set up |
| Login | `/login` | Username/password auth, redirects to `/setup` if no admin exists |
| Password Auth | `/auth/password` | PBKDF2-SHA256 (100,000 iterations, 16-byte salt) verification, session cookie 30 days |
| Logout | `/auth/logout` | Destroy session, redirect to home |

## Admin

| Feature | Route | Description |
|---------|-------|-------------|
| Posts List | `/admin` | All posts table, search by title/slug, pin/unpin, delete, view count, status badges |
| New Post | `/admin/posts/new` | Markdown editor, title, slug (auto-gen), excerpt, featured image upload/URL, category, tags, publish date, pinned toggle, draft/publish |
| Edit Post | `/admin/posts/:id/edit` | Pre-filled form, same fields as create |
| Categories | `/admin/categories` | Create/delete categories, auto-slugify |
| Static Page Editor | `/admin/pages/:slug` | Edit about / contact / profile via markdown editor |
| Settings | `/admin/settings` | Site name, tagline, show view count toggle, username/password management |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/more-posts` | GET | Pagination API — params: `?q=`, `?category=`, `?tag=`, `?page=` — returns `{ posts, hasMore, page }` |
| `/api/upload-image` | POST | Upload image, processed via sharp (resize 1600px, convert to WebP 85%), stored in S3/MinIO, returns public URL |
| `/api/export-posts` | GET | Download all posts as Markdown zip (admin only) — frontmatter + content per file |
| `/og/:slug` | GET | Auto-generated OG image PNG 1200×630 — if post has featured_image: used as full-bleed bg with dark overlay; otherwise solid dark bg `#10131a`. Title, excerpt, category badge overlay. |

## Content Features

- **Pinned Posts** — pinned posts appear first in all listings (home, category, tag)
- **View Count** — incremented per post page visit, displayed in admin and post detail; optionally shown on home page cards (toggled via Settings → แสดงยอดวิวบนหน้าแรก)
- **Full-text Search** — SQLite FTS5 virtual table on title, excerpt, content with auto-sync triggers
- **Markdown Editor** — `@uiw/react-md-editor` v4, split-view, dark mode
- **Markdown Rendering** — `@uiw/react-markdown-preview` (lazy-loaded, client-side)
- **Tags** — many-to-many via `post_tags` join table, auto-created on save
- **Social Share** — Facebook and X (Twitter) share buttons on post detail
- **Image Processing** — sharp: resize to 1600×1600px max, convert to WebP (GIF preserved as-is)
- **Export Posts** — Download all posts as `.md` files in a zip archive (YAML frontmatter + content)
- **Dark / Light Mode** — Toggle via localStorage, system default dark, blocking script prevents flash
- **OG Image Auto-Gen** — Every post has `og:image` at `/og/:slug` (satori JSX → SVG → PNG via sharp, font from @fontsource/inter). If post has `featured_image`: fetched and embedded as base64 data URI, used as full-bleed background with `rgba(10,13,20,0.72)` dark overlay for readability. Fallback: solid dark bg `#10131a`. Cached 24h.

## Database Schema (SQLite / better-sqlite3)

| Table | Purpose |
|-------|---------|
| `posts` | id, slug, title, excerpt, content, featured_image, category_id, status, published_at, pinned, view_count |
| `categories` | id, name, slug |
| `tags` | id, name, slug |
| `post_tags` | post_id, tag_id (many-to-many) |
| `pages` | slug (about/contact/profile), content |
| `admin_credentials` | username, password_hash (PBKDF2-SHA256) |
| `site_settings` | key-value (site_name, tagline) |
| `posts_fts` | FTS5 virtual table on posts |

### Migrations

| File | Change |
|------|--------|
| `0001_init.sql` | Create all core tables, FTS5, seed categories |
| `0002_add_pinned.sql` | Add `pinned` column to posts |
| `0003_add_pages.sql` | Create pages table, seed about/contact/profile |
| `0004_add_view_count.sql` | Add `view_count` column to posts |
| `0005_add_admin_credentials.sql` | Create admin_credentials table |
| `0006_add_site_settings.sql` | Create site_settings table, seed defaults |

## Infrastructure

| Component | Detail |
|-----------|--------|
| Runtime | Node.js 22 + Express |
| Framework | React Router v7 + `@react-router/express` adapter |
| Database | SQLite via better-sqlite3 (WAL mode, foreign keys on) |
| Image Storage | S3-compatible — MinIO (dev) or Cloudflare R2 / AWS S3 (prod) |
| Image Processing | sharp — resize, WebP conversion |
| Styling | Tailwind CSS v4, Material Design 3 color system |
| Password | PBKDF2-SHA256, 100,000 iterations |
| Session | Cookie-based, 30 days, httpOnly, sameSite=lax |
| Docker | Multi-stage Dockerfile (node:22-alpine), Docker Compose (app + MinIO) |
| Ports | App: 3000, MinIO API: 9000, MinIO Console: 9001 |
