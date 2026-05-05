import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import { getSiteSettings } from "~/lib/db.server";
import { getServerContext } from "~/server-context";
import "./app.css";

export async function loader() {
  try {
    const ctx = getServerContext();
    const settings = await getSiteSettings(ctx.db);
    return { settings, gaId: ctx.env.GA_ID ?? null };
  } catch {
    return {
      settings: { site_name: "My Blog", tagline: "A personal blog." },
      gaId: null,
    };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  const gaId = data?.gaId ?? null;
  const siteName = data?.settings?.site_name ?? "Blog";

  return (
    <html lang="th" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link rel="alternate" type="application/rss+xml" title={`${siteName} RSS Feed`} href="/feed.xml" />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="font-sans text-on-surface bg-background min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h1 className="text-2xl font-black text-on-surface mb-4">{message}</h1>
      <p className="text-on-surface-variant mb-8">{details}</p>
      {stack && (
        <pre className="w-full max-w-2xl p-4 overflow-x-auto bg-surface-container-low rounded-lg text-left text-xs text-on-surface-variant">
          {stack}
        </pre>
      )}
      <a href="/" className="text-primary hover:underline">
        ← กลับหน้าแรก
      </a>
    </main>
  );
}
