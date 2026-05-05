import { useLoaderData, Form } from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/admin.categories";
import { getCategories, createCategory, updateCategory, deleteCategory } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { getServerContext } from "~/server-context";
import slugify from "slugify";

export function meta() {
  return [{ title: "Categories — Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);
  const categories = await getCategories(ctx.db);
  return { categories };
}

export async function action({ request }: Route.ActionArgs) {
  const ctx = getServerContext();
  await requireUser(request, ctx.sessionStorage);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const name = (formData.get("name") as string).trim();
    if (!name) return data({ error: "Name required" }, { status: 400 });
    const slug = slugify(name, { lower: true, strict: true });
    await createCategory(ctx.db, name, slug);
  } else if (intent === "update") {
    const id = parseInt(formData.get("id") as string, 10);
    const name = (formData.get("name") as string).trim();
    const slug = slugify(name, { lower: true, strict: true });
    await updateCategory(ctx.db, id, name, slug);
  } else if (intent === "delete") {
    const id = parseInt(formData.get("id") as string, 10);
    await deleteCategory(ctx.db, id);
  }

  return data({ ok: true });
}

export default function AdminCategories() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-on-surface mb-8">Categories</h1>

      {/* Add category */}
      <Form method="post" className="flex gap-3 mb-8">
        <input type="hidden" name="intent" value="create" />
        <input
          name="name"
          placeholder="Category name..."
          className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary outline-none"
          required
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add
        </button>
      </Form>

      {/* Category list */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-lg px-5 py-3"
          >
            <div>
              <p className="text-sm font-medium text-on-surface">{cat.name}</p>
              <p className="text-xs text-outline">/{cat.slug}</p>
            </div>
            <Form
              method="post"
              onSubmit={(e) => {
                if (!confirm(`ลบหมวด "${cat.name}" ?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={cat.id} />
              <button
                type="submit"
                className="text-on-surface-variant hover:text-error transition-colors p-1"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </Form>
          </div>
        ))}
      </div>
    </div>
  );
}
