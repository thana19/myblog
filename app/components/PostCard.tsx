import { Link } from "react-router";
import type { Post } from "~/lib/db.server";

const CATEGORY_COLORS: Record<string, string> = {
  technology: "bg-secondary-container text-on-secondary-container",
  design: "bg-primary-container text-on-primary-container",
  personal: "bg-tertiary-container text-on-tertiary-container",
};

function getCategoryColor(slug: string | null) {
  if (!slug) return "bg-surface-container-high text-on-surface-variant";
  return CATEGORY_COLORS[slug] ?? "bg-surface-container-high text-on-surface-variant";
}

interface PostCardProps {
  post: Post;
  showViewCount?: boolean;
}

export default function PostCard({ post, showViewCount }: PostCardProps) {
  return (
    <article className="bg-surface-container-low rounded-lg overflow-hidden card-shadow flex flex-col transition-all hover:ring-1 hover:ring-primary group">
      <Link to={`/post/${post.slug}`} className="block">
        <div className="aspect-video relative overflow-hidden bg-surface-container">
          <img
            src={post.featured_image ?? "https://images.thana.in.th/images/thanainth-placeholder.png"}
            alt={post.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
          {post.category_name && (
            <div className="absolute top-3 left-3">
              <span
                className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ${getCategoryColor(
                  post.category_slug
                )}`}
              >
                {post.category_name}
              </span>
            </div>
          )}
          {post.pinned === 1 && (
            <div className="absolute top-3 right-3">
              <span className="material-symbols-outlined text-sm text-secondary bg-surface-container/80 rounded-full p-1 leading-none flex items-center justify-center w-6 h-6">
                push_pin
              </span>
            </div>
          )}
        </div>
        <div className="p-5 flex-grow">
          <h2 className="text-lg font-semibold leading-snug mb-2 text-on-surface group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-on-surface-variant line-clamp-3">
              {post.excerpt}
            </p>
          )}
          {post.published_at && (
            <p className="text-xs text-outline mt-3">
              {new Date(post.published_at).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {showViewCount && post.view_count > 0 && (
            <p className="text-xs text-outline mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm leading-none">visibility</span>
              {post.view_count.toLocaleString()}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
