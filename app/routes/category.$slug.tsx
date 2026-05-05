import { useLoaderData } from "react-router";
import { useState } from "react";
import { data } from "react-router";
import type { Route } from "./+types/category.$slug";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import PostCard from "~/components/PostCard";
import { getPublishedPosts, getCategories } from "~/lib/db.server";
import { getUserFromSession } from "~/lib/session.server";
import type { Post } from "~/lib/db.server";
import { getServerContext } from "~/server-context";

export async function loader({ params, request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const [categories, user] = await Promise.all([
    getCategories(ctx.db),
    getUserFromSession(request, ctx.sessionStorage),
  ]);

  const category = categories.find((c) => c.slug === params.slug);
  if (!category) throw data("Category not found", { status: 404 });

  const limit = 9;

  const posts = await getPublishedPosts(ctx.db, { categorySlug: params.slug, limit: limit + 1, offset: 0 });
  const hasMore = posts.length > limit;

  return { category, categories, posts: posts.slice(0, limit), hasMore, user };
}

export function meta({ data: loaderData }: Route.MetaArgs) {
  const name = loaderData?.category?.name ?? "Category";
  return [
    { title: name },
    { name: "description", content: `Posts in ${name}` },
  ];
}

export default function CategoryPage() {
  const initialData = useLoaderData<typeof loader>();
  const { category, categories, user } = initialData;

  const [extraPosts, setExtraPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("category", category.slug);
    params.set("page", String(currentPage + 1));
    try {
      const res = await fetch(`/api/more-posts?${params}`);
      const result = await res.json() as { posts: Post[]; hasMore: boolean; page: number };
      setExtraPosts((prev) => [...prev, ...result.posts]);
      setCurrentPage(result.page);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
    }
  }

  const allPosts = [...initialData.posts, ...extraPosts];

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} activeCategorySlug={category.slug} user={user} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-on-surface mb-8">
          {category.name}
          <span className="text-on-surface-variant font-normal text-base ml-2">
            ({allPosts.length}{hasMore ? "+" : ""} บทความ)
          </span>
        </h1>

        {allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4">article</span>
            <p>ยังไม่มีบทความในหมวดนี้</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPosts.map((post) => (
                <PostCard key={post.id} post={post} />
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
