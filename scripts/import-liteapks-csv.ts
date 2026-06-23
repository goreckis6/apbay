/**
 * Import LITEAPKS CSV export into the site database.
 * Uses scripts/liteapks-export.csv - separate from MODYOLO.
 * Skips duplicates: checks by slug, normalized title, downloadUrl before importing.
 * Ensures proper category assignment (game vs app, category slug from genre).
 *
 * Usage: npx tsx scripts/import-liteapks-csv.ts [path-to-csv]
 * Default: scripts/liteapks-export.csv
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { normalizeSize } from "../lib/formatSize";

const prisma = new PrismaClient();

/** Normalize title for duplicate comparison: strip MOD APK, version, parentheticals */
function normalizeTitleForCompare(title: string): string {
  if (!title) return "";
  return title
    .replace(/\s*(MOD\s+APK|APK\s*\+\s*MOD|APK)\s*/gi, " ")
    .replace(/\s*v?\d+(\.\d+)*(-\w+)?\s*/gi, " ")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Normalize slug: lowercase, replace non-alphanumeric with dash, collapse multiple dashes */
function normalizeSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Map liteapks/modyolo category slugs to canonical form for consistency */
const CATEGORY_ALIASES: Record<string, string> = {
  "action-games": "action",
  "adventure-games": "adventure",
  "arcade-games": "arcade",
  "casual-games": "casual",
  "puzzle-games": "puzzle",
  "rpg-games": "role-playing",
  "simulation-games": "simulation",
  "sports-games": "sports",
  "strategy-games": "strategy",
};

async function main() {
  const csvPath =
    process.argv[2] || path.join(process.cwd(), "scripts", "liteapks-export.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("File not found:", csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(content, { columns: true, relax_quotes: true, relax_column_count: true }) as Record<string, string>[];
  if (rows.length === 0) {
    console.log("No rows to import.");
    return;
  }

  // Build maps: slug, normalizedTitle, downloadUrl -> existing slug
  const existingEntries = await prisma.entry.findMany({
    select: { slug: true, title: true, downloadUrl: true },
  });
  const slugExists = new Set(existingEntries.map((e) => e.slug));
  const titleToSlug = new Map<string, string>();
  const downloadUrlToSlug = new Map<string, string>();
  for (const e of existingEntries) {
    const norm = normalizeTitleForCompare(e.title || "");
    if (norm) titleToSlug.set(norm, e.slug);
    if (e.downloadUrl?.trim()) downloadUrlToSlug.set(e.downloadUrl.trim(), e.slug);
  }

  let imported = 0;
  let skipped = 0;
  for (const row of rows) {
    const slug = normalizeSlug(row.slug || row.title?.replace(/\s+/g, "-") || "");
    if (!slug) continue;

    const normalizedTitle = normalizeTitleForCompare(row.title || row.appName || "");
    const downloadUrl = (row.downloadUrl || "").trim();

    // Duplicate check: if exists (by slug, title, or url) → skip
    if (slugExists.has(slug)) {
      console.log("Skipped (exists by slug):", slug);
      skipped++;
      continue;
    }
    if (normalizedTitle) {
      const dupSlug = titleToSlug.get(normalizedTitle);
      if (dupSlug && dupSlug !== slug) {
        console.log("Skipped (duplicate of " + dupSlug + " by title):", slug);
        skipped++;
        continue;
      }
    }
    if (downloadUrl) {
      const dupByUrl = downloadUrlToSlug.get(downloadUrl);
      if (dupByUrl && dupByUrl !== slug) {
        console.log("Skipped (duplicate of " + dupByUrl + " by url):", slug);
        skipped++;
        continue;
      }
    }

    // Category: use genre/categorySlug from CSV, ensure proper type (game vs app)
    let categorySlug = (row.categorySlug || row.genre || "productivity").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    categorySlug = CATEGORY_ALIASES[categorySlug] || categorySlug;
    const categoryType = row.type === "game" ? "game" : "app";
    let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      const name = categorySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      category = await prisma.category.create({
        data: { name, slug: categorySlug, type: categoryType },
      });
    } else if (category.type !== categoryType) {
      category = await prisma.category.update({
        where: { slug: categorySlug },
        data: { type: categoryType },
      });
    }

    const updateData = {
      title: row.title || slug,
      type: (row.type === "game" ? "game" : "app") as "game" | "app",
      description: row.description || null,
      publisher: row.publisher || null,
      size: normalizeSize(row.size) || null,
      version: row.version || null,
      modInfo: row.modInfo || null,
      modFeatures: row.modFeatures || null,
      downloadNotes: row.downloadNotes || null,
      downloadUrl: row.downloadUrl || null,
      downloadVersions: row.downloadVersions || null,
      bannerImage: row.bannerImage || null,
      iconImage: row.iconImage || null,
      contentBlocks: row.contentBlocks || null,
      categoryId: category.id,
    };
    await prisma.entry.upsert({
      where: { slug },
      update: updateData,
      create: { ...updateData, slug, publishedAt: new Date() },
    });
    console.log("Imported:", slug);
    imported++;
    slugExists.add(slug);
    if (normalizedTitle) titleToSlug.set(normalizedTitle, slug);
    if (downloadUrl) downloadUrlToSlug.set(downloadUrl, slug);
  }
  console.log(`\nDone. Imported/updated ${imported} entries.${skipped > 0 ? ` Skipped ${skipped} duplicates.` : ""}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
