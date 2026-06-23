import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/siteUrl";

export const SITEMAP_PAGE_SIZE = 200;

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

export function sitemapPublicPath(part: number): string {
  return part === 1 ? "/sitemap.xml" : `/sitemap${part}.xml`;
}

export async function getAllSitemapEntries(): Promise<SitemapEntry[]> {
  const base = siteUrl();
  const now = new Date();

  const staticPages: SitemapEntry[] = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/games`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/apps`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/articles`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const [entries, articles] = await Promise.all([
    prisma.entry.findMany({
      select: { slug: true, type: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.article.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const entryPages: SitemapEntry[] = entries.map((e) => ({
    url: `${base}/${e.type}s/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articlePages: SitemapEntry[] = articles.map((a) => ({
    url: `${base}/articles/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...entryPages, ...articlePages];
}

export async function getSitemapPartCount(): Promise<number> {
  const all = await getAllSitemapEntries();
  return Math.max(1, Math.ceil(all.length / SITEMAP_PAGE_SIZE));
}

export async function getSitemapChunk(part: number): Promise<SitemapEntry[] | null> {
  const all = await getAllSitemapEntries();
  const partCount = Math.max(1, Math.ceil(all.length / SITEMAP_PAGE_SIZE));
  if (part < 1 || part > partCount) return null;
  const start = (part - 1) * SITEMAP_PAGE_SIZE;
  return all.slice(start, start + SITEMAP_PAGE_SIZE);
}
