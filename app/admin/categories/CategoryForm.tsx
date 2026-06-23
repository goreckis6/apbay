"use client";

import { useState } from "react";

export default function CategoryForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const slug = (formData.get("name") as string)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        slug: formData.get("slug") || slug,
        type: formData.get("type"),
      }),
    });
    if (res.ok) {
      window.location.reload();
      return;
    }
    (e.target as HTMLFormElement).reset();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
        <input name="name" required className="w-full px-3 py-2 border rounded-lg" placeholder="Action" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
        <input name="slug" className="w-full px-3 py-2 border rounded-lg" placeholder="action (auto-generated if empty)" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
        <select name="type" className="w-full px-3 py-2 border rounded-lg">
          <option value="game">Game</option>
          <option value="app">App</option>
        </select>
      </div>
      <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50">
        Add Category
      </button>
    </form>
  );
}
