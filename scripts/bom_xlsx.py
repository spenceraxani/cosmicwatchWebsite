"""Read Purchasing_List_v3X_sa.xlsx from the v3X repository with the Python
standard library only. Shared by scripts/sync-bom.py and scripts/check-bom.py."""
from __future__ import annotations

import io
import re
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

XLSX_NAME = 'Purchasing_List_v3X_sa.xlsx'
XLSX_URL = (
    'https://github.com/spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X'
    f'/raw/main/{XLSX_NAME}'
)
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
T = '{%s}t' % NS['m']


def load(src: str | None) -> bytes:
    """Bytes of the xlsx: a local path, a folder holding it, or GitHub."""
    if src:
        p = Path(src)
        if p.is_dir():
            p = p / XLSX_NAME
        if p.exists():
            return p.read_bytes()
    return urllib.request.urlopen(src if src and src.startswith('http') else XLSX_URL).read()


def read_rows(data: bytes) -> list[dict]:
    """Rows of the first sheet as {column letter: text}."""
    z = zipfile.ZipFile(io.BytesIO(data))
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
            shared.append(''.join(t.text or '' for t in si.iter(T)))
    sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = []
    for r in sheet.iter('{%s}row' % NS['m']):
        row = {}
        for c in r.findall('m:c', NS):
            col = re.match(r'[A-Z]+', c.get('r')).group()
            v = c.find('m:v', NS)
            if v is not None:
                row[col] = shared[int(v.text)] if c.get('t') == 's' else v.text
            elif (inline := c.find('m:is', NS)) is not None:
                row[col] = ''.join(t.text or '' for t in inline.iter(T))
        rows.append(row)
    return rows


def num(v) -> float | None:
    try:
        return round(float(v), 2)
    except (TypeError, ValueError):
        return None


def parts(rows: list[dict]) -> list[dict]:
    """One dict per part row, in sheet order, from both tables (detector and
    the optional enclosure list)."""
    out, section = [], None
    for r in rows:
        b, name = r.get('B') or '', (r.get('C') or '').strip()
        if 'Purchasing List' in b:
            section = 'enclosure' if 'Enclosure' in b else 'detector'
            continue
        if not section or not name or name == 'Name' or name.startswith('Total'):
            continue
        k, l = (r.get('K') or '').strip(), (r.get('L') or '').strip()
        m = re.search(r'Part Number:\s*(\S+)', f'{k} {l}', re.I)
        out.append({
            'name': name,
            'qty': str(r.get('D') or '').strip(),
            'refs': (r.get('E') or '').strip(),
            'unit': num(r.get('F')),
            'unit10': num(r.get('G')),
            'total': num(r.get('H')),
            'desc': re.sub(r'\s+', ' ', (r.get('J') or '').replace('\xa0', ' ')).strip(),
            'k': k,
            'l': l,
            'digikeyNumber': m.group(1).strip() if m else None,
            'optional': section == 'enclosure' or 'optional' in name.lower(),
        })
    return out


def key(name: str) -> str:
    """Names match without '(optional)', case or extra spaces."""
    return re.sub(r'\s+', ' ', re.sub(r'\(optional\)', '', name, flags=re.I)).strip().lower()
