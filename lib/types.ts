export type EntryType = "game" | "app";

export interface EntryWithCategory {
  id: string;
  slug: string;
  title: string;
  type: string;
  tagline: string | null;
  publisher: string | null;
  size: string | null;
  version: string | null;
  modInfo: string | null;
  bannerImage: string | null;
  iconImage: string | null;
  category: { name: string; slug: string } | null;
  publishedAt: Date | null;
}
