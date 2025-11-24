
#!/usr/bin/env python3
"""
generate_drug_summaries.py

Usage:
    python generate_drug_summaries.py --input drugsComTrain_final.csv --outdir ./drug_summaries --batch-size 20

What it does:
- Reads the input CSV (expects a column "drugName").
- For each unique drug, queries public drug information APIs (OpenFDA / RxNorm / DailyMed) to gather:
    - short introduction (indication/class)
    - dosage guidelines (age groups; where available)
    - basic "how to use" guidance
- Writes per-drug Markdown files and a combined Excel/CSV with columns: drugName, introduction, dosage_text, how_to_use, sources
- Caches API responses locally (./cache) to allow safe re-runs and to avoid rate limits.

Important notes:
- This script requires internet access.
- The script is NOT a substitute for clinical review. Always verify dosage/age-specific guidance with authoritative sources and a clinician.
- You need to install required packages: requests, pandas, openpyxl, tqdm
    pip install requests pandas openpyxl tqdm
"""

import os
import sys
import time
import argparse
import json
import hashlib
from pathlib import Path

import pandas as pd
import requests
from tqdm import tqdm

CACHE_DIR = Path("./cache")
OUTPUT_DIR = Path("./drug_summaries")

# Simple cache helpers
def cache_get(key):
    p = CACHE_DIR / (hashlib.sha256(key.encode()).hexdigest() + ".json")
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return None

def cache_set(key, value):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    p = CACHE_DIR / (hashlib.sha256(key.encode()).hexdigest() + ".json")
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")

# Query OpenFDA drug label (useful for dosing and usage)
def query_openfda_label(drug):
    base = "https://api.fda.gov/drug/label.json"
    params = {"search": f"openfda.brand_name:\"{drug}\"+openfda.substance_name:\"{drug}\"", "limit": 1}
    key = f"openfda:{drug}"
    cached = cache_get(key)
    if cached is not None:
        return cached
    try:
        r = requests.get(base, params=params, timeout=10)
        if r.status_code == 200:
            data = r.json()
            cache_set(key, data)
            return data
    except Exception as e:
        # fallback will be None
        pass
    cache_set(key, {"error": "no-data"})
    return None

# Query RxNav / RxNorm approximate class info via RxNorm REST (example: rxcui lookup)
def query_rxnorm(drug):
    base = "https://rxnav.nlm.nih.gov/REST/rxcui.json"
    params = {"name": drug}
    key = f"rxnorm:{drug}"
    cached = cache_get(key)
    if cached is not None:
        return cached
    try:
        r = requests.get(base, params=params, timeout=10)
        if r.status_code == 200:
            data = r.json()
            cache_set(key, data)
            return data
    except Exception:
        pass
    cache_set(key, {"error": "no-data"})
    return None

# Heuristic extraction of short introduction and dosing from OpenFDA label JSON
def extract_from_openfda_label(label_json):
    if not label_json or "error" in label_json:
        return None
    try:
        result = label_json.get("results", [])[0]
    except Exception:
        return None

    intro = []
    dosing = []
    how_to = []
    sources = []

    # Try sections commonly found in drug label
    for sec in ["indications_and_usage", "indications_and_usage_section", "indications_and_usage_text"]:
        if sec in result:
            intro.append(" ".join(result[sec][:3]))

    # Use "dosage_and_administration" if present
    if "dosage_and_administration" in result:
        dosing.extend(result["dosage_and_administration"][:10])

    # "dosage_and_administration" may be in "sections" mapping
    if "spl" in result:
        # sometimes label sections are under 'spl' - skip complex parsing for now
        pass

    # How to use (administration, warnings)
    for sec in ["administration", "how_supplied", "warnings"]:
        if sec in result:
            how_to.append(" ".join(result[sec][:5]))

    # collect source link
    if "set_id" in result:
        sources.append(f"OpenFDA label set_id: {result['set_id']}")

    # fallback: combine text
    intro_text = (" ".join(intro)).strip() if intro else ""
    dosing_text = (" ".join(dosing)).strip() if dosing else ""
    howto_text = (" ".join(how_to)).strip() if how_to else ""

    return {
        "introduction": intro_text,
        "dosage_text": dosing_text,
        "how_to_use": howto_text,
        "sources": sources
    }

# Main driver
def generate_summaries(input_csv, outdir="./drug_summaries", batch_size=50, sleep_between=0.2, max_drugs=None, skip_empty_intro=False):
    OUTPUT_DIR = Path(outdir)        # Use the passed argument
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(input_csv)

    if "drugName" not in df.columns:
        print("Input CSV must contain 'drugName' column")
        return

    drugs = df["drugName"].dropna().unique().tolist()
    if max_drugs:
        drugs = drugs[:max_drugs]

    summary_rows = []

    for drug in tqdm(drugs, desc="Drugs"):
        comb_key = f"combined:{drug}"
        cached = cache_get(comb_key)
        if cached:
            if skip_empty_intro and not cached.get("introduction", "").strip():
                # already known to be empty -> skip
                continue
            summary_rows.append(cached)
            continue

        rx = query_rxnorm(drug)
        label = query_openfda_label(drug)
        extracted = extract_from_openfda_label(label)
        if not extracted:
            intro = rx["idGroup"]["name"] if rx and "idGroup" in rx and "name" in rx["idGroup"] else ""
            extracted = {
                "introduction": intro,
                "dosage_text": "",
                "how_to_use": "",
                "sources": ["RxNorm lookup"] if intro else []
            }

        record = {
            "drugName": drug,
            "introduction": extracted.get("introduction", ""),
            "dosage_text": extracted.get("dosage_text", ""),
            "how_to_use": extracted.get("how_to_use", ""),
            "sources": "; ".join(extracted.get("sources", []))
        }

        if skip_empty_intro and not record['introduction']:
            print(f"[SKIP] {drug}: no introduction — not writing markdown.")
            cache_set(comb_key, record)  # cache result so we don't re-query next run
            time.sleep(sleep_between)
            continue

        # --- Corrected Markdown writing ---
        safe_filename = f"{drug.replace('/', '_').replace(' ', '_')}.md"
        md_file = OUTPUT_DIR / safe_filename
        md_content = (
            f"### Medicine: {drug}\n\n"
            f"**Introduction:**\n{record['introduction']}\n\n"
            f"**Dosage Guidelines:**\n{record['dosage_text']}\n\n"
            f"**How to Use:**\n{record['how_to_use']}\n\n"
            f"**Sources:**\n{record['sources']}\n"
        )
        md_file.write_text(md_content, encoding="utf-8")

        summary_rows.append(record)
        cache_set(comb_key, record)
        time.sleep(sleep_between)

    # Save combined CSV and Excel
    out_csv = OUTPUT_DIR / "drug_summaries.csv"
    out_xlsx = OUTPUT_DIR / "drug_summaries.xlsx"
    pd.DataFrame(summary_rows).to_csv(out_csv, index=False)
    pd.DataFrame(summary_rows).to_excel(out_xlsx, index=False)

    print(f"Saved {len(summary_rows)} summaries to {OUTPUT_DIR.resolve()}")
    return OUTPUT_DIR.resolve()



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate drug summaries using public APIs (OpenFDA/RxNorm)')
    parser.add_argument('--input', required=True, help='Path to input CSV (with drugName column)')
    parser.add_argument('--outdir', default='./drug_summaries', help='Output directory')
    parser.add_argument('--batch-size', type=int, default=50, help='Batch size for processing (not used heavily)')
    parser.add_argument('--sleep', type=float, default=0.2, help='Sleep seconds between API calls')
    parser.add_argument('--max-drugs', type=int, default=None, help='Limit number of drugs processed (for testing)')
    parser.add_argument(
        '--skip-empty-intro',
        action='store_true',
        help='If set, skip writing markdown files (and exclude from CSV) when introduction is empty.'
    )
    args = parser.parse_args()

    generate_summaries(args.input, args.outdir, batch_size=args.batch_size, sleep_between=args.sleep, max_drugs=args.max_drugs, skip_empty_intro=args.skip_empty_intro)
