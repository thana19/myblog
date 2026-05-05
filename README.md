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

# 3) Set MinIO bucket to public (run once)
docker exec myblog-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec myblog-minio mc anonymous set public local/myblog-images

# 4) Apply DB migrations
npm run db:migrate

# 5) Run dev server
npm run dev
# http://localhost:5173
# First visit to /admin redirects to /setup wizard
```

## MinIO

MinIO คือ S3-compatible object storage รันผ่าน Docker Compose ใช้เก็บรูปภาพที่ upload ผ่าน blog

| URL | ใช้สำหรับ |
|-----|----------|
| http://localhost:9000 | S3 API endpoint (ใช้ใน .env) |
| http://localhost:9001 | MinIO Console (Web UI) |

**Credentials:** `minioadmin` / `minioadmin`

### Start / Stop

```bash
npm run minio:up    # start MinIO (รัน Docker container ชื่อ myblog-minio)
npm run minio:down  # stop MinIO
```

> ต้องรัน `npm run minio:up` ทุกครั้งที่เปิดเครื่องใหม่ก่อนใช้ฟีเจอร์ upload รูปค่ะ

### First-time setup (ทำครั้งแรกครั้งเดียว)

หลัง `npm run minio:up` ครั้งแรก ต้องสร้าง bucket และตั้ง public policy:

**วิธีที่ 1 — CLI (แนะนำ)**

```bash
# 1) ลงทะเบียน alias ให้ mc client รู้จัก MinIO server
docker exec myblog-minio mc alias set local http://localhost:9000 minioadmin minioadmin

# 2) สร้าง bucket
docker exec myblog-minio mc mb local/myblog-images

# 3) ตั้ง policy เป็น public (ให้ทุกคนดูรูปได้โดยไม่ต้อง auth)
docker exec myblog-minio mc anonymous set public local/myblog-images
```

**วิธีที่ 2 — Web UI**

1. เปิด http://localhost:9001 → login `minioadmin` / `minioadmin`
2. เมนูซ้าย → **Administrator** → **Buckets** → **Create Bucket**
3. ตั้งชื่อ `myblog-images` → Create
4. คลิก bucket `myblog-images` → แท็บ **Access Policy** → เปลี่ยนเป็น `public` → Save

### ตรวจสอบ

```bash
# ดู bucket และ policy ที่ตั้งไว้
docker exec myblog-minio mc anonymous get local/myblog-images
# ควรได้: Access permission for `local/myblog-images` is `public`
```

### เปลี่ยน credentials (production)

แก้ใน `.env` และ `docker-compose.yml` ให้ตรงกัน:

```bash
# .env
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# docker-compose.yml
MINIO_ROOT_USER: your-access-key
MINIO_ROOT_PASSWORD: your-secret-key
```

## Dev vs Production

| | Dev (`npm run dev`) | Production (`npm start`) |
|--|---------------------|--------------------------|
| Port | 5173 | 3000 |
| Build ก่อน? | ไม่ต้อง | ต้องรัน `npm run build` |
| Hot reload | ✅ | ❌ |

## Production

```bash
npm run build
npm start
# http://localhost:3000
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
