import { join } from "path";
import { mkdir, readdir, stat, writeFile, unlink } from "fs/promises";

export const FILES_DIR = join(process.cwd(), "public", "files");
export const LOGO_DIR = join(process.cwd(), "public", "logo");

export const ALLOWED_FILE_EXTENSIONS = new Set([
  ".txt",
  ".js",
  ".css",
  ".json",
  ".xml",
  ".html",
  ".htm",
  ".svg",
  ".webp",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".map",
  ".md",
]);

export const ALLOWED_LOGO_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg", ".svg", ".gif"]);

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function sanitizeFilename(name: string): string | null {
  const base = name.replace(/\\/g, "/").split("/").pop()?.trim() || "";
  if (!base || base.includes("..") || !/^[\w.\-()+@]+$/.test(base)) return null;
  const ext = base.includes(".") ? `.${base.split(".").pop()!.toLowerCase()}` : "";
  if (!ext) return null;
  return base;
}

export async function ensureUploadDirs(): Promise<void> {
  await mkdir(FILES_DIR, { recursive: true });
  await mkdir(LOGO_DIR, { recursive: true });
}

export async function listUploadedFiles(): Promise<{ name: string; size: number; url: string }[]> {
  await ensureUploadDirs();
  const names = await readdir(FILES_DIR);
  const files = await Promise.all(
    names.map(async (name) => {
      const info = await stat(join(FILES_DIR, name));
      if (!info.isFile()) return null;
      return { name, size: info.size, url: `/${encodeURIComponent(name)}` };
    })
  );
  return files.filter(Boolean) as { name: string; size: number; url: string }[];
}

export function validateUploadFile(filename: string, size: number, logo = false): string | null {
  const safe = sanitizeFilename(filename);
  if (!safe) return "Invalid filename";
  const ext = `.${safe.split(".").pop()!.toLowerCase()}`;
  const allowed = logo ? ALLOWED_LOGO_EXTENSIONS : ALLOWED_FILE_EXTENSIONS;
  if (!allowed.has(ext)) return `File type ${ext} is not allowed`;
  const max = logo ? MAX_LOGO_BYTES : MAX_FILE_BYTES;
  if (size > max) return `File too large (max ${Math.round(max / 1024 / 1024)}MB)`;
  return null;
}

export async function saveUploadedFile(filename: string, data: Buffer): Promise<string> {
  await ensureUploadDirs();
  const safe = sanitizeFilename(filename);
  if (!safe) throw new Error("Invalid filename");
  const err = validateUploadFile(safe, data.length, false);
  if (err) throw new Error(err);
  await writeFile(join(FILES_DIR, safe), data);
  return `/${safe}`;
}

export async function saveLogoFile(filename: string, data: Buffer): Promise<string> {
  await ensureUploadDirs();
  const safe = sanitizeFilename(filename);
  if (!safe) throw new Error("Invalid filename");
  const err = validateUploadFile(safe, data.length, true);
  if (err) throw new Error(err);
  const ext = `.${safe.split(".").pop()!.toLowerCase()}`;
  const finalName = `logo${ext}`;
  const existing = await readdir(LOGO_DIR).catch(() => [] as string[]);
  await Promise.all(
    existing
      .filter((f) => f.startsWith("logo."))
      .map((f) => unlink(join(LOGO_DIR, f)).catch(() => {}))
  );
  await writeFile(join(LOGO_DIR, finalName), data);
  return `/logo/${finalName}`;
}

export async function deleteUploadedFile(filename: string): Promise<void> {
  const safe = sanitizeFilename(filename);
  if (!safe) throw new Error("Invalid filename");
  await unlink(join(FILES_DIR, safe));
}

export async function getLogoUrl(): Promise<string | null> {
  await ensureUploadDirs();
  const names = await readdir(LOGO_DIR);
  const logo = names.find((n) => n.startsWith("logo."));
  return logo ? `/logo/${logo}` : null;
}
