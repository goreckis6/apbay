/**
 * MODYOLO Scraper
 * Fetches a MODYOLO page and extracts: title, description, app name, publisher,
 * genre, size, version, mod info, content blocks, download URL, and images.
 * Downloads images locally to public/images. Outputs to CSV for import.
 *
 * Usage: npx tsx scripts/scrape-modyolo.ts <url>
 * Example: npx tsx scripts/scrape-modyolo.ts https://modyolo.com/acode-powerful-code-editor.html
 */

import * as fs from "fs";
import * as path from "path";
import { load } from "cheerio";
import { parse } from "csv-parse/sync";
import { formatSize } from "../lib/formatSize";

const MODYOLO_BASE = "https://modyolo.com";

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

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
  downloadVersions: string; // JSON: [{version, size, url}]
  bannerImage: string;
  iconImage: string;
  categorySlug: string;
  contentBlocks: string;
}

function extractSlugFromUrl(url: string): string {
  const m = url.match(/modyolo\.com\/([^/]+)\.html$/);
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
  const base = MODYOLO_BASE.replace(/\/$/, "");
  return href.startsWith("/") ? `${base}${href}` : `${base}/${href}`;
}

async function scrapeModyoloPage(url: string): Promise<ScrapedEntry> {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const html = await res.text();
  const $ = load(html);

  const slug = extractSlugFromUrl(url);

  // Title
  const title =
    $("h1.entry-title").text().trim() ||
    $("h1").first().text().trim() ||
    $("meta[property='og:title']").attr("content") ||
    "";

  // Description (italic text after date)
  const description =
    $(".entry-content p em").first().text().trim() ||
    $(".entry-content p").first().text().trim() ||
    $("meta[property='og:description']").attr("content") ||
    "";

  // Metadata table (table.table or table-borderless)
  const table: Record<string, string> = {};
  $("table.table tr, table.table-striped tr, table.table-borderless tr").each((_, tr) => {
    const th = $(tr).find("th").text().trim().replace(/:\s*$/, "");
    const td = $(tr).find("td").last().text().trim();
    if (th && td) table[th] = td;
  });

  // Also try data attributes / common MODYOLO structure
  const appName = table["App Name"] || title.split(" APK")[0]?.trim() || title;
  const publisher = table["Publisher"] || "";
  const genre = table["Genre"] || "";
  const size = table["Size"] || "";
  const version = table["Latest Version"] || table["Version"] || "";
  const modInfo = table["MOD Info"] || "";

  // Download URL
  const downloadLink = $(
    'a[href*="/download/"], .download-btn, .dpost-d a[href*=".apk"], .dpost-d a[href*="/download/"]'
  ).first();
  const downloadUrl = downloadLink.attr("href")
    ? absoluteUrl(downloadLink.attr("href")!)
    : "";

  // Images (fallback: og:image, JSON-LD thumbnailUrl)
  let bannerImage = $("meta[property='og:image']").attr("content") || "";
  let iconImage = $('script[type="application/ld+json"]')
    .toArray()
    .map((s) => {
      try {
        const j = JSON.parse($(s).html() || "{}");
        const graph = j["@graph"] || (Array.isArray(j) ? j : [j]);
        const img = graph.find((g: { "@type"?: string; thumbnailUrl?: string }) => g["thumbnailUrl"]);
        return img?.thumbnailUrl || "";
      } catch {
        return "";
      }
    })
    .find((u) => u) || "";
  const bannerImg = $(".dpost-c-top img, .entry-content .aligncenter img, .entry-content img").first();
  const iconImg = $('img[src*="150x150"], .dpost-c-left img').first();
  if (!bannerImage && bannerImg.length) bannerImage = absoluteUrl(bannerImg.attr("src")!);
  if (!iconImage && iconImg.length) iconImage = absoluteUrl(iconImg.attr("src")!);
  if (!bannerImage) bannerImage = iconImage;

  // Category and type from breadcrumb/Genre links (modyolo.com/games/xxx or apps/xxx)
  // Type is inferred from the category path: /games/ = game, /apps/ = app
  let categorySlug = "productivity";
  let inferredType: "game" | "app" = "app";
  $('a[href*="modyolo.com/apps/"], a[href*="modyolo.com/games/"]').each((_, a) => {
    const href = $(a).attr("href") || "";
    const m = href.match(/\/(apps|games)\/([^/?]+)/);
    if (m) {
      categorySlug = m[2];
      inferredType = m[1] === "games" ? "game" : "app";
    }
  });
  // Fallback: JSON-LD breadcrumb
  if (categorySlug === "productivity") {
    try {
      const ld = $('script[type="application/ld+json"]').first().html();
      if (ld) {
        const j = JSON.parse(ld);
        const graph = j["@graph"] || [];
        const bc = graph.find((g: { breadcrumb?: { itemListElement?: { item?: string }[] } }) => g.breadcrumb);
        const items = bc?.itemListElement || [];
        const last = items.find((i: { item?: string }) => (i.item || "").includes("/apps/") || (i.item || "").includes("/games/"));
        if (last?.item) {
          const m = last.item.match(/\/(apps|games)\/([^/?]+)/);
          if (m) {
            categorySlug = m[2];
            inferredType = m[1] === "games" ? "game" : "app";
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  // MOD features (bullet list before download)
  const modFeatures: string[] = [];
  $(".entry-content ul li").each((_, li) => {
    const text = $(li).text().trim();
    if (text && !text.includes("Download") && !text.includes("Join")) {
      modFeatures.push(text);
    }
  });
  const modFeaturesStr = modFeatures.slice(0, 10).join("\n");

  // Download notes (ul in .small.mb-3, after "Here are some notes")
  const downloadNotes: string[] = [];
  $(".small.mb-3").each((_, div) => {
    const $div = $(div);
    if ($div.find("p").text().includes("Here are some notes")) {
      $div.find("ul li").each((_, li) => downloadNotes.push($(li).text().trim()));
    }
  });
  const downloadNotesStr = downloadNotes.join("\n");

  // Content blocks from article body (exclude carousel/gallery)
  const blocks: Array<{
    type: string;
    content?: string;
    url?: string;
    left?: { type: string; url: string };
    right?: { type: string; url: string };
  }> = [];

  const contentArea = $(".entry-content").clone();
  // Remove carousel/gallery (row with data-fancybox images) so we don't scrape it
  contentArea.find(".row.row-small, .row.flex-nowrap").remove();
  contentArea.find('a[data-fancybox="gallery"]').closest(".row").remove();

  let currentSection = "";

  contentArea.find("p, h2, h3, .wp-block-image, table, ul, div.ace-line").each((_, el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase();

    // Skip if inside carousel/gallery
    if ($el.closest(".row.row-small, .row.flex-nowrap").length) return;
    if ($el.closest('a[data-fancybox="gallery"]').length) return;

    if (tag === "h2" || tag === "h3") {
      currentSection = $el.text().trim();
      if (currentSection) {
        blocks.push({ type: "h1", content: currentSection });
      }
      return;
    }

    if (tag === "p" || (tag === "div" && $el.hasClass("ace-line"))) {
      const text = $el.text().trim();
      if (text && !text.includes("Download") && !text.includes("Join MODYOLO")) {
        blocks.push({ type: "text", content: text });
      }
      return;
    }

    if ($el.hasClass("wp-block-image") || ($el.find("img").length && !$el.hasClass("ace-line"))) {
      const imgs = $el.find("img");
      if (imgs.length >= 2) {
        const left = imgs.eq(0).attr("src");
        const right = imgs.eq(1).attr("src");
        if (left && right) {
          blocks.push({
            type: "two-columns",
            left: { type: "image", url: absoluteUrl(left) },
            right: { type: "image", url: absoluteUrl(right) },
          });
        }
      } else if (imgs.length === 1) {
        blocks.push({
          type: "image",
          url: absoluteUrl(imgs.attr("src")!),
        });
      }
      return;
    }

    if (tag === "ul") {
      const parent = $el.closest(".dpost-d");
      if (parent.length) return;
      $el.find("li").each((_, li) => {
        const t = $(li).text().trim();
        if (t) blocks.push({ type: "text", content: `• ${t}` });
      });
    }
  });

  const contentBlocks = JSON.stringify(blocks);

  const normalizedSize = formatSize(size) || size;

  // Scrape download page for multiple versions
  let downloadVersions: Array<{ version: string; size: string; url: string }> = [];
  const seen = new Set<string>();
  if (downloadUrl) {
    try {
      const dlRes = await fetch(downloadUrl, { headers: FETCH_HEADERS });
      if (dlRes.ok) {
        const dl$ = load(await dlRes.text());
        dl$(".border.rounded.mb-3").each((_, card) => {
          const $card = dl$(card);
          const versionLabel = $card.find(".h6.font-weight-semibold, .h6, h6").first().text().trim().replace(/\s*-\s*Mod\s*$/i, "").trim();
          const link = $card.find('a[href*="/download/"]').first();
          const href = link.attr("href");
          const sizeText = $card.find(".text-muted").last().text().trim() || link.find(".ml-auto").text().trim() || "";
          const sizeMatch = sizeText.match(/(\d+(?:\.\d+)?\s*(?:MB|M|GB|G))?/i);
          const rawSize = (sizeMatch?.[1] || size || "APK").trim();
          const url = href ? absoluteUrl(href) : "";
          const key = `${versionLabel}|${url}`;
          if (url && versionLabel && !seen.has(key)) {
            seen.add(key);
            downloadVersions.push({
              version: versionLabel,
              size: formatSize(rawSize) || rawSize || "APK",
              url,
            });
          }
        });
      }
    } catch {
      /* ignore */
    }
  }
  if (downloadVersions.length === 0 && downloadUrl && (version || size)) {
    downloadVersions = [{ version: version || "Latest", size: normalizedSize || "APK", url: downloadUrl }];
  }

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
    downloadVersions: JSON.stringify(downloadVersions),
    bannerImage,
    iconImage,
    categorySlug,
    contentBlocks,
  };
}

async function downloadImagesToLocal(entry: ScrapedEntry): Promise<ScrapedEntry> {
  const publicDir = path.join(process.cwd(), "public");
  const slug = entry.slug;

  // Banner
  if (entry.bannerImage?.startsWith("http")) {
    const ext = getExtFromUrl(entry.bannerImage);
    const relPath = `images/banners/${slug}-banner.${ext}`;
    const fullPath = path.join(publicDir, relPath);
    if (await downloadImage(entry.bannerImage, fullPath)) {
      entry.bannerImage = `/${relPath}`;
      console.log("  Downloaded banner:", relPath);
    }
  }

  // Icon
  if (entry.iconImage?.startsWith("http")) {
    const ext = getExtFromUrl(entry.iconImage);
    const relPath = `images/icons/${slug}-icon.${ext}`;
    const fullPath = path.join(publicDir, relPath);
    if (await downloadImage(entry.iconImage, fullPath)) {
      entry.iconImage = `/${relPath}`;
      console.log("  Downloaded icon:", relPath);
    }
  }

  // Content blocks images
  let blocks: Array<{ type: string; content?: string; url?: string; left?: { type: string; url: string }; right?: { type: string; url: string } }> = [];
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
    if (block.type === "two-columns") {
      if (block.left?.url?.startsWith("http")) {
        const ext = getExtFromUrl(block.left.url);
        const relPath = `images/entries/${slug}/${++imgIndex}-left.${ext}`;
        const fullPath = path.join(publicDir, relPath);
        if (await downloadImage(block.left.url, fullPath)) {
          block.left.url = `/${relPath}`;
          console.log("  Downloaded content image:", relPath);
        }
      }
      if (block.right?.url?.startsWith("http")) {
        const ext = getExtFromUrl(block.right.url);
        const relPath = `images/entries/${slug}/${++imgIndex}-right.${ext}`;
        const fullPath = path.join(publicDir, relPath);
        if (await downloadImage(block.right.url, fullPath)) {
          block.right.url = `/${relPath}`;
          console.log("  Downloaded content image:", relPath);
        }
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
  return [
    "slug",
    "title",
    "type",
    "description",
    "appName",
    "publisher",
    "genre",
    "size",
    "version",
    "modInfo",
    "modFeatures",
    "downloadNotes",
    "downloadUrl",
    "downloadVersions",
    "bannerImage",
    "iconImage",
    "categorySlug",
    "contentBlocks",
  ].join(",");
}

const DELAY_MS = 2500; // Polite delay between requests to avoid rate limiting

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let urls: string[] = [];
  const args = process.argv.slice(2);

  // Support --file path or direct URLs
  const fileIdx = args.indexOf("--file");
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const filePath = path.join(process.cwd(), args[fileIdx + 1]);
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    urls = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.startsWith("http") && !line.startsWith("#"));
  } else {
    urls = args.filter((u) => u.startsWith("http"));
  }

  if (urls.length === 0) {
    console.error("Usage: npx tsx scripts/scrape-modyolo.ts <modyolo-url> [url2] ...");
    console.error("   or: npx tsx scripts/scrape-modyolo.ts --file scripts/modyolo-urls.txt [--resume]");
    console.error("   or: npx tsx scripts/scrape-modyolo.ts --file scripts/modyolo-urls.txt --new-list");
    console.error("--resume: skip already scraped, append to existing CSV");
    console.error("--new-list: treat file as standalone list, output only these entries (no merge with big list)");
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), "scripts");
  const resume = args.includes("--resume");
  const newList = args.includes("--new-list");
  const outFile = path.join(outDir, newList ? "modyolo-export-newlist.csv" : "modyolo-export.csv");
  const progressFile = path.join(outDir, newList ? "modyolo-export-newlist-inprogress.csv" : "modyolo-export-inprogress.csv");

  let existingEntries: ScrapedEntry[] = [];
  let existingSlugs = new Set<string>();

  // --new-list: only use progress recovery (from same run), never merge with main CSV
  if (newList && fs.existsSync(progressFile)) {
    try {
      const progressContent = fs.readFileSync(progressFile, "utf-8").trim();
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
        console.log(`New list: recovered ${existingSlugs.size} from previous run, continuing...`);
        }
      }
    } catch (e) {
      console.warn("Could not read progress for recovery:", e);
    }
  }

  if (resume && !newList && fs.existsSync(outFile)) {
    try {
      let csvContent = fs.readFileSync(outFile, "utf-8");
      if (fs.existsSync(progressFile)) {
        const progressContent = fs.readFileSync(progressFile, "utf-8");
        const progressRows = progressContent.trim().split("\n").filter(Boolean);
        if (progressRows.length > 0) csvContent += "\n" + progressRows.join("\n");
        fs.unlinkSync(progressFile);
        console.log("Recovered partial progress from previous run.");
      }
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
      console.log(`Resume: skipping ${existingSlugs.size} already scraped entries.`);
    } catch (e) {
      console.warn("Could not read existing CSV for resume:", e);
    }
  }

  // Filter URLs to only unscraped (by slug from URL)
  const urlsToScrape = urls.filter((url) => {
    const slug = extractSlugFromUrl(url);
    return !existingSlugs.has(slug);
  });

  if (urlsToScrape.length === 0) {
    console.log("All URLs already scraped. Nothing to do.");
    if (newList && existingEntries.length > 0) {
      const content = getCsvHeaders() + "\n" + existingEntries.map(toCsvRow).join("\n") + "\n";
      fs.writeFileSync(outFile, content, "utf-8");
      console.log(`Saved ${existingEntries.length} entries to ${outFile}`);
    }
    return;
  }

  const modeLabel = newList ? "New list" : resume ? "Resume" : "";
  console.log(`${modeLabel ? modeLabel + ": " : ""}Scraping ${urlsToScrape.length} URLs (${urls.length - urlsToScrape.length} skipped).\n`);

  const newEntries: ScrapedEntry[] = [];

  for (let i = 0; i < urlsToScrape.length; i++) {
    const url = urlsToScrape[i];
    console.log(`\n[${i + 1}/${urlsToScrape.length}] Scraping: ${url}`);
    try {
      let entry = await scrapeModyoloPage(url);

      console.log("  Downloading images...");
      entry = await downloadImagesToLocal(entry);

      console.log("  Title:", entry.title);
      console.log("  Size:", entry.size, "| Version:", entry.version);
      newEntries.push(entry);
      if (resume || newList) {
        fs.appendFileSync(progressFile, toCsvRow(entry) + "\n", "utf-8");
      }
    } catch (err) {
      console.error("  ERROR:", err instanceof Error ? err.message : String(err));
    }
    // Polite delay between requests (skip on last item)
    if (i < urlsToScrape.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const entries = [...existingEntries, ...newEntries];
  const content = getCsvHeaders() + "\n" + entries.map(toCsvRow).join("\n") + "\n";
  fs.writeFileSync(outFile, content, "utf-8");
  if ((resume || newList) && fs.existsSync(progressFile)) fs.unlinkSync(progressFile);
  console.log(`\nSaved ${entries.length} entries to ${outFile} (${newEntries.length} new)${newList ? " [new list only]" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
