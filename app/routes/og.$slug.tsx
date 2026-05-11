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

export async function loader({ params }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const [post] = await Promise.all([
    getPostBySlug(ctx.db, params.slug),
  ]);
  const font = getFont();

  const title = post?.title ?? "myblog";
  const excerpt = post?.excerpt ?? "";
  const category = post?.category_name ?? "";

  const svg = await satori(
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
              background: "#1d2027",
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

      <div style={{ height: 1, background: "#414754", marginBottom: 44 }} />

      <div
        style={{
          color: "#e0e2ec",
          fontSize: title.length > 60 ? 52 : 64,
          fontWeight: 900,
          lineHeight: 1.2,
          letterSpacing: "-1px",
          flex: 1,
        }}
      >
        {title}
      </div>

      {excerpt ? (
        <div
          style={{
            color: "#c1c6d6",
            fontSize: 26,
            lineHeight: 1.5,
            marginTop: 28,
          }}
        >
          {excerpt.length > 140 ? excerpt.substring(0, 140) + "…" : excerpt}
        </div>
      ) : null}
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Inter", data: font, weight: 900, style: "normal" }],
    }
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
