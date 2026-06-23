"""Merge modyolo-export.csv and modyolo-export-newlist.csv into one file.
Deduplicates by slug; when duplicate, keeps entry from newlist."""
import csv
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
FILE1 = SCRIPT_DIR / "modyolo-export.csv"
FILE2 = SCRIPT_DIR / "modyolo-export-newlist.csv"
OUTPUT = SCRIPT_DIR / "modyolo-export-merged.csv"


def main():
    seen = set()
    rows = []
    fieldnames = None

    # newlist first so its entries take precedence on duplicates
    for fpath in [FILE2, FILE1]:
        with open(fpath, encoding="utf-8") as f:
            r = csv.DictReader(f)
            if fieldnames is None:
                fieldnames = r.fieldnames
            for row in r:
                slug = (row.get("slug") or "").strip()
                if not slug:
                    continue
                if slug in seen:
                    continue
                seen.add(slug)
                rows.append(row)

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"Merged: {len(rows)} entries -> {OUTPUT}")


if __name__ == "__main__":
    main()
