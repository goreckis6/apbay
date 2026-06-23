/**
 * Export all entries from the database for XSLT processing.
 * Outputs XML (for XSLT) and CSV (for pandas/Excel).
 *
 * Usage: npx tsx scripts/export-entries-for-xslt.ts [--base-url https://yoursite.com] [--format xml|csv|both]
 * Default: --format both, --base-url http://localhost:3000
 *
 * Output:
 *   scripts/export-entries.xml  - XML for XSLT
 *   scripts/export-entries.csv  - CSV for pandas
 */

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OUTPUT_DIR = path.join(process.cwd(), "scripts");
const XML_OUTPUT = path.join(OUTPUT_DIR, "export-entries.xml");
const CSV_OUTPUT = path.join(OUTPUT_DIR, "export-entries.csv");

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCsv(str: string): string {
  if (str == null) return "";
  const s = String(str);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  const args = process.argv.slice(2);
  let baseUrl = "http://localhost:3000";
  let format: "xml" | "csv" | "both" = "both";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base-url" && args[i + 1]) {
      baseUrl = args[i + 1].replace(/\/$/, "");
      i++;
    } else if (args[i] === "--format" && args[i + 1]) {
      format = args[i + 1] as "xml" | "csv" | "both";
      i++;
    }
  }

  const entries = await prisma.entry.findMany({
    include: { category: true },
    orderBy: { publishedAt: "desc" },
  });

  console.log(`Exporting ${entries.length} entries (baseUrl: ${baseUrl}, format: ${format})`);

  const csvColumns = [
    "slug",
    "title",
    "type",
    "pageUrl",
    "description",
    "publisher",
    "size",
    "version",
    "modInfo",
    "modFeatures",
    "downloadUrl",
    "downloadNotes",
    "downloadVersions",
    "bannerImage",
    "iconImage",
    "contentBlocks",
    "categorySlug",
    "categoryName",
    "publishedAt",
  ];

  if (format === "xml" || format === "both") {
    const xmlLines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?xml-stylesheet type="text/xsl" href="export-entries.xslt"?>',
      "<table>",
      "  <columns>",
      ...csvColumns.map((c) => `    <column name="${escapeXml(c)}"/>`),
      "  </columns>",
      "  <header>",
      "    " + csvColumns.map((c) => `<col name="${escapeXml(c)}">${escapeXml(c)}</col>`).join(""),
      "  </header>",
      "  <rows>",
    ];

    for (const e of entries) {
      const pageUrl = `${baseUrl}/${e.type}s/${e.slug}`;
      const values = [
        e.slug,
        e.title,
        e.type,
        pageUrl,
        e.description || "",
        e.publisher || "",
        e.size || "",
        e.version || "",
        e.modInfo || "",
        e.modFeatures || "",
        e.downloadUrl || "",
        e.downloadNotes || "",
        e.downloadVersions || "",
        e.bannerImage || "",
        e.iconImage || "",
        e.contentBlocks || "",
        e.category?.slug || "",
        e.category?.name || "",
        e.publishedAt?.toISOString() || "",
      ];
      xmlLines.push(
        "    <row>" +
          csvColumns
            .map((c, i) => `<col name="${escapeXml(c)}">${escapeXml(String(values[i]))}</col>`)
            .join("") +
          "</row>"
      );
    }

    xmlLines.push("  </rows>", "</table>");
    fs.writeFileSync(XML_OUTPUT, xmlLines.join("\n"), "utf-8");
    console.log(`Wrote ${XML_OUTPUT}`);
  }

  if (format === "csv" || format === "both") {
    const csvRows: string[] = [csvColumns.map(escapeCsv).join(",")];

    for (const e of entries) {
      const pageUrl = `${baseUrl}/${e.type}s/${e.slug}`;
      const row = [
        e.slug,
        e.title,
        e.type,
        pageUrl,
        e.description || "",
        e.publisher || "",
        e.size || "",
        e.version || "",
        e.modInfo || "",
        e.modFeatures || "",
        e.downloadUrl || "",
        e.downloadNotes || "",
        e.downloadVersions || "",
        e.bannerImage || "",
        e.iconImage || "",
        e.contentBlocks || "",
        e.category?.slug || "",
        e.category?.name || "",
        e.publishedAt?.toISOString() || "",
      ];
      csvRows.push(row.map(escapeCsv).join(","));
    }

    fs.writeFileSync(CSV_OUTPUT, csvRows.join("\n"), "utf-8");
    console.log(`Wrote ${CSV_OUTPUT}`);
  }

  console.log(`Done. Exported ${entries.length} entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
