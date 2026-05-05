import { redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/admin.posts.new";
import PostForm from "~/components/PostForm";
import { getCategories, createPost, syncPostTags } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { getServerContext } from "~/server-context";
import slugify from "slugify";

export function meta() {
  return [{ title: "New Post — Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);
  const categories = await getCategories(ctx.db);
  return { categories };
}

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const formData = await request.formData();
  const title = (formData.get("title") as string).trim();
  const rawSlug = (formData.get("slug") as string).trim();
  const slug = rawSlug || slugify(title, { lower: true, strict: true });
  const excerpt = (formData.get("excerpt") as string).trim();
  const content = formData.get("content") as string;
  const featured_image = (formData.get("featured_image") as string).trim() || undefined;
  const category_id = formData.get("category_id") ? parseInt(formData.get("category_id") as string, 10) : undefined;
  const tags = (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean);
  const intent = formData.get("intent") as string;
  const status = intent === "publish" ? "published" : "draft";
  const pinned = formData.get("pinned") === "1" ? 1 : 0;
  const published_at_raw = (formData.get("published_at") as string).trim();
  const published_at = published_at_raw ? new Date(published_at_raw).toISOString() : undefined;

  const id = await createPost(ctx.db, {
    slug,
    title,
    excerpt: excerpt || undefined,
    content,
    featured_image,
    category_id,
    status,
    pinned,
    published_at,
  });

  if (tags.length > 0) {
    await syncPostTags(ctx.db, id, tags);
  }

  return redirect(status === "published" ? `/post/${slug}` : "/admin");
}

export default function NewPost() {
  const { categories } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-3xl mx-auto">
      <PostForm categories={categories} />
    </div>
  );
}
