import { zipSync, strToU8 } from "fflate";
import type { Route } from "./+types/api.export-posts";
import { getAllPosts } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { getServerContext } from "~/server-context";

function buildMarkdown(post: Awaited<ReturnType<typeof getAllPosts>>[number]): string {
  const lines: string[] = ["---"];
  lines.push(`title: ${JSON.stringify(post.title)}`);
  lines.push(`slug: ${post.slug}`);
  lines.push(`status: ${post.status}`);
  lines.push(`date: ${post.published_at ?? post.created_at}`);
  if (post.category_name) lines.push(`category: ${post.category_name}`);
  lines.push(`pinned: ${post.pinned === 1}`);
  lines.push(`view_count: ${post.view_count}`);
  if (post.featured_image) lines.push(`featured_image: ${post.featured_image}`);
  if (post.excerpt) {
    lines.push("excerpt: |");
    for (const line of post.excerpt.split("\n")) {
      lines.push(`  ${line}`);
    }
  }
  lines.push("---");
  lines.push("");
  lines.push(post.content);
  return lines.join("\n");
}

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const posts = await getAllPosts(ctx.db, { limit: 10000 });

  const files: Record<string, Uint8Array> = {};
  for (const post of posts) {
    files[`${post.slug}.md`] = strToU8(buildMarkdown(post));
  }

  const zipped = zipSync(files);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(zipped, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="posts-${date}.zip"`,
    },
  });
}
