import { useLoaderData, Link } from "react-router";
import { data } from "react-router";
import { lazy, Suspense } from "react";
import type { Route } from "./+types/post.$slug";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

const MarkdownPreview = lazy(() => import("@uiw/react-markdown-preview"));
import { getPostBySlug, getCategories, getPostTags, incrementViewCount } from "~/lib/db.server";
import { getUserFromSession } from "~/lib/session.server";
import { getServerContext } from "~/server-context";

export async function loader({ params, request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const [post, categories] = await Promise.all([
    getPostBySlug(ctx.db, params.slug),
    getCategories(ctx.db),
  ]);

  if (!post || post.status !== "published") {
    throw data("Post not found", { status: 404 });
  }

  const [tags, user] = await Promise.all([
    getPostTags(ctx.db, post.id),
    getUserFromSession(request, ctx.sessionStorage),
    incrementViewCount(ctx.db, params.slug),
  ]);

  return { post, tags, categories, user };
}

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData?.post) return [{ title: "Not Found" }];
  const { post } = loaderData;
  return [
    { title: post.title },
    { name: "description", content: post.excerpt ?? post.title },
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.excerpt ?? "" },
    { property: "og:type", content: "article" },
    ...(post.featured_image
      ? [{ property: "og:image", content: post.featured_image }]
      : []),
  ];
}

export default function PostPage() {
  const { post, tags, categories, user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} activeCategorySlug={post.category_slug ?? undefined} user={user} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 overflow-hidden">
        {/* Category + date */}
        <div className="flex items-center gap-3 mb-4">
          {post.category_name && (
            <span className="px-3 py-1 rounded bg-primary-container text-on-primary-container text-xs font-semibold uppercase tracking-wide">
              {post.category_name}
            </span>
          )}
          {post.published_at && (
            <span className="text-xs text-outline">
              {new Date(post.published_at).toLocaleDateString("th-TH", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          )}
          {user && (
            <Link
              to={`/admin/posts/${post.id}/edit`}
              className="ml-auto flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </Link>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-on-surface mb-6">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed mb-8 border-l-2 border-primary pl-4">
            {post.excerpt}
          </p>
        )}

        {/* Featured image */}
        {post.featured_image && (
          <div className="w-full aspect-video overflow-hidden rounded-xl mb-10 bg-surface-container">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <Suspense fallback={<div className="text-on-surface-variant text-sm">Loading...</div>}>
          <MarkdownPreview
            source={post.content ?? ""}
            data-color-mode="dark"
            style={{
              backgroundColor: "transparent",
              color: "var(--color-on-surface)",
              fontSize: "1rem",
              lineHeight: "1.7",
            }}
          />
        </Suspense>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-outline-variant">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-medium"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* View count */}
        <div className="mt-10 pt-8 border-t border-outline-variant flex items-center gap-1.5 text-xs text-outline">
          <span className="material-symbols-outlined text-sm">visibility</span>
          {post.view_count.toLocaleString()} views
        </div>

        {/* Share buttons */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-on-surface-variant uppercase tracking-wide">Share</span>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1877F2] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.slug}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
            </svg>
            X
          </a>
        </div>

        {/* Back link */}
        <div className="mt-8">
          <a href="/" className="text-primary hover:underline text-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            กลับหน้าแรก
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
