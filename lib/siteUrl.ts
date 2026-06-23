/** Server-safe site URL (SITE_URL is not inlined at build time like NEXT_PUBLIC_*). */
export function siteUrl(): string {
  const url =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://apkbay.com";
  return url.replace(/\/$/, "");
}
