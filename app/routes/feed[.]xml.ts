import { getPublishedPosts, getSiteSettings } from "~/lib/db.server";
import type { Route } from "./+types/feed[.]xml";
import { getServerContext } from "~/server-context";

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const [posts, settings] = await Promise.all([
    getPublishedPosts(ctx.db, { limit: 20 }),
    getSiteSettings(ctx.db),
  ]);

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const items = posts
    .map((post) => {
      const link = `${baseUrl}/post/${post.slug}`;
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString();
      const description = post.excerpt
        ? `<![CDATA[${post.excerpt}]]>`
        : "";

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.category_name ? `<category><![CDATA[${post.category_name}]]></category>` : ""}
      <description>${description}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${settings.site_name}]]></title>
    <link>${baseUrl}</link>
    <description><![CDATA[${settings.tagline}]]></description>
    <language>th</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
