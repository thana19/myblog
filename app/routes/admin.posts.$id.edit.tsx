import { redirect, useLoaderData } from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/admin.posts.$id.edit";
import PostForm from "~/components/PostForm";
import { getPostById, getCategories, updatePost, syncPostTags, getPostTags } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { getServerContext } from "~/server-context";
import slugify from "slugify";

export function meta() {
  return [{ title: "Edit Post — Admin" }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const id = parseInt(params.id, 10);
  const [post, categories] = await Promise.all([
    getPostById(ctx.db, id),
    getCategories(ctx.db),
  ]);

  if (!post) throw data("Post not found", { status: 404 });

  const tags = await getPostTags(ctx.db, id);
  return { post, categories, defaultTags: tags.map((t) => t.name).join(", ") };
}

export async function action({ params, request }: Route.ActionArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const id = parseInt(params.id, 10);
  const formData = await request.formData();
  const title = (formData.get("title") as string).trim();
  const rawSlug = (formData.get("slug") as string).trim();
  const slug = rawSlug || slugify(title, { lower: true, strict: true });
  const excerpt = (formData.get("excerpt") as string).trim();
  const content = formData.get("content") as string;
  const featured_image = (formData.get("featured_image") as string).trim() || undefined;
  const category_id = formData.get("category_id")
    ? parseInt(formData.get("category_id") as string, 10)
    : null;
  const tags = (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean);
  const intent = formData.get("intent") as string;
  const status = intent === "publish" ? "published" : "draft";
  const pinned = formData.get("pinned") === "1" ? 1 : 0;
  const published_at_raw = (formData.get("published_at") as string).trim();
  const published_at = published_at_raw ? new Date(published_at_raw).toISOString() : undefined;

  await updatePost(ctx.db, id, {
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

  await syncPostTags(ctx.db, id, tags);

  return redirect(status === "published" ? `/post/${slug}` : "/admin");
}

export default function EditPost() {
  const { post, categories, defaultTags } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-3xl mx-auto">
      <PostForm post={post} categories={categories} defaultTags={defaultTags} />
    </div>
  );
}
