import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
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

  const entryPages: MetadataRoute.Sitemap = entries.map((e) => ({
    url: `${base}/${e.type}s/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/articles/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...entryPages, ...articlePages];
}
