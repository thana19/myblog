import { redirect, useLoaderData } from "react-router";
import { data } from "react-router";
import { useState, useEffect, lazy, Suspense } from "react";
import { Form } from "react-router";
import type { Route } from "./+types/admin.pages.$slug";
import { getPage, upsertPage } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { getServerContext } from "~/server-context";

const RichEditor = lazy(() => import("~/components/RichEditor"));

const ALLOWED_SLUGS = ["about", "contact", "profile"] as const;
type PageSlug = (typeof ALLOWED_SLUGS)[number];

export function meta({ params }: Route.MetaArgs) {
  const slug = params.slug ?? "";
  return [{ title: `Edit ${slug} — Admin` }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const slug = params.slug as PageSlug;
  if (!ALLOWED_SLUGS.includes(slug)) {
    throw data("Page not found", { status: 404 });
  }

  const page = await getPage(ctx.db, slug);
  return { slug, content: page?.content ?? "" };
}

export async function action({ params, request }: Route.ActionArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const slug = params.slug as PageSlug;
  if (!ALLOWED_SLUGS.includes(slug)) {
    throw data("Page not found", { status: 404 });
  }

  const formData = await request.formData();
  const content = formData.get("content") as string;

  await upsertPage(ctx.db, slug, content);

  return redirect(`/admin/pages/${slug}`);
}

export default function EditPage() {
  const { slug, content: initialContent } = useLoaderData<typeof loader>();
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-on-surface capitalize">{slug}</h1>
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          View
        </a>
      </div>

      <Form method="post">
        <input type="hidden" name="content" value={content} />

        <Suspense
          fallback={
            <div className="min-h-[400px] bg-surface-container-low rounded-lg flex items-center justify-center text-on-surface-variant text-sm">
              Loading editor...
            </div>
          }
        >
          <RichEditor content={content} onChange={setContent} />
        </Suspense>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-6 py-2 bg-primary-container text-on-primary-container rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </Form>
    </div>
  );
}
