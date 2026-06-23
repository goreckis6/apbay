# MODYOLO Scraper & Import

Extract data from MODYOLO pages and import into your site.

## Quick start

```bash
# 1. Scrape a MODYOLO page (saves to scripts/modyolo-export.csv)
npm run scrape:modyolo -- https://modyolo.com/acode-powerful-code-editor.html

# 2. Import the CSV into your database
npm run import:modyolo
```

## Scraper

**Usage:** `npx tsx scripts/scrape-modyolo.ts [url]` or `npx tsx scripts/scrape-modyolo.ts --file scripts/modyolo-urls.txt [--resume|--new-list]`

For batch scraping, create a text file with one URL per line and use `--file`:

- **`--resume`** – Skip already-scraped URLs and append new entries to the existing CSV (useful when the scraper times out).
- **`--new-list`** – Treat the file as a standalone list. Output only these entries to `scripts/modyolo-export-newlist.csv` (no merge with the big list). Use when you paste a fresh set of URLs and want a separate export.

Extracts from a MODYOLO page:

- **Title** – Full app/game title (e.g. "Acode - Powerful Code Editor v1.11.7 APK (Paid)")
- **Description** – Short description
- **App Name** – Clean app name from metadata table
- **Publisher** – Developer name
- **Genre** – Category (e.g. Productivity)
- **Size** – APK size (e.g. 7M)
- **Version** – Latest version
- **MOD Info** – Mod type (e.g. Paid, Patched)
- **MOD Features** – Bullet list of features
- **Download Notes** – Notes for the download section
- **Download URL** – MODYOLO download link
- **Banner & Icon** – Image URLs
- **Content Blocks** – JSON: text, h1, images, two-columns

Output: `scripts/modyolo-export.csv` (or `scripts/modyolo-export-newlist.csv` with `--new-list`)

## Import

**Usage:** `npx tsx scripts/import-modyolo-csv.ts [path-to-csv]`

Imports the CSV into your database. Creates categories if needed. Upserts entries by slug.

Default path: `scripts/modyolo-export.csv`

## Fix Entry Types (after wrong import)

If entries were imported with wrong type (all as "app" instead of "game"), run:

```bash
npm run fix:entry-types
```

This fetches each MODYOLO page, extracts type from Genre links (`/games/` = game, `/apps/` = app), and updates the database.

## Scrape Download Links (Direct APK URLs)

**Usage:** `npx tsx scripts/scrape-download-links.ts [url1] [url2] ...`

Extracts the actual `files.modyolo.com` APK download link from MODYOLO pages. MODYOLO shows a "wait 10 sec" countdown before revealing the direct link; this script uses Playwright to wait and extract it.

```bash
npm run scrape:download-links -- https://modyolo.com/cat-kingdoms-defense.html https://modyolo.com/cat-commanders-tank-wars.html
```

Output: `scripts/links.txt` (tab-separated: slug, direct_link, download_page_url)

- Use `HEADED=1` for visible browser (debugging): `HEADED=1 npm run scrape:download-links -- ...`

---

## LITEAPKS (separate from MODYOLO)

Scrape from liteapks.com with **separate input/output files** – no mixing with MODYOLO.

**Input:** `scripts/liteapks-urls.txt` (one URL per line)  
**Output:** `scripts/liteapks-export.csv`

```bash
# 1. Add URLs to scripts/liteapks-urls.txt, then scrape
npx tsx scripts/scrape-liteapks.ts

# 2. Import into database
npx tsx scripts/import-liteapks-csv.ts
```

- `--resume` – Skip already-scraped URLs, continue from where you left off
