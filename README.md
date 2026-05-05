# myblog

Local-first personal blog platform — React Router v7, SQLite (FTS5), S3-compatible image storage.

## Stack
- **Framework:** React Router v7 (Remix architecture, SSR)
- **Server:** Node.js + Express
- **DB:** better-sqlite3 (file-based, FTS5 search)
- **Storage:** S3-compatible (MinIO local / R2 / S3 / DO Spaces)
- **Auth:** Username/password (PBKDF2-SHA256)
- **Editor:** @uiw/react-md-editor + @uiw/react-markdown-preview
- **Styling:** Tailwind CSS v4

## Quick start

```bash
# 1) Install
cp .env.example .env
npm install

# 2) Start MinIO (S3-compatible storage)
npm run minio:up
# MinIO console: http://localhost:9001 (minioadmin / minioadmin)
# Create bucket "myblog-images" + set public read policy

# 3) Apply DB migrations
npm run db:migrate

# 4) Run dev server
npm run dev
# http://localhost:3000
# First visit to /admin redirects to /setup wizard
```

## Production

```bash
npm run build
npm start
```

Deploy: copy `build/`, `migrations/`, `scripts/`, `package.json`, `server.mjs` to server.
Set `.env` with production values (S3_* pointing to MinIO/R2/S3 of your choice), run `npm ci --omit=dev`, `npm run db:migrate`, then `npm start` (or PM2/systemd).

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — published posts, search, categories |
| `/post/:slug` | Single post |
| `/:slug` | Category archive |
| `/about`, `/contact`, `/profile` | Static pages (markdown, edited via admin) |
| `/feed.xml` | RSS feed |
| `/setup` | First-run admin wizard |
| `/login` | Username/password login |
| `/admin` | Admin dashboard (posts, categories, pages, settings) |
