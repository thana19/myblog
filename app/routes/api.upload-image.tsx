import { data } from "react-router";
import type { Route } from "./+types/api.upload-image";
import { requireUser } from "~/lib/session.server";
import { getServerContext } from "~/server-context";
import sharp from "sharp";

const ALLOWED = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
const MAX_PX = 1600;

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || !(file instanceof File)) {
    return data({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!ALLOWED.includes(ext)) {
    return data({ error: "File type not allowed" }, { status: 400 });
  }

  const raw = Buffer.from(await file.arrayBuffer());

  // GIF: skip processing (preserve animation)
  const isGif = ext === "gif";
  const [outputBuffer, outputType] = isGif
    ? [raw, "image/gif"]
    : [
        await sharp(raw)
          .resize(MAX_PX, MAX_PX, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer(),
        "image/webp",
      ];

  const outputExt = isGif ? "gif" : "webp";
  const key = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${outputExt}`;
  const url = await ctx.storage.put(key, outputBuffer, outputType);
  return data({ url });
}
