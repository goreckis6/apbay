#!/usr/bin/env python3
"""
Process exported entries with pandas for XSLT preparation.
Reads from scripts/export-entries.csv (run export-entries-for-xslt.ts first)
or directly from SQLite database.

Usage:
  python scripts/export-entries-pandas.py [--from-csv] [--from-db] [--base-url URL] [--output FILE]
  --from-csv  : Read from scripts/export-entries.csv (default)
  --from-db   : Read directly from prisma/dev.db
  --base-url  : Base URL for page URLs (default: http://localhost:3000)
  --output    : Output XML file (default: scripts/export-entries-pandas.xml)

Output: XML file suitable for XSLT processing.
"""

import argparse
import sqlite3
import xml.etree.ElementTree as ET
from xml.dom import minidom
import pandas as pd
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent
DB_PATH = PROJECT_ROOT / "prisma" / "dev.db"
CSV_PATH = SCRIPT_DIR / "export-entries.csv"


def escape_xml(text):
    if pd.isna(text) or text is None:
        return ""
    text = str(text)
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def load_from_csv(csv_path: Path) -> pd.DataFrame:
    """Load entries from CSV exported by TypeScript script."""
    if not csv_path.exists():
        raise FileNotFoundError(
            f"CSV not found: {csv_path}\nRun: npx tsx scripts/export-entries-for-xslt.ts first"
        )
    return pd.read_csv(csv_path)


def load_from_db(db_path: Path, base_url: str) -> pd.DataFrame:
    """Load entries directly from SQLite database."""
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found: {db_path}")

    conn = sqlite3.connect(db_path)
    query = """
        SELECT
            e.slug, e.title, e.type, e.description, e.publisher,
            e.size, e.version, e.modInfo, e.modFeatures,
            e.downloadUrl, e.downloadNotes, e.downloadVersions,
            e.bannerImage, e.iconImage, e.contentBlocks,
            e.publishedAt,
            c.slug as categorySlug, c.name as categoryName
        FROM Entry e
        LEFT JOIN Category c ON e.categoryId = c.id
        ORDER BY e.publishedAt DESC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()

    # Add pageUrl
    df["pageUrl"] = f"{base_url.rstrip('/')}/" + df["type"] + "s/" + df["slug"]
    return df


def df_to_xml(df: pd.DataFrame, output_path: Path) -> None:
    """Convert DataFrame to XML for XSLT."""
    root = ET.Element("entries")

    for _, row in df.iterrows():
        entry = ET.SubElement(root, "entry")
        for col in df.columns:
            val = row[col]
            if pd.isna(val):
                val = ""
            else:
                val = str(val)
            child = ET.SubElement(entry, col)
            child.text = escape_xml(val)

    xml_str = minidom.parseString(ET.tostring(root, encoding="unicode")).toprettyxml(
        indent="  "
    )
    output_path.write_text(xml_str, encoding="utf-8")
    print(f"Wrote {output_path} ({len(df)} entries)")


def main():
    parser = argparse.ArgumentParser(description="Export entries for XSLT using pandas")
    parser.add_argument(
        "--from-csv",
        action="store_true",
        help="Read from export-entries.csv (run TypeScript export first)",
    )
    parser.add_argument(
        "--from-db",
        action="store_true",
        help="Read directly from SQLite database",
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:3000",
        help="Base URL for page URLs",
    )
    parser.add_argument(
        "--output",
        default=str(SCRIPT_DIR / "export-entries-pandas.xml"),
        help="Output XML file path",
    )
    args = parser.parse_args()

    if args.from_db:
        df = load_from_db(DB_PATH, args.base_url)
    else:
        df = load_from_csv(CSV_PATH)

    print(f"Loaded {len(df)} entries")
    df_to_xml(df, Path(args.output))
    print("Done.")


if __name__ == "__main__":
    main()
