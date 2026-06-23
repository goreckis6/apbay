"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ArticleFormProps {
  article?: {
    slug: string;
    title: string;
    excerpt?: string | null;
    content?: string | null;
    type: string;
  };
}

export default function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      slug: formData.get("slug") as string,
      title: formData.get("title") as string,
      excerpt: (formData.get("excerpt") as string) || null,
      content: (formData.get("content") as string) || null,
      type: formData.get("type") as string,
      publishedAt: formData.get("published") ? new Date().toISOString() : null,
    };

    try {
      if (article) {
        await fetch(`/api/articles/${article.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      router.push("/admin/articles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 bg-white p-6 rounded-xl shadow">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
        <input name="slug" defaultValue={article?.slug} required className="w-full px-3 py-2 border rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input name="title" defaultValue={article?.title} required className="w-full px-3 py-2 border rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
        <select name="type" defaultValue={article?.type || "article"} className="w-full px-3 py-2 border rounded-lg">
          <option value="article">Article</option>
          <option value="news">News</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt</label>
        <input name="excerpt" defaultValue={article?.excerpt || ""} className="w-full px-3 py-2 border rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
        <textarea name="content" defaultValue={article?.content || ""} rows={5} className="w-full px-3 py-2 border rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="published" id="published" defaultChecked />
        <label htmlFor="published" className="text-sm">Publish</label>
      </div>
      <div className="flex gap-2 pt-4">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50">
          {loading ? "Saving..." : article ? "Update" : "Create"}
        </button>
        <Link href="/admin/articles" className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg">Cancel</Link>
      </div>
    </form>
  );
}
