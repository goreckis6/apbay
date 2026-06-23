/**
 * Fix entry types for existing MODYOLO imports.
 * Fetches each MODYOLO page, extracts type from Genre/category links
 * (/games/xxx = game, /apps/xxx = app), and updates the database.
 *
 * Usage: npx tsx scripts/fix-entry-types.ts
 */

import { load } from "cheerio";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getTypeFromModyolo(slug: string): Promise<"game" | "app" | null> {
  const url = `https://modyolo.com/${slug}.html`;
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = load(html);
    let type: "game" | "app" | null = null;
    $('a[href*="modyolo.com/apps/"], a[href*="modyolo.com/games/"]').each((_, a) => {
      const href = $(a).attr("href") || "";
      const m = href.match(/\/(apps|games)\/([^/?]+)/);
      if (m) type = m[1] === "games" ? "game" : "app";
    });
    return type;
  } catch {
    return null;
  }
}

async function main() {
  const entries = await prisma.entry.findMany({
    include: { category: true },
    orderBy: { slug: "asc" },
  });

  console.log(`Fixing types for ${entries.length} entries...\n`);

  let updated = 0;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const type = await getTypeFromModyolo(entry.slug);
    if (!type) {
      console.log(`[${i + 1}/${entries.length}] ${entry.slug}: could not determine type, skipping`);
      if (i < entries.length - 1) await sleep(800);
      continue;
    }

    if (entry.type === type) {
      console.log(`[${i + 1}/${entries.length}] ${entry.slug}: already ${type}`);
    } else {
      await prisma.entry.update({
        where: { slug: entry.slug },
        data: { type },
      });
      if (entry.category && entry.category.type !== type) {
        await prisma.category.update({
          where: { id: entry.category.id },
          data: { type },
        });
      }
      console.log(`[${i + 1}/${entries.length}] ${entry.slug}: ${entry.type} -> ${type}`);
      updated++;
    }

    if (i < entries.length - 1) await sleep(800);
  }

  console.log(`\nDone. Updated ${updated} entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
