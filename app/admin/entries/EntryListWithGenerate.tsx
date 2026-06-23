"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeleteEntryButton from "./DeleteEntryButton";
import { OLLAMA_CLOUD_MODEL_OPTIONS } from "@/lib/ollamaCloudModelOptions";

const OLLAMA_MODEL_STORAGE_KEY = "admin-entries-ollama-model";

interface Entry {
  id: string;
  slug: string;
  title: string;
  type: string;
  description: string | null;
  modInfo: string | null;
  version: string | null;
  contentBlocks: string | null;
  category: { name: string } | null;
}

interface EntryListWithGenerateProps {
  entries: Entry[];
}

export default function EntryListWithGenerate({ entries }: EntryListWithGenerateProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, slug: "" });
  const [error, setError] = useState<string | null>(null);
  const [errorMode, setErrorMode] = useState<"content" | "meta" | null>(null);
  const [lastCompleted, setLastCompleted] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [ollamaModel, setOllamaModel] = useState<string>(() => OLLAMA_CLOUD_MODEL_OPTIONS[0].value);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY);
      if (saved && OLLAMA_CLOUD_MODEL_OPTIONS.some((o) => o.value === saved)) {
        setOllamaModel(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistOllamaModel = (value: string) => {
    setOllamaModel(value);
    try {
      localStorage.setItem(OLLAMA_MODEL_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const toggleSelect = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === entries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map((e) => e.slug)));
    }
  };

  const handleGenerate = async () => {
    const slugs = Array.from(selected);
    if (slugs.length === 0) {
      setError("Select at least one entry");
      return;
    }
    setError(null);
    setErrorMode(null);
    setLastCompleted(null);
    setGenerating(true);
    setProgress({ current: 0, total: slugs.length, slug: "" });
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    for (let i = 0; i < slugs.length; i++) {
      if (signal.aborted) break;

      const slug = slugs[i];
      const entry = entries.find((e) => e.slug === slug);
      if (!entry) continue;

      setProgress({ current: i + 1, total: slugs.length, slug: entry.title });

      try {
        let existingBlocks: unknown[] | undefined;
        try {
          if (entry.contentBlocks) existingBlocks = JSON.parse(entry.contentBlocks) as unknown[];
        } catch {
          /* ignore */
        }
        const genRes = await fetch("/api/generate-content-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: entry.title,
            description: entry.description || undefined,
            type: entry.type || "game",
            modInfo: entry.modInfo || undefined,
            existingBlocks: existingBlocks && existingBlocks.length > 0 ? existingBlocks : undefined,
            model: ollamaModel,
          }),
          signal,
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error || "Generation failed");
        if (!Array.isArray(genData.blocks) || genData.blocks.length === 0) {
          throw new Error("No blocks returned");
        }

        const contentBlocks = JSON.stringify(genData.blocks);
        const updateRes = await fetch(`/api/entries/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentBlocks }),
          signal,
        });
        if (!updateRes.ok) {
          const errData = await updateRes.json().catch(() => ({}));
          throw new Error(errData.error || "Update failed");
        }
      } catch (err) {
        const pos = `${i + 1}/${slugs.length}`;
        const remainingSlugs = slugs.slice(i);
        setSelected(new Set(remainingSlugs));
        setErrorMode("content");
        if (err instanceof Error && err.name === "AbortError") {
          setError(`Wstrzymano na: ${entry.title} (${pos}). Zaznaczono pozostałe wpisy – kliknij Kontynuuj.`);
          router.refresh();
        } else {
          setError(`Błąd na: ${entry.title} (${pos}). ${err instanceof Error ? err.message : "Failed"}. Zaznaczono od tego wpisu – kliknij Kontynuuj, aby rozpocząć od początku.`);
        }
        setGenerating(false);
        setProgress({ current: 0, total: 0, slug: "" });
        abortRef.current = null;
        return;
      }
    }

    const lastEntry = entries.find((e) => e.slug === slugs[slugs.length - 1]);
    setLastCompleted(
      lastEntry
        ? `Generate content is completed. Ostatni wpis: ${lastEntry.title} (${slugs.length}/${slugs.length})`
        : "Generate content is completed."
    );
    setGenerating(false);
    setProgress({ current: 0, total: 0, slug: "" });
    setSelected(new Set());
    abortRef.current = null;
    router.refresh();
  };

  const handleGenerateMetaDesc = async () => {
    const slugs = Array.from(selected);
    if (slugs.length === 0) {
      setError("Select at least one entry");
      return;
    }
    setError(null);
    setErrorMode(null);
    setLastCompleted(null);
    setGeneratingDesc(true);
    setProgress({ current: 0, total: slugs.length, slug: "" });
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    for (let i = 0; i < slugs.length; i++) {
      if (signal.aborted) break;

      const slug = slugs[i];
      const entry = entries.find((e) => e.slug === slug);
      if (!entry) continue;

      setProgress({ current: i + 1, total: slugs.length, slug: entry.title });

      try {
        const genRes = await fetch("/api/generate-meta-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: entry.title,
            type: entry.type || "game",
            modInfo: entry.modInfo || undefined,
            model: ollamaModel,
          }),
          signal,
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error || "Generation failed");
        if (!genData.description) throw new Error("No description returned");

        const updateRes = await fetch(`/api/entries/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: genData.description }),
          signal,
        });
        if (!updateRes.ok) {
          const errData = await updateRes.json().catch(() => ({}));
          throw new Error(errData.error || "Update failed");
        }
      } catch (err) {
        const pos = `${i + 1}/${slugs.length}`;
        const remainingSlugs = slugs.slice(i);
        setSelected(new Set(remainingSlugs));
        setErrorMode("meta");
        if (err instanceof Error && err.name === "AbortError") {
          setError(`Wstrzymano na: ${entry.title} (${pos}). Zaznaczono pozostałe wpisy – kliknij Kontynuuj.`);
          router.refresh();
        } else {
          setError(`Błąd na: ${entry.title} (${pos}). ${err instanceof Error ? err.message : "Failed"}. Zaznaczono od tego wpisu – kliknij Kontynuuj, aby rozpocząć od początku.`);
        }
        setGeneratingDesc(false);
        setProgress({ current: 0, total: 0, slug: "" });
        abortRef.current = null;
        return;
      }
    }

    const lastEntry = entries.find((e) => e.slug === slugs[slugs.length - 1]);
    setLastCompleted(
      lastEntry
        ? `Generate meta description is completed. Ostatni wpis: ${lastEntry.title} (${slugs.length}/${slugs.length})`
        : "Generate meta description is completed."
    );
    setGeneratingDesc(false);
    setProgress({ current: 0, total: 0, slug: "" });
    setSelected(new Set());
    abortRef.current = null;
    router.refresh();
  };

  const handlePause = () => {
    abortRef.current?.abort();
  };

  const isGenerating = generating || generatingDesc;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="whitespace-nowrap font-medium">Model AI (Ollama)</span>
          <select
            value={ollamaModel}
            onChange={(e) => persistOllamaModel(e.target.value)}
            disabled={isGenerating}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm min-w-[200px] disabled:opacity-50"
          >
            {OLLAMA_CLOUD_MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || selected.size === 0}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate content
        </button>
        <button
          type="button"
          onClick={handleGenerateMetaDesc}
          disabled={isGenerating || selected.size === 0}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate meta description
        </button>
        <button
          type="button"
          onClick={toggleSelectAll}
          className="text-sm text-slate-600 hover:text-slate-800 underline"
        >
          {selected.size === entries.length ? "Deselect all" : "Select all"}
        </button>
        <span className="text-sm text-slate-500">
          {selected.size} selected
        </span>
        {isGenerating && (
          <>
            <button
              type="button"
              onClick={handlePause}
              className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
            >
              Pause
            </button>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm text-amber-600 font-medium">
                {progress.current}/{progress.total} {progress.slug ? `– ${progress.slug.slice(0, 35)}...` : ""}
              </span>
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <p className="text-red-600 text-sm flex-1 min-w-0">{error}</p>
          <button
            type="button"
            onClick={() => {
              const mode = errorMode;
              setError(null);
              setErrorMode(null);
              if (mode === "meta") handleGenerateMetaDesc();
              else handleGenerate();
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium shrink-0"
          >
            Kontynuuj
          </button>
        </div>
      )}
      {lastCompleted && <p className="mb-4 text-green-600 text-sm font-medium">{lastCompleted}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selected.size === entries.length && entries.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Version</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(e.slug)}
                    onChange={() => toggleSelect(e.slug)}
                    disabled={isGenerating}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3 capitalize">{e.type}</td>
                <td className="px-4 py-3">{e.category?.name || "-"}</td>
                <td className="px-4 py-3">{e.version || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/${e.type}s/${e.slug}`} className="text-amber-600 hover:underline mr-3">
                    View
                  </Link>
                  <Link href={`/admin/entries/${e.slug}/edit`} className="text-amber-600 hover:underline">
                    Edit
                  </Link>
                  <DeleteEntryButton slug={e.slug} title={e.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
