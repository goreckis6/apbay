"use client";

import { useState } from "react";

interface DeleteEntryButtonProps {
  slug: string;
  title: string;
}

export default function DeleteEntryButton({ slug, title }: DeleteEntryButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/entries/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      window.location.reload();
    } catch {
      alert("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:underline disabled:opacity-50 ml-3"
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
