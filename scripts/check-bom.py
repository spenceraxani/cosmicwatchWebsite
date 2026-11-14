#!/usr/bin/env python3
"""Compare the website's parts list (src/data_files/bom.json) with the official
purchasing list in the v3X GitHub repository (Purchasing_List_v3X_sa.xlsx).

    python3 scripts/check-bom.py              # downloads the xlsx from GitHub
    python3 scripts/check-bom.py path/to.xlsx # or checks a local copy

Checks every row by name: quantity, reference designators, optional or not,
and the Digi-Key part number. Needs only the Python standard library.

Known, intended differences: where the official sheet gives a tape-and-reel
(…TR-ND), Digi-Reel (…DKR) or manufacturer number, bom.json keeps that number
in "part" but uses Digi-Key's cut-tape number (…CT-ND) in digikey.partNumber,
because cut tape is what Digi-Key sells in small quantities. Those are listed
as "packaging" notes, not errors.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bom_xlsx import key, load, parts, read_rows  # noqa: E402

BOM = Path(__file__).resolve().parent.parent / 'src/data_files/bom.json'


def main() -> int:
    official = parts(read_rows(load(sys.argv[1] if len(sys.argv) > 1 else None)))
    for o in official:
        o['digikey'] = o['digikeyNumber'] or (
            '(Digi-Key link)' if 'digikey.com' in f"{o['k']} {o['l']}" else None)
    site = json.loads(BOM.read_text())
    print(f'Official list: {len(official)} rows. Website: {len(site)} rows.\n')

    errors, notes, used = 0, 0, set()
    for o in official:
        match = next((i for i, p in enumerate(site)
                      if i not in used and key(p['name']) == key(o['name'])), None)
        if match is None:
            print(f'MISSING on the website: {o["name"]} (qty {o["qty"]})')
            errors += 1
            continue
        used.add(match)
        p = site[match]
        problems = []
        if str(p['qty']).strip() != o['qty']:
            problems.append(f'quantity {p["qty"]} on the website, {o["qty"]} official')
        if (p.get('refs') or '').replace(' ', '') != o['refs'].replace(' ', ''):
            problems.append(f'references {p.get("refs")!r} on the website, {o["refs"]!r} official')
        if p['optional'] != o['optional']:
            problems.append('optional/required differs')
        site_dk = (p.get('digikey') or {}).get('partNumber')
        if o['digikey'] and not o['digikey'].startswith('(') and site_dk != o['digikey']:
            if p.get('part') == o['digikey'] and site_dk and site_dk.endswith('CT-ND'):
                print(f'packaging: {o["name"]}: official {o["digikey"]}, website orders {site_dk} (cut tape)')
                notes += 1
            else:
                problems.append(f'Digi-Key {site_dk} on the website, {o["digikey"]} official')
        if o['digikey'] and not site_dk:
            problems.append('official list has a Digi-Key part, the website does not')
        if problems:
            print(f'DIFFERENT: {o["name"]}: ' + '; '.join(problems))
            errors += 1
        refs = [x for x in o['refs'].split(',') if re.match(r'^[A-Z]+\d', x.strip())]
        if refs and str(len(refs)) != o['qty']:
            print(f'note: {o["name"]} has quantity {o["qty"]} but {len(refs)} references '
                  f'({o["refs"]}) in the official list itself')
            notes += 1
    for i, p in enumerate(site):
        if i not in used:
            print(f'EXTRA on the website: {p["name"]}')
            errors += 1
    print(f'\n{errors} difference(s), {notes} note(s).')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
