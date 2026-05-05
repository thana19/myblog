import { redirect, useActionData, Form } from "react-router";
import type { Route } from "./+types/setup";
import { getAnyAdminCredential, upsertAdminPassword } from "~/lib/db.server";
import { hashPassword } from "~/lib/crypto.server";
import { getSession } from "~/lib/session.server";
import { getServerContext } from "~/server-context";

export function meta() {
  return [{ title: "Setup" }];
}

export async function loader() {
  const ctx = getServerContext();
  const cred = await getAnyAdminCredential(ctx.db);
  if (cred) return redirect("/admin");
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  const existing = await getAnyAdminCredential(ctx.db);
  if (existing) return redirect("/admin");

  const formData = await request.formData();
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!username || username.length < 3) {
    return { error: "Username ต้องมีอย่างน้อย 3 ตัวอักษร" };
  }
  if (!password || password.length < 8) {
    return { error: "Password ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  if (password !== confirm) {
    return { error: "Password ไม่ตรงกัน" };
  }

  const hash = await hashPassword(password);
  await upsertAdminPassword(ctx.db, username, hash);

  const session = await getSession(request, ctx.sessionStorage);
  session.set("user", { id: `local:${username}`, email: username, name: username });

  return redirect("/admin", {
    headers: { "Set-Cookie": await ctx.sessionStorage.commitSession(session) },
  });
}

export default function Setup() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-surface-container-low rounded-xl p-10 w-full max-w-md card-shadow">
        <h1 className="text-2xl font-black text-on-surface mb-2 text-center">First-time setup</h1>
        <p className="text-on-surface-variant text-sm mb-8 text-center">
          ตั้ง admin account สำหรับ blog ของคุณ
        </p>

        {actionData?.error && (
          <div className="mb-4 px-4 py-3 bg-error-container text-on-error-container rounded-lg text-sm">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              minLength={3}
              autoComplete="username"
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Password (อย่างน้อย 8 ตัวอักษร)
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirm"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-container text-on-primary-container rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity mt-2"
          >
            สร้าง admin
          </button>
        </Form>
      </div>
    </div>
  );
}
