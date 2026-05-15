import { useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import PostCard from "~/components/PostCard";
import { getPublishedPosts, getCategories, getSiteSettings } from "~/lib/db.server";
import { getUserFromSession } from "~/lib/session.server";
import type { Post } from "~/lib/db.server";
import { getServerContext } from "~/server-context";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.settings?.site_name ?? "Blog";
  const tagline = data?.settings?.tagline ?? "";
  return [
    { title: name },
    { name: "description", content: tagline },
    { property: "og:title", content: name },
    { property: "og:description", content: tagline },
    { property: "og:type", content: "website" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const url = new URL(request.url);
  const search = url.searchParams.get("q") ?? undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = 9;
  const offset = (page - 1) * limit;

  const [categories, posts, user, settings] = await Promise.all([
    getCategories(ctx.db),
    getPublishedPosts(ctx.db, { search, limit: limit + 1, offset }),
    getUserFromSession(request, ctx.sessionStorage),
    getSiteSettings(ctx.db),
  ]);

  const hasMore = posts.length > limit;
  return { categories, posts: posts.slice(0, limit), hasMore, page, search: search ?? "", user, settings };
}

export default function Home() {
  const initialData = useLoaderData<typeof loader>();

  const [extraPosts, setExtraPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const params = new URLSearchParams();
    if (initialData.search) params.set("q", initialData.search);
    params.set("page", String(currentPage + 1));
    try {
      const res = await fetch(`/api/more-posts?${params}`);
      const data = await res.json() as { posts: Post[]; hasMore: boolean; page: number };
      setExtraPosts((prev) => [...prev, ...data.posts]);
      setCurrentPage(data.page);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }

  const { categories, user, search, settings } = initialData;
  const showViewCount = settings.show_view_count;
  const allPosts = [...initialData.posts, ...extraPosts];

  const featuredPost = !search ? allPosts[0] : null;
  const sidePosts = !search ? allPosts.slice(1, 3) : [];
  const gridPosts = !search ? allPosts.slice(3) : allPosts;

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} user={user} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {search && (
          <p className="text-on-surface-variant text-sm mb-6">
            ผลการค้นหา: <span className="text-primary font-medium">"{search}"</span>
            {" "}— พบ {allPosts.length} บทความ
          </p>
        )}

        {/* Hero section: big left + 2 side right */}
        {featuredPost && (
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Big left card */}
              <a href={`/post/${featuredPost.slug}`} className="lg:col-span-2 block group">
                <div className="bg-surface-container-low rounded-xl overflow-hidden card-shadow flex flex-col hover:ring-1 hover:ring-primary transition-all">
                  <div className="relative bg-surface-container aspect-[16/10]">
                    <img
                      src={featuredPost.featured_image ?? "https://images.thana.in.th/images/thanainth-placeholder.png"}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    {featuredPost.category_name && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 rounded bg-primary-container text-on-primary-container text-xs font-semibold uppercase tracking-wide">
                          {featuredPost.pinned === 1 ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">push_pin</span>
                              Pinned
                            </span>
                          ) : featuredPost.category_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold leading-tight mb-2 text-on-surface group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-sm text-on-surface-variant line-clamp-2 mb-2">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    {featuredPost.published_at && (
                      <p className="text-xs text-outline">
                        {new Date(featuredPost.published_at).toLocaleDateString("th-TH", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    )}
                    {showViewCount && featuredPost.view_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-outline mt-1">
                        <span className="material-symbols-outlined text-sm leading-none">visibility</span>
                        {featuredPost.view_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </a>

              {/* Right column: 2 small cards stacked */}
              <div className="flex flex-col gap-6">
                {sidePosts.map((post) => (
                  <a key={post.id} href={`/post/${post.slug}`} className="block group">
                    <div className="bg-surface-container-low rounded-xl overflow-hidden card-shadow flex flex-col hover:ring-1 hover:ring-primary transition-all">
                      <div className="relative bg-surface-container aspect-video">
                        <img
                          src={post.featured_image ?? "https://images.thana.in.th/images/thanainth-placeholder.png"}
                          alt={post.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        {post.category_name && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high/90 text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                              {post.category_name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-shrink-0">
                        <h3 className="text-sm font-semibold leading-snug text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.published_at && (
                          <p className="text-xs text-outline mt-1">
                            {new Date(post.published_at).toLocaleDateString("th-TH", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </p>
                        )}
                        {showViewCount && post.view_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-outline">
                            <span className="material-symbols-outlined text-xs leading-none">visibility</span>
                            {post.view_count.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Grid */}
        {allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
            <p className="text-lg">ไม่พบบทความ</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <PostCard key={post.id} post={post} showViewCount={showViewCount} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-primary-container text-on-primary-container border border-outline-variant font-medium px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "กำลังโหลด..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
