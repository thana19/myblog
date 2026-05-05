import { Form, useNavigation } from "react-router";
import { useState, useRef, lazy, Suspense } from "react";
import type { Post, Category } from "~/lib/db.server";

const RichEditor = lazy(() => import("./RichEditor"));

interface PostFormProps {
  post?: Post;
  categories: Category[];
  defaultTags?: string;
}

export default function PostForm({ post, categories, defaultTags = "" }: PostFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [content, setContent] = useState(post?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image ?? "");
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [intent, setIntent] = useState<"draft" | "publish">("draft");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload-image", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = (await res.json()) as { url: string };
      setFeaturedImage(url);
    }
    setUploading(false);
  }

  return (
    <Form method="post" className="space-y-0">
      {/* Hidden fields */}
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="featured_image" value={featuredImage} />
      <input type="hidden" name="intent" value={intent} />

      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">edit_note</span>
          <span className="text-sm font-medium">{post ? "Edit Post" : "New Draft"}</span>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setIntent("draft")}
            className="px-6 py-2 border border-outline rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setIntent("publish")}
            className="px-6 py-2 bg-primary-container text-on-primary-container rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Publish"}
          </button>
        </div>
      </div>

      {/* Featured image */}
      <div className="mb-8">
        <div className="flex gap-3 mb-3">
          <button
            type="button"
            onClick={() => setImageMode("url")}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              imageMode === "url"
                ? "border-primary text-primary"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setImageMode("upload")}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              imageMode === "upload"
                ? "border-primary text-primary"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            Upload
          </button>
        </div>

        {imageMode === "url" ? (
          <input
            type="text"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary outline-none"
          />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="group relative w-full aspect-[21/9] bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
          >
            {featuredImage ? (
              <img src={featuredImage} alt="Featured" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-outline">
                {uploading ? (
                  <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                    <p className="text-sm">Click to upload featured image</p>
                    <p className="text-xs uppercase tracking-widest opacity-60">Optimal: 1200 × 630px</p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {featuredImage && imageMode === "url" && (
          <div className="mt-3 rounded-xl overflow-hidden aspect-[21/9] bg-surface-container">
            <img src={featuredImage} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Title */}
      <textarea
        name="title"
        defaultValue={post?.title ?? ""}
        placeholder="Enter post title..."
        rows={1}
        onInput={(e) => {
          const t = e.currentTarget;
          t.style.height = "";
          t.style.height = t.scrollHeight + "px";
        }}
        className="w-full bg-transparent border-none focus:ring-0 text-4xl font-black placeholder:text-on-surface-variant/40 text-on-surface resize-none p-0 outline-none mb-8 leading-tight"
        required
      />

      {/* Slug */}
      <div className="mb-6">
        <label className="text-xs text-on-surface-variant uppercase tracking-wide mb-1 block">
          Slug
        </label>
        <input
          name="slug"
          defaultValue={post?.slug ?? ""}
          placeholder="my-post-slug"
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Excerpt */}
      <div className="mb-6">
        <label className="text-xs text-on-surface-variant uppercase tracking-wide mb-1 block">
          Excerpt
        </label>
        <textarea
          name="excerpt"
          defaultValue={post?.excerpt ?? ""}
          placeholder="Short description for the post..."
          rows={2}
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary outline-none resize-none"
        />
      </div>

      {/* Category + Tags */}
      <div className="flex flex-wrap items-center gap-4 py-4 border-y border-surface-container-high mb-8">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">category</span>
          <select
            name="category_id"
            defaultValue={post?.category_id ?? ""}
            className="bg-transparent border-none text-sm text-on-surface-variant focus:ring-0 cursor-pointer outline-none"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-surface">
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-outline-variant mx-2" />
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">sell</span>
          <input
            name="tags"
            defaultValue={defaultTags}
            placeholder="Add tags (comma separated)..."
            className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-on-surface-variant/50 text-on-surface outline-none w-48"
          />
        </div>
        <div className="h-4 w-px bg-outline-variant mx-2" />
        <label className="flex items-center gap-1.5 text-sm text-on-surface-variant cursor-pointer select-none">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={post?.pinned === 1}
            value="1"
            className="accent-primary"
          />
          <span className="material-symbols-outlined text-sm">push_pin</span>
          ปักหมุด
        </label>
        <div className="h-4 w-px bg-outline-variant mx-2" />
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <input
            type="datetime-local"
            name="published_at"
            defaultValue={post?.published_at ? post.published_at.slice(0, 16) : ""}
            className="bg-transparent border-none focus:ring-0 text-sm text-on-surface outline-none"
          />
        </div>
      </div>

      {/* Rich editor */}
      <Suspense
        fallback={
          <div className="min-h-[400px] bg-surface-container-low rounded-lg flex items-center justify-center text-on-surface-variant text-sm">
            Loading editor...
          </div>
        }
      >
        <RichEditor content={content} onChange={setContent} />
      </Suspense>
    </Form>
  );
}
