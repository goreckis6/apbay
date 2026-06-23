"use client";

import { useState, useRef } from "react";
import ContentBlocksEditor from "./ContentBlocksEditor";
import { normalizeSize } from "@/lib/formatSize";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface EntryFormProps {
  categories: Category[];
  entry?: {
    slug: string;
    title: string;
    type: string;
    tagline?: string | null;
    description?: string | null;
    content?: string | null;
    contentBlocks?: string | null;
    publisher?: string | null;
    size?: string | null;
    version?: string | null;
    modInfo?: string | null;
    bannerImage?: string | null;
    iconImage?: string | null;
    categoryId?: string | null;
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    screenshotImage?: string | null;
    modFeatures?: string | null;
    downloadNotes?: string | null;
    downloadUrl?: string | null;
  };
}

export default function EntryForm({ categories, entry }: EntryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [genDescLoading, setGenDescLoading] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      slug: formData.get("slug") as string,
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      tagline: (formData.get("tagline") as string) || null,
      description: (formData.get("description") as string) || null,
      content: (formData.get("content") as string) || null,
      publisher: (formData.get("publisher") as string) || null,
      size: normalizeSize(formData.get("size") as string),
      version: (formData.get("version") as string) || null,
      modInfo: (formData.get("modInfo") as string) || null,
      bannerImage: (formData.get("bannerImage") as string) || null,
      iconImage: (formData.get("iconImage") as string) || null,
      categoryId: (formData.get("categoryId") as string) || null,
      heroTitle: (formData.get("heroTitle") as string) || null,
      heroSubtitle: (formData.get("heroSubtitle") as string) || null,
      screenshotImage: (formData.get("screenshotImage") as string) || null,
      modFeatures: (formData.get("modFeatures") as string) || null,
      downloadNotes: (formData.get("downloadNotes") as string) || null,
      downloadUrl: (formData.get("downloadUrl") as string) || null,
      contentBlocks: (formData.get("contentBlocks") as string) || null,
      publishedAt: formData.get("published") ? new Date().toISOString() : null,
    };

    try {
      if (entry) {
        const res = await fetch(`/api/entries/${entry.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update");
        }
        const updated = await res.json();
        router.push(`/twojastara/entries/${updated.slug}/edit`);
      } else {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create");
        }
        router.push("/twojastara/entries");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="entry-form" onSubmit={handleSubmit} className="max-w-2xl space-y-4 bg-white p-6 rounded-xl shadow">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
        <input name="slug" defaultValue={entry?.slug} required className="w-full px-3 py-2 border rounded-lg" placeholder="call-of-duty-mobile" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input name="title" defaultValue={entry?.title} required className="w-full px-3 py-2 border rounded-lg" placeholder="Call of Duty Mobile MOD APK" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
        <select name="type" defaultValue={entry?.type || "game"} className="w-full px-3 py-2 border rounded-lg">
          <option value="game">Game</option>
          <option value="app">App</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700">Description (short intro)</label>
          <button
            type="button"
            onClick={async () => {
              const form = document.getElementById("entry-form") as HTMLFormElement;
              const title = (new FormData(form).get("title") as string)?.trim();
              if (!title) {
                setError("Fill in Title first");
                return;
              }
              setGenDescLoading(true);
              setError("");
              try {
                const res = await fetch("/api/generate-meta-description", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title,
                    type: new FormData(form).get("type") || "game",
                    modInfo: (new FormData(form).get("modInfo") as string)?.trim() || undefined,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Generation failed");
                if (descRef.current && data.description) {
                  descRef.current.value = data.description;
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "Generation failed");
              } finally {
                setGenDescLoading(false);
              }
            }}
            disabled={genDescLoading}
            className="px-2 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded disabled:opacity-50"
          >
            {genDescLoading ? "Generating…" : "Generate"}
          </button>
        </div>
        <textarea
          ref={descRef}
          name="description"
          defaultValue={entry?.description || ""}
          rows={2}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Brief app description for the info section"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
        <input name="tagline" defaultValue={entry?.tagline || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="Season 6 is out now!" />
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium text-slate-700 mb-2">Hero Banner (APKBAY style)</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Hero Title (banner overlay)</label>
            <input name="heroTitle" defaultValue={entry?.heroTitle || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="FREE WIFI" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Hero Subtitle</label>
            <input name="heroSubtitle" defaultValue={entry?.heroSubtitle || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="DATA SAVER BROWSER" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Screenshot Image (phone on banner)</label>
            <input name="screenshotImage" defaultValue={entry?.screenshotImage || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="/images/..." />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">MOD Features (one per line, bullet list)</label>
        <textarea name="modFeatures" defaultValue={entry?.modFeatures || ""} rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="Premium Unlocked&#10;Force Update Disabled&#10;VPN Unlocked" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Download Notes (one per line)</label>
        <textarea name="downloadNotes" defaultValue={entry?.downloadNotes || ""} rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Please read our MOD Info and installation instructions carefully." />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Download URL</label>
        <input name="downloadUrl" type="text" defaultValue={entry?.downloadUrl || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="https://... or direct APK link" />
        <p className="text-xs text-slate-500 mt-1">URL used when user clicks Download on the download page</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Publisher</label>
          <input name="publisher" defaultValue={entry?.publisher || ""} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
          <input name="size" defaultValue={entry?.size || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="7 MB" />
          <p className="text-xs text-slate-500 mt-1">e.g. 7 MB, 127 MB, 3 GB</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Version</label>
          <input name="version" defaultValue={entry?.version || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="1.0.45" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">MOD Info</label>
          <input name="modInfo" defaultValue={entry?.modInfo || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="Aim Bot, No recoil" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select name="categoryId" defaultValue={entry?.categoryId || ""} className="w-full px-3 py-2 border rounded-lg">
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Banner Image URL</label>
        <input name="bannerImage" defaultValue={entry?.bannerImage || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Icon Image URL</label>
        <input name="iconImage" defaultValue={entry?.iconImage || ""} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
      </div>

      <div className="border-t pt-4">
        <ContentBlocksEditor value={entry?.contentBlocks || "[]"} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Content (fallback)</label>
        <textarea name="content" defaultValue={entry?.content || ""} rows={5} className="w-full px-3 py-2 border rounded-lg" placeholder="Simple content when no blocks are used" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="published" id="published" defaultChecked={!!entry} />
        <label htmlFor="published" className="text-sm">Publish immediately</label>
      </div>

      <div className="flex gap-2 pt-4">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
          {loading ? "Saving..." : entry ? "Update" : "Create"}
        </button>
        <Link href="/twojastara/entries" className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg">Cancel</Link>
      </div>
    </form>
  );
}
