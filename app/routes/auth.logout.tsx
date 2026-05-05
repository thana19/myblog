import { redirect } from "react-router";
import type { Route } from "./+types/auth.logout";
import { getServerContext } from "~/server-context";

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  const session = await ctx.sessionStorage.getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: { "Set-Cookie": await ctx.sessionStorage.destroySession(session) },
  });
}
