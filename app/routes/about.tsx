import { useLoaderData } from "react-router";
import { lazy, Suspense } from "react";
import type { Route } from "./+types/about";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import { getPage, getCategories } from "~/lib/db.server";
import { getUserFromSession } from "~/lib/session.server";
import { getServerContext } from "~/server-context";

const MarkdownPreview = lazy(() => import("@uiw/react-markdown-preview"));

export function meta() {
  return [
    { title: "About" },
    { name: "description", content: "About" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  const [page, categories, user] = await Promise.all([
    getPage(ctx.db, "about"),
    getCategories(ctx.db),
    getUserFromSession(request, ctx.sessionStorage),
  ]);
  return { content: page?.content ?? "", categories, user };
}

export default function About() {
  const { content, categories, user } = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} user={user} />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-on-surface mb-8">About</h1>
        {content ? (
          <Suspense fallback={<div className="text-on-surface-variant text-sm">Loading...</div>}>
            <MarkdownPreview
              source={content}
              data-color-mode="dark"
              style={{
                backgroundColor: "transparent",
                color: "var(--color-on-surface)",
                fontSize: "1rem",
                lineHeight: "1.7",
              }}
            />
          </Suspense>
        ) : (
          <p className="text-on-surface-variant">ยังไม่มีข้อมูลค่ะ</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
