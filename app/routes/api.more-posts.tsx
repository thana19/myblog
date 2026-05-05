import type { Route } from "./+types/api.more-posts";
import { getPublishedPosts } from "~/lib/db.server";
import { getServerContext } from "~/server-context";

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const url = new URL(request.url);
  const search = url.searchParams.get("q") ?? undefined;
  const categorySlug = url.searchParams.get("category") ?? undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = 9;
  const offset = (page - 1) * limit;

  const posts = await getPublishedPosts(ctx.db, { search, categorySlug, limit: limit + 1, offset });
  const hasMore = posts.length > limit;

  return Response.json({ posts: posts.slice(0, limit), hasMore, page });
}
