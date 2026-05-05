import { redirect } from "react-router";
import type { Route } from "./+types/auth.password";
import { getSession } from "~/lib/session.server";
import { getAdminCredentials } from "~/lib/db.server";
import { verifyPassword } from "~/lib/crypto.server";
import { getServerContext } from "~/server-context";

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  const formData = await request.formData();
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return redirect("/login?error=invalid_credentials");
  }

  const cred = await getAdminCredentials(ctx.db, username);
  if (!cred) return redirect("/login?error=invalid_credentials");

  const valid = await verifyPassword(password, cred.password_hash);
  if (!valid) return redirect("/login?error=invalid_credentials");

  const session = await getSession(request, ctx.sessionStorage);
  session.set("user", {
    id: `local:${username}`,
    email: username,
    name: username,
  });

  return redirect("/admin", {
    headers: { "Set-Cookie": await ctx.sessionStorage.commitSession(session) },
  });
}
