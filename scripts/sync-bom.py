#!/usr/bin/env python3
"""Rebuild src/data_files/bom.json (the Parts List page and the Digi-Key Bulk
Add lists) from Purchasing_List_v3X_sa.xlsx in the v3X GitHub repository.

    python3 scripts/sync-bom.py                 # reads the xlsx from GitHub
    python3 scripts/sync-bom.py <clone or xlsx> # or from a local copy

Names, quantities, reference designators, prices, descriptions and links all
come from the xlsx, so the website follows it. A few things the xlsx does not
have live in src/data_files/bom-extras.json, keyed by part name:

  - the Digi-Key product page and the cut-tape order number (…CT-ND), where the
    xlsx gives a tape-and-reel, Digi-Reel or manufacturer number that Digi-Key
    will not sell one at a time;
  - a Digi-Key search for parts bought elsewhere.

Each extra records the xlsx part number (or link) it was written for
("forPart"). If the xlsx changes that part, the extra is ignored and the
website uses the xlsx's own Digi-Key number, so a replaced part is never
ordered under its old number. The script prints those cases.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import quote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bom_xlsx import key, load, parts, read_rows  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
BOM = ROOT / 'src/data_files/bom.json'
EXTRAS = ROOT / 'src/data_files/bom-extras.json'

STORES = [
    ('digikey.com', 'Digi-Key'),
    ('amazon.', 'Amazon'),
    ('aliexpress.', 'AliExpress'),
    ('mcmaster.com', 'McMaster-Carr'),
    ('ebay.com', 'eBay'),
    ('elecrow.com', 'Elecrow'),
    ('enclosuresandcasesinc.com', 'Enclosures & Cases Inc.'),
]


MAIN_STORES = {'Amazon', 'AliExpress', 'McMaster-Carr', 'eBay', 'Elecrow'}


def store(url: str) -> str | None:
    host = urlsplit(url).netloc.lower()
    return next((label for domain, label in STORES if domain in host), None)


def clean(url: str) -> str:
    """Short, stable store links without tracking parameters."""
    url = url.strip().replace('http://', 'https://', 1)
    if m := re.search(r'amazon\.[a-z.]+/(?:.*/)?dp/([A-Z0-9]{10})', url):
        return f'https://www.amazon.com/dp/{m.group(1)}'
    if 'ebay.com/itm/' in url and (m := re.search(r'/(\d{9,})', urlsplit(url).path)):
        return f'https://www.ebay.com/itm/{m.group(1)}'
    s = urlsplit(url)
    return f'{s.scheme}://{s.netloc}{s.path}'


def search(term: str) -> str:
    return f'https://www.digikey.com/en/products/result?keywords={quote(term)}'


def build(rows: list[dict], extras: dict) -> tuple[list[dict], list[str]]:
    out, notes = [], []
    for i, r in enumerate(rows, 1):
        k = r['k'] if r['k'].startswith('http') else ''
        link_urls = [u for u in (r['k'], r['l']) if u.startswith('http')]
        on_digikey = bool(r['digikeyNumber']) or any(store(u) == 'Digi-Key' for u in link_urls)
        supplier = 'Digi-Key' if on_digikey else store(k) if k and store(k) in MAIN_STORES else 'Other'
        links = []
        for u in link_urls:
            label = store(u)
            if label and label != 'Digi-Key' and clean(u) not in [x['url'] for x in links]:
                links.append({'label': label, 'url': clean(u)})
        if not links and k and not store(k):
            links.append({'label': urlsplit(k).netloc.removeprefix('www.'), 'url': clean(k)})

        part = r['digikeyNumber'] or ''
        x = extras.get(key(r['name']))
        if x and x.get('forPart') not in (part or k):
            notes.append(f'{r["name"]}: the xlsx changed this part '
                         f'({x.get("forPart")} -> {part or k or "none"}); using the xlsx.')
            x = None
        digikey = None
        if x and x.get('digikey'):
            digikey = x['digikey']
        elif part:
            digikey = {'url': search(part), 'partNumber': part}
        elif on_digikey:
            notes.append(f'{r["name"]}: Digi-Key link without an order number; '
                         'add it to bom-extras.json to include it in Bulk Add.')

        out.append({
            'item': i,
            'name': re.sub(r'\s*\(optional\)\s*', ' ', r['name'], flags=re.I).strip(),
            'qty': r['qty'],
            'refs': r['refs'],
            'unit': r['unit'],
            'unit10': r['unit10'],
            'total': r['total'],
            'desc': r['desc'],
            'supplier': supplier,
            'url': k,
            'part': part,
            'optional': r['optional'],
            'digikey': digikey,
            'links': links,
            'digikeySearch': (x or {}).get('digikeySearch'),
        })
    return out, notes


def main() -> int:
    rows = parts(read_rows(load(sys.argv[1] if len(sys.argv) > 1 else None)))
    extras = json.loads(EXTRAS.read_text()) if EXTRAS.exists() else {}
    bom, notes = build(rows, extras)
    BOM.write_text(json.dumps(bom, indent=2, ensure_ascii=False) + '\n')
    print(f'bom.json: {len(bom)} parts, '
          f'{sum(1 for p in bom if p["digikey"] and not p["optional"])} Digi-Key lines')
    for n in notes:
        print('note:', n)
    return 0


if __name__ == '__main__':
    sys.exit(main())
