/**
 * LITEAPKS Scraper
 * Fetches a liteapks.com page and extracts data in the same format as MODYOLO.
 * Uses separate input/output files - does NOT mix with modyolo.
 *
 * Input:  scripts/liteapks-urls.txt
 * Output: scripts/liteapks-export.csv
 *
 * Usage: npx tsx scripts/scrape-liteapks.ts [--file scripts/liteapks-urls.txt] [--resume]
 */

import * as fs from "fs";
import * as path from "path";
import { load } from "cheerio";
import { parse } from "csv-parse/sync";
import { formatSize } from "../lib/formatSize";

const LITEAPKS_BASE = "https://liteapks.com";

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

const LITEAPKS_INPUT = path.join(process.cwd(), "scripts", "liteapks-urls.txt");
const LITEAPKS_OUTPUT = path.join(process.cwd(), "scripts", "liteapks-export.csv");
const LITEAPKS_PROGRESS = path.join(process.cwd(), "scripts", "liteapks-export-inprogress.csv");
const LITEAPKS_PROGRESS_TXT = path.join(process.cwd(), "scripts", "liteapks-progress.txt");

function getExtFromUrl(url: string): string {
  const m = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
  return m ? m[1].toLowerCase() : "jpg";
}

async function downloadImage(url: string, filePath: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(buf));
    return true;
  } catch {
    return false;
  }
}

interface ScrapedEntry {
  slug: string;
  title: string;
  type: "game" | "app";
  description: string;
  appName: string;
  publisher: string;
  genre: string;
  size: string;
  version: string;
  modInfo: string;
  modFeatures: string;
  downloadNotes: string;
  downloadUrl: string;
  downloadVersions: string;
  bannerImage: string;
  iconImage: string;
  categorySlug: string;
  contentBlocks: string;
}

function extractSlugFromUrl(url: string): string {
  const m = url.match(/liteapks\.com\/([^/]+)\.html$/);
  return m ? m[1] : url.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function escapeCsv(str: string): string {
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  const base = LITEAPKS_BASE.replace(/\/$/, "");
  return href.startsWith("/") ? `${base}${href}` : `${base}/${href}`;
}

async function scrapeLiteapksPage(url: string): Promise<ScrapedEntry> {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const html = await res.text();
  const $ = load(html);

  const slug = extractSlugFromUrl(url);

  // Title
  const title =
    $("h1.h2").first().text().trim() ||
    $("h1").first().text().trim() ||
    $("meta[property='og:title']").attr("content")?.replace(" Download", "") ||
    "";

  // Description
  const description =
    $(".entry-content p").first().text().trim() ||
    $("meta[property='og:description']").attr("content") ||
    "";

  // Metadata table
  const table: Record<string, string> = {};
  $("table.table tr, table.table-striped tr, table.table-borderless tr").each((_, tr) => {
    const th = $(tr).find("th").text().trim().replace(/:\s*$/, "");
    const td = $(tr).find("td").last();
    const text = td.text().trim();
    const link = td.find("a[href*='liteapks.com']").first();
    const href = link.attr("href") || "";
    if (th && (text || href)) {
      if (th === "Publisher" || th === "Genre") {
        table[th] = link.length ? link.text().trim() : text;
      } else {
        table[th] = text;
      }
    }
  });

  const appName = table["App Name"] || title.split(" MOD APK")[0]?.trim() || title;
  const publisher = table["Publisher"] || "";
  const genre = table["Genre"] || "";
  const size = table["Size"] || "";
  const version = table["Latest Version"] || table["Version"] || "";
  const modInfo = table["MOD Info"] || "";

  // Download URL - a.btn.btn-primary[href*="/download/"]
  const downloadLink = $('a.btn.btn-primary[href*="/download/"], a[href*="/download/"]').first();
  const downloadUrl = downloadLink.attr("href") ? absoluteUrl(downloadLink.attr("href")!) : "";

  // Images
  let bannerImage = $("meta[property='og:image']").attr("content") || "";
  let iconImage = "";
  try {
    const ld = $('script[type="application/ld+json"]').filter((_, s) => {
      const h = $(s).html() || "";
      return h.includes("thumbnailUrl") || h.includes("ImageObject");
    }).first().html();
    if (ld) {
      const j = JSON.parse(ld);
      const graph = j["@graph"] || (Array.isArray(j) ? j : [j]);
      const img = graph.find((g: { thumbnailUrl?: string; contentUrl?: string }) => g.thumbnailUrl || g.contentUrl);
      iconImage = img?.thumbnailUrl || img?.contentUrl || img?.url || "";
    }
  } catch {
    /* ignore */
  }
  const bannerImg = $(".rounded-lg.d-block.object-cover, .rounded-lg img, article img").first();
  if (!bannerImage && bannerImg.length) bannerImage = absoluteUrl(bannerImg.attr("src")!);
  if (!iconImage) iconImage = bannerImage;
  if (!bannerImage) bannerImage = iconImage;

  // Category and type from breadcrumb / Genre links
  let categorySlug = "productivity";
  let inferredType: "game" | "app" = "app";
  $('a[href*="liteapks.com/apps/"], a[href*="liteapks.com/games/"]').each((_, a) => {
    const href = $(a).attr("href") || "";
    const m = href.match(/\/(apps|games)\/([^/?]+)/);
    if (m) {
      categorySlug = m[2];
      inferredType = m[1] === "games" ? "game" : "app";
    }
  });
  if (categorySlug === "productivity" && genre) {
    categorySlug = genre.toLowerCase().replace(/\s+/g, "-");
    inferredType = "game"; // liteapks is mostly games
  }

  // MOD features from accordion
  const modFeatures: string[] = [];
  $("#accordion-more-info ul li, .accordion-more-info ul li").each((_, li) => {
    const text = $(li).text().trim();
    if (text) modFeatures.push(text);
  });
  const modFeaturesStr = modFeatures.slice(0, 10).join("\n");

  // Download notes
  const downloadNotes: string[] = [];
  $(".small.mb-3 ol li, .small.mb-3 ul li").each((_, li) => {
    const text = $(li).text().trim();
    if (text && (text.includes("Install") || text.includes("incompatible"))) downloadNotes.push(text);
  });
  const downloadNotesStr = downloadNotes.join("\n");

  // Content blocks
  const blocks: Array<{ type: string; content?: string; url?: string; left?: { type: string; url: string }; right?: { type: string; url: string } }> = [];
  $(".entry-content").find("p, h2, h3, .wp-block-image, img").each((_, el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase();
    if (tag === "h2" || tag === "h3") {
      const text = $el.text().trim();
      if (text && !text.includes("Download") && !text.includes("Leave a Comment")) {
        blocks.push({ type: "h1", content: text });
      }
      return;
    }
    if (tag === "p") {
      const text = $el.text().trim();
      if (text && !text.includes("Download") && !text.includes("Join @LITEAPKS")) {
        blocks.push({ type: "text", content: text });
      }
      return;
    }
    if (tag === "img" && !$el.closest("a").length) {
      const src = $el.attr("src");
      if (src && !src.includes("google-play") && !src.includes("telegram")) {
        blocks.push({ type: "image", url: absoluteUrl(src) });
      }
    }
  });
  const contentBlocks = JSON.stringify(blocks);

  const normalizedSize = formatSize(size) || size;

  // Single download version (liteapks typically has one)
  const downloadVersions = downloadUrl && (version || size)
    ? JSON.stringify([{ version: version || "Latest", size: normalizedSize || "APK", url: downloadUrl }])
    : "[]";

  return {
    slug,
    title,
    type: inferredType,
    description,
    appName,
    publisher,
    genre,
    size: normalizedSize,
    version,
    modInfo,
    modFeatures: modFeaturesStr,
    downloadNotes: downloadNotesStr,
    downloadUrl,
    downloadVersions,
    bannerImage,
    iconImage,
    categorySlug,
    contentBlocks,
  };
}

async function downloadImagesToLocal(entry: ScrapedEntry): Promise<ScrapedEntry> {
  const publicDir = path.join(process.cwd(), "public");
  const slug = entry.slug;

  if (entry.bannerImage?.startsWith("http")) {
    const ext = getExtFromUrl(entry.bannerImage);
    const relPath = `images/banners/${slug}-banner.${ext}`;
    const fullPath = path.join(publicDir, relPath);
    if (await downloadImage(entry.bannerImage, fullPath)) {
      entry.bannerImage = `/${relPath}`;
      console.log("  Downloaded banner:", relPath);
    }
  }

  if (entry.iconImage?.startsWith("http")) {
    const ext = getExtFromUrl(entry.iconImage);
    const relPath = `images/icons/${slug}-icon.${ext}`;
    const fullPath = path.join(publicDir, relPath);
    if (await downloadImage(entry.iconImage, fullPath)) {
      entry.iconImage = `/${relPath}`;
      console.log("  Downloaded icon:", relPath);
    }
  }

  let blocks: Array<{ type: string; url?: string; left?: { url: string }; right?: { url: string } }> = [];
  try {
    blocks = JSON.parse(entry.contentBlocks || "[]");
  } catch {
    return entry;
  }

  let imgIndex = 0;
  const entriesDir = path.join(publicDir, "images", "entries", slug);
  fs.mkdirSync(entriesDir, { recursive: true });

  for (const block of blocks) {
    if (block.type === "image" && block.url?.startsWith("http")) {
      const ext = getExtFromUrl(block.url);
      const relPath = `images/entries/${slug}/${++imgIndex}.${ext}`;
      const fullPath = path.join(publicDir, relPath);
      if (await downloadImage(block.url, fullPath)) {
        block.url = `/${relPath}`;
        console.log("  Downloaded content image:", relPath);
      }
    }
  }
  entry.contentBlocks = JSON.stringify(blocks);
  return entry;
}

function toCsvRow(entry: ScrapedEntry): string {
  const cols = [
    entry.slug,
    entry.title,
    entry.type,
    entry.description,
    entry.appName,
    entry.publisher,
    entry.genre,
    entry.size,
    entry.version,
    entry.modInfo,
    entry.modFeatures,
    entry.downloadNotes,
    entry.downloadUrl,
    entry.downloadVersions,
    entry.bannerImage,
    entry.iconImage,
    entry.categorySlug,
    entry.contentBlocks,
  ];
  return cols.map(escapeCsv).join(",");
}

function getCsvHeaders(): string {
  return "slug,title,type,description,appName,publisher,genre,size,version,modInfo,modFeatures,downloadNotes,downloadUrl,downloadVersions,bannerImage,iconImage,categorySlug,contentBlocks";
}

const DELAY_MS = 2500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let urls: string[] = [];
  const args = process.argv.slice(2);

  const fileIdx = args.indexOf("--file");
  const filePath = fileIdx !== -1 && args[fileIdx + 1]
    ? path.join(process.cwd(), args[fileIdx + 1])
    : LITEAPKS_INPUT;

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    urls = content
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/)[0])
      .filter((line) => line && line.startsWith("http") && line.includes("liteapks.com") && !line.startsWith("#"));
  }

  if (urls.length === 0) {
    console.error("Usage: npx tsx scripts/scrape-liteapks.ts [--file scripts/liteapks-urls.txt] [--resume]");
    console.error("Input file:", LITEAPKS_INPUT);
    console.error("Output file:", LITEAPKS_OUTPUT);
    process.exit(1);
  }

  const resume = args.includes("--resume");
  let existingEntries: ScrapedEntry[] = [];
  let existingSlugs = new Set<string>();

  if (resume && fs.existsSync(LITEAPKS_PROGRESS)) {
    try {
      const progressContent = fs.readFileSync(LITEAPKS_PROGRESS, "utf-8").trim();
      if (progressContent.length > 0) {
        const fullCsv = getCsvHeaders() + "\n" + progressContent;
        const rows = parse(fullCsv, { columns: true, relax_quotes: true, relax_column_count: true }) as Record<string, string>[];
        if (rows.length > 0) {
          existingSlugs = new Set(rows.map((r) => (r.slug || "").trim()).filter(Boolean));
          existingEntries = rows.map((r) => ({
            slug: r.slug || "",
            title: r.title || "",
            type: (r.type === "game" ? "game" : "app") as "game" | "app",
            description: r.description || "",
            appName: r.appName || "",
            publisher: r.publisher || "",
            genre: r.genre || "",
            size: r.size || "",
            version: r.version || "",
            modInfo: r.modInfo || "",
            modFeatures: r.modFeatures || "",
            downloadNotes: r.downloadNotes || "",
            downloadUrl: r.downloadUrl || "",
            downloadVersions: r.downloadVersions || "",
            bannerImage: r.bannerImage || "",
            iconImage: r.iconImage || "",
            categorySlug: r.categorySlug || "",
            contentBlocks: r.contentBlocks || "",
          }));
          console.log(`Resume: recovered ${existingSlugs.size} from previous run.`);
        }
      }
    } catch (e) {
      console.warn("Could not read progress:", e);
    }
  }

  if (resume && fs.existsSync(LITEAPKS_OUTPUT) && existingSlugs.size === 0) {
    try {
      const csvContent = fs.readFileSync(LITEAPKS_OUTPUT, "utf-8");
      const rows = parse(csvContent, { columns: true, relax_quotes: true, relax_column_count: true }) as Record<string, string>[];
      existingSlugs = new Set(rows.map((r) => (r.slug || "").trim()).filter(Boolean));
      existingEntries = rows.map((r) => ({
        slug: r.slug || "",
        title: r.title || "",
        type: (r.type === "game" ? "game" : "app") as "game" | "app",
        description: r.description || "",
        appName: r.appName || "",
        publisher: r.publisher || "",
        genre: r.genre || "",
        size: r.size || "",
        version: r.version || "",
        modInfo: r.modInfo || "",
        modFeatures: r.modFeatures || "",
        downloadNotes: r.downloadNotes || "",
        downloadUrl: r.downloadUrl || "",
        downloadVersions: r.downloadVersions || "",
        bannerImage: r.bannerImage || "",
        iconImage: r.iconImage || "",
        categorySlug: r.categorySlug || "",
        contentBlocks: r.contentBlocks || "",
      }));
      console.log(`Resume: skipping ${existingSlugs.size} already scraped.`);
    } catch (e) {
      console.warn("Could not read existing CSV:", e);
    }
  }

  const urlsToScrape = urls.filter((url) => !existingSlugs.has(extractSlugFromUrl(url)));

  if (urlsToScrape.length === 0) {
    console.log("All URLs already scraped.");
    return;
  }

  console.log(`LITEAPKS: Scraping ${urlsToScrape.length} URLs (${urls.length - urlsToScrape.length} skipped).\n`);

  const newEntries: ScrapedEntry[] = [];

  for (let i = 0; i < urlsToScrape.length; i++) {
    const url = urlsToScrape[i];
    const progress = `${i + 1}/${urlsToScrape.length}`;
    fs.writeFileSync(LITEAPKS_PROGRESS_TXT, progress, "utf-8");
    console.log(`\n[${progress}] Scraping: ${url}`);
    try {
      let entry = await scrapeLiteapksPage(url);
      console.log("  Downloading images...");
      entry = await downloadImagesToLocal(entry);
      console.log("  Title:", entry.title);
      console.log("  Size:", entry.size, "| Version:", entry.version);
      newEntries.push(entry);
      fs.appendFileSync(LITEAPKS_PROGRESS, toCsvRow(entry) + "\n", "utf-8");
    } catch (err) {
      console.error("  ERROR:", err instanceof Error ? err.message : String(err));
    }
    if (i < urlsToScrape.length - 1) await sleep(DELAY_MS);
  }

  const entries = [...existingEntries, ...newEntries];
  const content = getCsvHeaders() + "\n" + entries.map(toCsvRow).join("\n") + "\n";
  fs.writeFileSync(LITEAPKS_OUTPUT, content, "utf-8");
  if (fs.existsSync(LITEAPKS_PROGRESS)) fs.unlinkSync(LITEAPKS_PROGRESS);
  if (fs.existsSync(LITEAPKS_PROGRESS_TXT)) fs.unlinkSync(LITEAPKS_PROGRESS_TXT);
  console.log(`\nSaved ${entries.length} entries to ${LITEAPKS_OUTPUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
