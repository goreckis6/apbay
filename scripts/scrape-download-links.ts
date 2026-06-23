/**
 * Scrape actual APK download links from MODYOLO.
 * MODYOLO shows a "wait 10 sec" countdown before revealing the files.modyolo.com link.
 * This script uses Playwright to wait for the link and extract it.
 *
 * Usage: npx tsx scripts/scrape-download-links.ts [url1] [url2] ...
 * Example: npx tsx scripts/scrape-download-links.ts https://modyolo.com/cat-kingdoms-defense.html
 *
 * Output: scripts/links.txt (slug	download_url)
 */

import * as fs from "fs";
import * as path from "path";
import { load } from "cheerio";
import { chromium } from "playwright-extra";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const stealth = require("puppeteer-extra-plugin-stealth")();

const MODYOLO_BASE = "https://modyolo.com";
const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};
const WAIT_FOR_LINK_MS = 8000; // Link shows after ~5 sec (extra buffer)
const DELAY_BETWEEN_PAGES_MS = 3000; // 2-4 sec between URLs

function extractSlugFromUrl(url: string): string {
  const m = url.match(/modyolo\.com\/([^/]+)\.html$/);
  return m ? m[1] : url.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  const base = MODYOLO_BASE.replace(/\/$/, "");
  return href.startsWith("/") ? `${base}${href}` : `${base}/${href}`;
}

function ensureDownloadUrlWithVersion(url: string): string {
  if (!url || !url.includes("/download/")) return url;
  if (/\/download\/[^/]+\/\d+$/.test(url)) return url;
  return url.replace(/\/?$/, "/1");
}

async function getDownloadPageUrl(mainUrl: string): Promise<string | null> {
  const res = await fetch(mainUrl, { headers: FETCH_HEADERS });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = load(html);
  const link = $('a[href*="/download/"]').first();
  const href = link.attr("href");
  return href ? absoluteUrl(href) : null;
}

async function getDirectDownloadLink(page: any, downloadPageUrl: string): Promise<string | null> {
  const capturedUrls: string[] = [];
  page.on("response", (response: any) => {
    const url = response.url();
    if (url.includes("files.modyolo.com") && url.includes(".apk")) {
      capturedUrls.push(url);
    }
  });

  let targetUrl = downloadPageUrl;
  if (!/\/download\/[^/]+\/\d+$/.test(downloadPageUrl)) {
    targetUrl = downloadPageUrl.replace(/\/?$/, "/1");
  }
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});

  await new Promise((r) => setTimeout(r, WAIT_FOR_LINK_MS));

  let directLink = await page.evaluate(() => {
    const clickHere = document.querySelector('a#click-here');
    if (clickHere) {
      const a = clickHere as HTMLAnchorElement;
      const href = (a.getAttribute("href") || a.href || "").trim();
      if (href && href.includes("files.modyolo.com")) return href;
      if (href && href.endsWith(".apk")) return href.startsWith("http") ? href : new URL(href, window.location.origin).href;
    }
    for (const a of document.querySelectorAll('a[href]')) {
      const href = (a as HTMLAnchorElement).href;
      if (href.includes("files.modyolo.com")) return href;
    }
    return null;
  });

  if (!directLink) {
    const html = await page.content();
    const $ = load(html);
    const clickHere = $('a#click-here').attr("href");
    if (clickHere && clickHere.includes("files.modyolo.com")) {
      directLink = clickHere.startsWith("http") ? clickHere : new URL(clickHere, targetUrl).href;
    } else {
      const filesLink = $('a[href*="files.modyolo.com"]').first().attr("href");
      if (filesLink) directLink = filesLink.startsWith("http") ? filesLink : new URL(filesLink, targetUrl).href;
    }
  }

  if (!directLink && capturedUrls.length > 0) {
    directLink = capturedUrls[0];
  }

  return directLink;
}

async function main() {
  const urls = process.argv.slice(2).filter((u) => u.startsWith("http"));
  if (urls.length === 0) {
    console.error("Usage: npx tsx scripts/scrape-download-links.ts <modyolo-url> [url2] [url3] ...");
    console.error("Example: npx tsx scripts/scrape-download-links.ts https://modyolo.com/cat-kingdoms-defense.html");
    process.exit(1);
  }

  const results: Array<{ slug: string; mainUrl: string; downloadPageUrl: string | null; directLink: string | null }> = [];

  chromium.use(stealth);
  const headless = process.env.HEADED !== "1";
  let browser;
  try {
    browser = await chromium.launch({
      headless,
      channel: "chrome",
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    });
  } catch {
    browser = await chromium.launch({
      headless,
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    });
  }
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    javaScriptEnabled: true,
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  const page = await context.newPage();

  try {
    for (let i = 0; i < urls.length; i++) {
      const mainUrl = urls[i];
      const slug = extractSlugFromUrl(mainUrl);
      console.log(`\n[${i + 1}/${urls.length}] ${slug}`);

      try {
        const downloadPageUrl = await getDownloadPageUrl(mainUrl);
        if (!downloadPageUrl) {
          console.log("  No download link found");
          results.push({ slug, mainUrl, downloadPageUrl: null, directLink: null });
          continue;
        }
        const downloadPageUrlWithVersion = ensureDownloadUrlWithVersion(downloadPageUrl);
        console.log("  Download page:", downloadPageUrlWithVersion);

        const directLink = await getDirectDownloadLink(page, downloadPageUrl);
        if (directLink) {
          console.log("  Direct link:", directLink);
          results.push({ slug, mainUrl, downloadPageUrl: downloadPageUrlWithVersion, directLink });
        } else {
          console.log("  Direct link not found (countdown may need more time)");
          results.push({ slug, mainUrl, downloadPageUrl: downloadPageUrlWithVersion, directLink: null });
        }
      } catch (err) {
        console.error("  Error:", err instanceof Error ? err.message : err);
        results.push({ slug, mainUrl, downloadPageUrl: null, directLink: null });
      }

      if (i < urls.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_PAGES_MS));
      }
    }
  } finally {
    await browser.close();
  }

  const outDir = path.join(process.cwd(), "scripts");
  const outFile = path.join(outDir, "links.txt");
  const lines = results.map((r) => `${r.slug}\t${r.directLink || ""}\t${r.downloadPageUrl || ""}`).join("\n");
  fs.writeFileSync(outFile, lines, "utf-8");
  console.log(`\nSaved ${results.length} entries to ${outFile}`);
  const found = results.filter((r) => r.directLink).length;
  console.log(`  ${found} direct links extracted`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
