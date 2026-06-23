"use client";

import { useRef, useState } from "react";

interface FileRow {
  name: string;
  size: number;
  url: string;
}

interface FilesManagerProps {
  initialFiles: FileRow[];
  initialLogoUrl: string | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesManager({ initialFiles, initialLogoUrl }: FilesManagerProps) {
  const [files, setFiles] = useState(initialFiles);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, endpoint: "/api/admin/files" | "/api/admin/logo") => {
    setMessage("");
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(endpoint, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data as { url: string; name?: string };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await uploadFile(file, "/api/admin/files");
      setFiles((prev) => [{ name: data.name || file.name, size: file.size, url: data.url }, ...prev]);
      setMessage(`Uploaded ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await uploadFile(file, "/api/admin/logo");
      setLogoUrl(`${data.url}?t=${Date.now()}`);
      setMessage("Logo updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/files?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setFiles((prev) => prev.filter((f) => f.name !== name));
      setMessage(`Deleted ${name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-8">
      {message && <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">{message}</p>}
      {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">{error}</p>}

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Site logo</h2>
        <p className="text-sm text-slate-500 mb-4">PNG, WebP, JPG or SVG. Replaces the APKBAY text in the header.</p>
        <div className="flex items-center gap-6 mb-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Site logo" className="h-12 max-w-[200px] object-contain" />
          ) : (
            <span className="text-slate-400 text-sm">No custom logo — using default text</span>
          )}
        </div>
        <input ref={logoInputRef} type="file" accept=".png,.webp,.jpg,.jpeg,.svg,.gif" className="hidden" onChange={handleLogoUpload} />
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
        >
          Upload logo
        </button>
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Files</h2>
            <p className="text-sm text-slate-500">Upload .txt, .js, .css, .json, .xml, .html and other static files.</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.js,.css,.json,.xml,.html,.htm,.svg,.webp,.png,.jpg,.jpeg,.gif,.ico,.woff,.woff2,.map,.md"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
            >
              Add file
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">File</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Size</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.name} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-sm">{f.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatSize(f.size)}</td>
                  <td className="px-4 py-3 text-right">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline mr-3">
                      Open
                    </a>
                    <button type="button" onClick={() => handleDelete(f.name)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {files.length === 0 && <p className="p-8 text-center text-slate-500">No files uploaded yet.</p>}
        </div>
      </section>
    </div>
  );
}
