import type { MetadataRoute } from "next";
import { getSitemapPartCount, sitemapPublicPath } from "@/lib/sitemapData";
import { siteUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl();
  const partCount = await getSitemapPartCount();
  const sitemaps = Array.from({ length: partCount }, (_, i) => `${base}${sitemapPublicPath(i + 1)}`);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/twojastara", "/twojastara/", "/api/"],
    },
    sitemap: sitemaps.length === 1 ? sitemaps[0] : sitemaps,
  };
}
