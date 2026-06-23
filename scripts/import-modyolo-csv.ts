/**
 * Import MODYOLO CSV export into the site database.
 * Matches the schema from scrape-modyolo.ts output.
 *
 * Usage: npx tsx scripts/import-modyolo-csv.ts [path-to-csv]
 * Default: scripts/modyolo-export.csv
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { normalizeSize } from "../lib/formatSize";

const prisma = new PrismaClient();

async function main() {
  const csvPath =
    process.argv[2] || path.join(process.cwd(), "scripts", "modyolo-export.csv");
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

  let imported = 0;
  for (const row of rows) {
    const slug = row.slug || row.title?.toLowerCase().replace(/\s+/g, "-");
    if (!slug) continue;

    const categorySlug = (row.categorySlug || "productivity").toLowerCase().replace(/\s+/g, "-");
    const categoryType = row.type === "game" ? "game" : "app";
    let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      const name = categorySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      category = await prisma.category.create({
        data: { name, slug: categorySlug, type: categoryType },
      });
    } else if (category.type !== categoryType) {
      // Fix category type when re-importing with correct entry types (e.g. was "app", now "game")
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
  }
  console.log(`\nDone. Imported/updated ${imported} entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
