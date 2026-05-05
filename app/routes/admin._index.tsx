import { useLoaderData, Form, Link } from "react-router";
import { useState } from "react";
import { data } from "react-router";
import type { Route } from "./+types/admin._index";
import { getAllPosts, deletePost } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { getServerContext } from "~/server-context";

export function meta() {
  return [{ title: "Admin — Posts" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);
  const posts = await getAllPosts(ctx.db, { limit: 1000 });
  return { posts };
}

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = parseInt(formData.get("id") as string, 10);

  if (intent === "delete" && id) {
    await deletePost(ctx.db, id);
  }

  if (intent === "pin" && id) {
    const pinned = parseInt(formData.get("pinned") as string, 10);
    ctx.db
      .prepare("UPDATE posts SET pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(pinned, id);
  }

  return data({ ok: true });
}

export default function AdminIndex() {
  const { posts } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.slug.toLowerCase().includes(query.toLowerCase())
      )
    : posts;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Posts</h1>
        <Link
          to="/admin/posts/new"
          className="flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Post
        </Link>
      </div>

      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
        <input
          type="text"
          placeholder="ค้นหา post..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
        />
        {query && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-outline">
            {filtered.length} / {posts.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
          <p>ไม่พบบทความ</p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-on-surface-variant text-xs uppercase tracking-wide">
                <th className="text-left px-6 py-4">Title</th>
                <th className="text-left px-6 py-4 hidden md:table-cell">Category</th>
                <th className="text-left px-6 py-4 hidden md:table-cell">Status</th>
                <th className="text-left px-6 py-4 hidden lg:table-cell">Date</th>
                <th className="text-right px-6 py-4 hidden lg:table-cell">Views</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post, i) => (
                <tr
                  key={post.id}
                  className={`border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors ${
                    i % 2 === 0 ? "" : "bg-surface-container-lowest"
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-on-surface">{post.title}</div>
                    <div className="text-xs text-outline mt-0.5">{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-on-surface-variant">
                    {post.category_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        post.status === "published"
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-on-surface-variant text-xs">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("th-TH")
                      : "—"}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-right text-on-surface-variant text-xs">
                    {post.view_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Form method="post">
                        <input type="hidden" name="intent" value="pin" />
                        <input type="hidden" name="id" value={post.id} />
                        <input type="hidden" name="pinned" value={post.pinned ? 0 : 1} />
                        <button
                          type="submit"
                          title={post.pinned ? "Unpin" : "Pin"}
                          className={`transition-colors ${
                            post.pinned
                              ? "text-secondary"
                              : "text-on-surface-variant hover:text-secondary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">push_pin</span>
                        </button>
                      </Form>
                      <Link
                        to={`/post/${post.slug}`}
                        target="_blank"
                        className="text-on-surface-variant hover:text-primary transition-colors"
                        title="View"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </Link>
                      <Link
                        to={`/admin/posts/${post.id}/edit`}
                        className="text-on-surface-variant hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </Link>
                      <Form
                        method="post"
                        onSubmit={(e) => {
                          if (!confirm(`ลบ "${post.title}" ?`)) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={post.id} />
                        <button
                          type="submit"
                          className="text-on-surface-variant hover:text-error transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
