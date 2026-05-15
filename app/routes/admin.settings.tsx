import { data } from "react-router";
import { useLoaderData, Form, useActionData } from "react-router";
import type { Route } from "./+types/admin.settings";
import { requireUser } from "~/lib/session.server";
import { getAnyAdminCredential, upsertAdminPassword, getSiteSettings, updateSiteSettings } from "~/lib/db.server";
import { hashPassword, verifyPassword } from "~/lib/crypto.server";
import { getServerContext } from "~/server-context";

export function meta() {
  return [{ title: "Settings — Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);
  const [existing, siteSettings] = await Promise.all([
    getAnyAdminCredential(ctx.db),
    getSiteSettings(ctx.db),
  ]);
  return {
    hasPassword: !!existing,
    username: existing?.username ?? "",
    siteSettings,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "site") {
    const site_name = (formData.get("site_name") as string)?.trim();
    const tagline = (formData.get("tagline") as string)?.trim();
    if (!site_name) {
      return data({ intent: "site", error: "กรุณากรอก Site Name" }, { status: 400 });
    }
    const show_view_count = formData.get("show_view_count") === "on";
    await updateSiteSettings(ctx.db, { site_name, tagline, show_view_count });
    return data({ intent: "site", success: true });
  }

  // intent === "password"
  const username = (formData.get("username") as string)?.trim();
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const currentPassword = formData.get("current_password") as string;

  if (!username || !newPassword) {
    return data({ intent: "password", error: "กรุณากรอก username และ password" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return data({ intent: "password", error: "Password ไม่ตรงกัน" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return data({ intent: "password", error: "Password ต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }

  const existing = await getAnyAdminCredential(ctx.db);
  if (existing) {
    if (!currentPassword) {
      return data({ intent: "password", error: "กรุณาใส่ password เดิม" }, { status: 400 });
    }
    const valid = await verifyPassword(currentPassword, existing.password_hash);
    if (!valid) {
      return data({ intent: "password", error: "Password เดิมไม่ถูกต้อง" }, { status: 400 });
    }
  }

  const hash = await hashPassword(newPassword);
  await upsertAdminPassword(ctx.db, username, hash);
  return data({ intent: "password", success: true });
}

export default function AdminSettings() {
  const { hasPassword, username, siteSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const siteResult = actionData && "intent" in actionData && actionData.intent === "site" ? actionData : null;
  const pwResult = actionData && "intent" in actionData && actionData.intent === "password" ? actionData : null;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Settings</h1>

      {/* Site Settings */}
      <div className="bg-surface-container-low rounded-xl p-6">
        <h2 className="text-base font-semibold text-on-surface mb-1">Site Settings</h2>
        <p className="text-sm text-on-surface-variant mb-6">ชื่อเว็บไซต์และคำโปรยที่แสดงใน Header และ Footer</p>

        {siteResult && "success" in siteResult && siteResult.success && (
          <div className="mb-4 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg text-sm">
            บันทึกสำเร็จแล้วค่ะ
          </div>
        )}
        {siteResult && "error" in siteResult && siteResult.error && (
          <div className="mb-4 px-4 py-3 bg-error-container text-on-error-container rounded-lg text-sm">
            {siteResult.error}
          </div>
        )}

        <Form method="post" className="flex flex-col gap-4">
          <input type="hidden" name="intent" value="site" />
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Site Name</label>
            <input
              type="text"
              name="site_name"
              defaultValue={siteSettings.site_name}
              required
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Tagline</label>
            <input
              type="text"
              name="tagline"
              defaultValue={siteSettings.tagline}
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="show_view_count"
              name="show_view_count"
              defaultChecked={siteSettings.show_view_count}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="show_view_count" className="text-sm text-on-surface">
              แสดงยอดวิวบนหน้าแรก
            </label>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-primary-container text-on-primary-container rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              บันทึก
            </button>
          </div>
        </Form>
      </div>

      {/* Password Settings */}
      <div className="bg-surface-container-low rounded-xl p-6">
        <h2 className="text-base font-semibold text-on-surface mb-1">
          {hasPassword ? "เปลี่ยน Password" : "ตั้ง Password สำหรับ Login"}
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          ใช้สำหรับ login เข้า admin
        </p>

        {pwResult && "success" in pwResult && pwResult.success && (
          <div className="mb-4 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg text-sm">
            บันทึกสำเร็จแล้วค่ะ
          </div>
        )}
        {pwResult && "error" in pwResult && pwResult.error && (
          <div className="mb-4 px-4 py-3 bg-error-container text-on-error-container rounded-lg text-sm">
            {pwResult.error}
          </div>
        )}

        <Form method="post" className="flex flex-col gap-4">
          <input type="hidden" name="intent" value="password" />
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Username</label>
            <input
              type="text"
              name="username"
              defaultValue={username}
              required
              autoComplete="username"
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {hasPassword && (
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Password เดิม</label>
              <input
                type="password"
                name="current_password"
                required
                autoComplete="current-password"
                className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Password ใหม่</label>
            <input
              type="password"
              name="new_password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">ยืนยัน Password ใหม่</label>
            <input
              type="password"
              name="confirm_password"
              required
              autoComplete="new-password"
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-primary-container text-on-primary-container rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              บันทึก
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
