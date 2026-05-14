import satori from "satori";
import sharp from "sharp";
import type { Route } from "./+types/og.$slug";
import { getPostBySlug } from "~/lib/db.server";
import { getServerContext } from "~/server-context";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let fontData: ArrayBuffer | null = null;

function getFont(): ArrayBuffer {
  if (fontData) return fontData;
  const buf = readFileSync(
    join(process.cwd(), "node_modules/@fontsource/inter/files/inter-latin-900-normal.woff")
  );
  fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return fontData;
}

async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return `data:${contentType};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function loader({ params }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const post = await getPostBySlug(ctx.db, params.slug);
  const font = getFont();

  const title = post?.title ?? "myblog";
  const excerpt = post?.excerpt ?? "";
  const category = post?.category_name ?? "";
  const featuredImageUrl = post?.featured_image ?? "";

  const featuredImage = featuredImageUrl
    ? await fetchImageAsDataUri(featuredImageUrl)
    : null;

  const fontSize = title.length > 60 ? 52 : 64;

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 28,
      }}
    >
      <span style={{ color: "#adc7ff", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
        myblog
      </span>
      {category ? (
        <span
          style={{
            background: featuredImage ? "rgba(29,32,39,0.85)" : "#1d2027",
            border: "1px solid #414754",
            color: "#adc7ff",
            fontSize: 17,
            padding: "6px 18px",
            borderRadius: 8,
          }}
        >
          {category}
        </span>
      ) : null}
    </div>
  );

  const divider = (
    <div
      style={{
        height: 1,
        background: featuredImage ? "rgba(255,255,255,0.25)" : "#414754",
        marginBottom: 44,
      }}
    />
  );

  const content = (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
      <div
        style={{
          color: "#ffffff",
          fontSize,
          fontWeight: 900,
          lineHeight: 1.2,
          letterSpacing: "-1px",
          marginBottom: excerpt ? 24 : 0,
        }}
      >
        {title}
      </div>
      {excerpt ? (
        <div
          style={{
            color: featuredImage ? "rgba(255,255,255,0.82)" : "#c1c6d6",
            fontSize: 26,
            lineHeight: 1.5,
          }}
        >
          {excerpt.length > 120 ? excerpt.substring(0, 120) + "…" : excerpt}
        </div>
      ) : null}
    </div>
  );

  const element = featuredImage ? (
    // Featured image layout: bg image + dark overlay + text on top
    <div style={{ position: "relative", display: "flex", width: 1200, height: 630, fontFamily: "Inter" }}>
      <img
        src={featuredImage}
        style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          background: "rgba(10, 13, 20, 0.72)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          width: 1200,
          height: 630,
          padding: "60px 72px",
        }}
      >
        {header}
        {divider}
        {content}
      </div>
    </div>
  ) : (
    // No featured image — solid dark bg
    <div
      style={{
        background: "#10131a",
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        padding: "60px 72px",
        fontFamily: "Inter",
      }}
    >
      {header}
      {divider}
      {content}
    </div>
  );

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [{ name: "Inter", data: font, weight: 900, style: "normal" }],
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
