import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public routes
  index("routes/home.tsx"),
  route("post/:slug", "routes/post.$slug.tsx"),
  route("tag/:slug", "routes/tag.$slug.tsx"),
  route(":slug", "routes/category.$slug.tsx"),
  route("about", "routes/about.tsx"),
  route("contact", "routes/contact.tsx"),
  route("profile", "routes/profile.tsx"),
  route("feed.xml", "routes/feed[.]xml.ts"),

  // Auth
  route("login", "routes/login.tsx"),
  route("setup", "routes/setup.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
  route("auth/password", "routes/auth.password.tsx"),

  // OG image generation
  route("og/:slug", "routes/og.$slug.tsx"),

  // API
  route("api/upload-image", "routes/api.upload-image.tsx"),
  route("api/more-posts", "routes/api.more-posts.tsx"),
  route("api/export-posts", "routes/api.export-posts.tsx"),

  // Admin routes
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route("posts/new", "routes/admin.posts.new.tsx"),
    route("posts/:id/edit", "routes/admin.posts.$id.edit.tsx"),
    route("categories", "routes/admin.categories.tsx"),
    route("pages/:slug", "routes/admin.pages.$slug.tsx"),
    route("settings", "routes/admin.settings.tsx"),
  ]),
] satisfies RouteConfig;
