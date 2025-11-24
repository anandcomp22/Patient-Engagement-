#!/usr/bin/env python3
"""
csv_to_txt.py

Convert a CSV of medicines into separate .txt files, one per medicine.

Usage:
    python csv_to_txt.py --input medicines.csv --outdir txts
"""

import csv
import os
import re
import argparse
import sys

def safe_filename(s, max_len=120):
    """Return a filesystem-safe filename."""
    if not s:
        s = "unknown"
    s = str(s).strip()
    s = re.sub(r'\s+', '_', s)                # replace spaces with underscore
    s = re.sub(r'[^A-Za-z0-9\-_.]', '', s)   # remove unsafe characters
    return s[:max_len] if s else "unknown"

def choose_name_column(fieldnames):
    """Pick the most likely column to use as medicine name."""
    preferred = ['name', 'drugname', 'drug_name', 'medicine', 'product', 'label', 'brand']
    lower_map = {fn.lower(): fn for fn in fieldnames}
    for p in preferred:
        if p in lower_map:
            return lower_map[p]
    return fieldnames[0]  # fallback to first column

def format_row_text(row, name_col):
    """Format a row from CSV into readable text."""
    lines = []
    name = row.get(name_col, '').strip()
    lines.append(f"Name: {name}\n")

    # Common fields
    common_fields = ['INDICATIONS', 'DIRECTIONS', 'Directions', 'WARNINGS', 'Warnings', 'OpenFDA label set_id']
    added = set([name_col])

    for field in common_fields:
        if field in row and row[field].strip():
            lines.append(f"{field}: {row[field].strip()}\n")
            added.add(field)

    # Add any other fields
    for field, value in row.items():
        if field not in added and value.strip():
            lines.append(f"{field}: {value.strip()}\n")

    return "\n".join(lines).rstrip() + "\n"

def main():
    parser = argparse.ArgumentParser(description="Split CSV of medicines into separate .txt files.")
    parser.add_argument('--input', '-i', required=True, help="CSV file path")
    parser.add_argument('--outdir', '-o', required=True, help="Folder to save .txt files")
    parser.add_argument('--encoding', default='utf-8', help="CSV file encoding (default utf-8)")
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    try:
        with open(args.input, newline='', encoding=args.encoding) as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                print("CSV has no header.", file=sys.stderr)
                sys.exit(1)

            name_col = choose_name_column(reader.fieldnames)
            print(f"Using '{name_col}' as medicine name column.")

            filename_counts = {}
            for idx, row in enumerate(reader, start=1):
                raw_name = row.get(name_col, '') or f"medicine_{idx}"
                base_name = safe_filename(raw_name)

                # Ensure unique filenames
                count = filename_counts.get(base_name, 0)
                if count:
                    filename_counts[base_name] += 1
                    filename = f"{base_name}_{count+1}.txt"
                else:
                    filename_counts[base_name] = 1
                    filename = f"{base_name}.txt"

                out_path = os.path.join(args.outdir, filename)
                content = format_row_text(row, name_col)

                with open(out_path, 'w', encoding='utf-8') as out_file:
                    out_file.write(content)

                if idx % 100 == 0:
                    print(f"{idx} rows processed...")

        print(f"Done! Created {idx} text files in '{args.outdir}'.")

    except FileNotFoundError:
        print(f"Input file not found: {args.input}", file=sys.stderr)
        sys.exit(2)
    except UnicodeDecodeError as e:
        print(f"Encoding error. Try using --encoding latin-1", file=sys.stderr)
        sys.exit(3)

if __name__ == "__main__":
    main()
