import { redirect, useSearchParams, Form } from "react-router";
import type { Route } from "./+types/login";
import { getUserFromSession } from "~/lib/session.server";
import { getAnyAdminCredential } from "~/lib/db.server";
import { getServerContext } from "~/server-context";

export function meta() {
  return [{ title: "Login" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const cred = await getAnyAdminCredential(ctx.db);
  if (!cred) return redirect("/setup");
  const user = await getUserFromSession(request, ctx.sessionStorage);
  if (user) return redirect("/admin");
  return {};
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-surface-container-low rounded-xl p-10 w-full max-w-sm card-shadow text-center">
        <h1 className="text-2xl font-black text-on-surface mb-2">Sign in</h1>
        <p className="text-on-surface-variant text-sm mb-8">Admin Login</p>

        {error === "invalid_credentials" && (
          <div className="mb-4 px-4 py-3 bg-error-container text-on-error-container rounded-lg text-sm text-left">
            Username หรือ Password ไม่ถูกต้อง
          </div>
        )}

        <Form method="post" action="/auth/password" className="flex flex-col gap-3 text-left">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full bg-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-container text-on-primary-container rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity mt-1"
          >
            Sign in
          </button>
        </Form>
      </div>
    </div>
  );
}
