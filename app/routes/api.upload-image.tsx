import { data } from "react-router";
import type { Route } from "./+types/api.upload-image";
import { requireUser } from "~/lib/session.server";
import { getServerContext } from "~/server-context";

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || !(file instanceof File)) {
    return data({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
  if (!allowed.includes(ext)) {
    return data({ error: "File type not allowed" }, { status: 400 });
  }

  const key = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await ctx.storage.put(key, buffer, file.type);
  return data({ url });
}
