/**
 * Normalizes size strings for display: 7M -> 7 MB, 11MB -> 11 MB, 3GB -> 3 GB
 */
export function formatSize(size: string | null | undefined): string {
  if (!size || typeof size !== "string") return "";
  const s = size.trim();
  if (!s) return "";

  const m = s.match(/^(\d+(?:\.\d+)?)\s*(M|MB|G|GB|K|KB)?$/i);
  if (!m) return s;

  const num = m[1];
  const unit = (m[2] || "M").toUpperCase();

  if (unit === "G" || unit === "GB") return `${num} GB`;
  if (unit === "M" || unit === "MB") return `${num} MB`;
  if (unit === "K" || unit === "KB") return `${num} KB`;
  return s;
}

/** Normalizes and saves: use when storing from user input or scraper */
export function normalizeSize(size: string | null | undefined): string | null {
  const formatted = formatSize(size);
  return formatted || null;
}
