import { Outlet, Link, useLoaderData, Form } from "react-router";
import type { Route } from "./+types/admin";
import { requireUser, requireSetup } from "~/lib/session.server";
import { getServerContext } from "~/server-context";
import { getSiteSettings } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  await requireSetup(ctx.db);
  const user = await requireUser(request, ctx.sessionStorage);
  const settings = await getSiteSettings(ctx.db);
  return { user, settings };
}

export default function AdminLayout() {
  const { user, settings } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-50">
        <div className="flex items-center gap-4 px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-lg font-black tracking-tighter text-on-surface uppercase shrink-0">
            {settings.site_name}
          </Link>
          <nav className="flex gap-3 text-sm overflow-x-auto flex-1 min-w-0">
            {[
              { to: "/admin", label: "Posts" },
              { to: "/admin/categories", label: "Categories" },
              { to: "/admin/pages/about", label: "About" },
              { to: "/admin/pages/contact", label: "Contact" },
              { to: "/admin/pages/profile", label: "Profile" },
              { to: "/admin/settings", label: "Settings" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap shrink-0"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <Form method="post" action="/auth/logout">
              <button
                type="submit"
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary text-sm transition-colors"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold">
                    {user.name[0]}
                  </div>
                )}
              </button>
            </Form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
