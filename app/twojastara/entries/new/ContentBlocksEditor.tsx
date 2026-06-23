"use client";

import { useState } from "react";
import type { ContentBlock } from "@/lib/contentBlocks";

interface ContentBlocksEditorProps {
  value: string;
  formId?: string;
}

export default function ContentBlocksEditor({ value, formId = "entry-form" }: ContentBlocksEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) {
      setGenerateError("Form not found");
      return;
    }
    const formData = new FormData(form);
    const title = (formData.get("title") as string)?.trim();
    if (!title) {
      setGenerateError("Fill in Title first");
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/generate-content-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: (formData.get("description") as string)?.trim() || undefined,
          type: (formData.get("type") as string) || "game",
          modInfo: (formData.get("modInfo") as string)?.trim() || undefined,
          existingBlocks: blocks.length > 0 ? blocks : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      if (Array.isArray(data.blocks) && data.blocks.length > 0) {
        setBlocks(data.blocks);
      } else {
        throw new Error("No blocks returned");
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const updateBlocks = (newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks);
  };

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock =
      type === "text"
        ? { type: "text", content: "" }
        : type === "h1"
          ? { type: "h1", content: "" }
          : type === "h2"
            ? { type: "h2", content: "" }
            : type === "image"
              ? { type: "image", url: "", alt: "" }
              : {
                  type: "two-columns",
                  left: { type: "text", content: "" },
                  right: { type: "text", content: "" },
                };
    updateBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index: number, block: ContentBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    updateBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    updateBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    updateBlocks(newBlocks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">Article Content Blocks</label>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate blog post content"}
          </button>
          <button type="button" onClick={() => addBlock("text")} className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded">
            + Text
          </button>
          <button type="button" onClick={() => addBlock("image")} className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded">
            + Image
          </button>
          <button type="button" onClick={() => addBlock("h1")} className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded">
            + H1
          </button>
          <button type="button" onClick={() => addBlock("h2")} className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded">
            + H2
          </button>
          <button type="button" onClick={() => addBlock("two-columns")} className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded">
            + 2 Columns
          </button>
        </div>
      </div>
      {generateError && <p className="text-sm text-red-600">{generateError}</p>}
      <input type="hidden" name="contentBlocks" value={JSON.stringify(blocks)} />
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase">{block.type}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveBlock(i, "up")} disabled={i === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => moveBlock(i, "down")} disabled={i === blocks.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30">
                  ↓
                </button>
                <button type="button" onClick={() => removeBlock(i)} className="p-1 text-red-500 hover:text-red-700">
                  ×
                </button>
              </div>
            </div>
            {block.type === "text" && (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(i, { ...block, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Full width text..."
              />
            )}
            {block.type === "h1" && (
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(i, { ...block, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm font-bold"
                placeholder="Heading 1"
              />
            )}
            {block.type === "h2" && (
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(i, { ...block, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Heading 2"
              />
            )}
            {block.type === "image" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={block.url}
                  onChange={(e) => updateBlock(i, { ...block, url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Image URL (/images/...) or https://..."
                />
                <input
                  type="text"
                  value={block.alt || ""}
                  onChange={(e) => updateBlock(i, { ...block, alt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Alt text (optional)"
                />
              </div>
            )}
            {block.type === "two-columns" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">Left column</label>
                  <select
                    value={block.left.type}
                    onChange={(e) =>
                      updateBlock(i, {
                        ...block,
                        left: e.target.value === "text" ? { type: "text", content: "" } : { type: "image", url: "", alt: "" },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                  </select>
                  {block.left.type === "text" ? (
                    <textarea
                      value={block.left.content}
                      onChange={(e) => updateBlock(i, { ...block, left: { type: "text", content: e.target.value } })}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={block.left.url}
                      onChange={(e) => updateBlock(i, { ...block, left: { type: "image", url: e.target.value, alt: block.left.type === "image" ? block.left.alt : undefined } })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      placeholder="Image URL"
                    />
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500">Right column</label>
                  <select
                    value={block.right.type}
                    onChange={(e) =>
                      updateBlock(i, {
                        ...block,
                        right: e.target.value === "text" ? { type: "text", content: "" } : { type: "image", url: "", alt: "" },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                  </select>
                  {block.right.type === "text" ? (
                    <textarea
                      value={block.right.content}
                      onChange={(e) => updateBlock(i, { ...block, right: { type: "text", content: e.target.value } })}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={block.right.url}
                      onChange={(e) => updateBlock(i, { ...block, right: { type: "image", url: e.target.value, alt: block.right.type === "image" ? block.right.alt : undefined } })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      placeholder="Image URL"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {blocks.length === 0 && (
        <p className="text-sm text-slate-500">No blocks. Add Text, H1, H2, Image, or 2 Columns. Use "Content" field below for simple content.</p>
      )}
    </div>
  );
}
