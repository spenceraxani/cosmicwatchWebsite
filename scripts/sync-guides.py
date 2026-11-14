#!/usr/bin/env python3
"""
Turn the CosmicWatch v3X PDF guides into Starlight pages, one page per chapter.

Usage:
  python3 scripts/sync-guides.py --repo <path to a clone of the v3X GitHub repo>

What it writes (all generated, safe to delete and regenerate):
  src/content/docs/docs/guides/<guide>/<chapter>.md   one page per PDF chapter
  public/guides/<guide>/*.webp                         figures, tables-as-images, equations
  src/data_files/guides.json                           manifest: blob SHA, commit, pages, chapters

The manifest records the git blob SHA of each PDF. The guide pages compare it with
the live GitHub API in the browser, and the GitHub Action re-runs this script when
the SHA changes, so the HTML follows the PDFs.

Needs: pymupdf (pip install pymupdf), pillow.
"""

from __future__ import annotations

import argparse
import io
import json
import re
import shutil
import subprocess
import unicodedata
from pathlib import Path

import pymupdf
from PIL import Image

GITHUB_REPO = 'spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X'
BRANCH = 'main'

GUIDES = [
    {
        'slug': 'instruction-manual',
        'file': 'The Instruction Manual.pdf',
        'title': 'Instruction Manual',
        'blurb': 'How the v3X works, how to build one, and how the electronics and firmware are designed.',
    },
    {
        'slug': 'example-measurements',
        'file': 'The Example Measurements.pdf',
        'title': 'Example Measurements',
        'blurb': 'Measurements made with CosmicWatch detectors, plus ideas that have not been tried yet.',
    },
    {
        'slug': 'physics',
        'file': 'The Physics Document.pdf',
        'title': 'Physics Document',
        'blurb': 'Cosmic rays, radioactive backgrounds, how particles lose energy, and how the detector sees them.',
    },
    {
        'slug': 'troubleshooting',
        'file': 'The Troubleshooting Document.pdf',
        'title': 'Troubleshooting Document',
        'blurb': 'Common problems when building and running a detector, and how to fix them.',
    },
]

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / 'src/content/docs/docs/guides'
IMG_DIR = ROOT / 'public/guides'
MANIFEST = ROOT / 'src/data_files/guides.json'

ZOOM = 3.0  # render scale for figures (3x = ~1830 px wide for a full-width figure, sharp on high-DPI screens)
ZOOM_NARROW = 4.0  # figures that sit beside text in the PDF are small, so render them larger
TEXT_X0, TEXT_X1 = 60, 552  # LaTeX text block on US letter, with a little slack
MATH_FONTS = ('CMMI', 'CMSY', 'CMEX', 'CMR', 'MSBM', 'MSAM')
BODY_MIN_SIZE = 11.0


# ---------------------------------------------------------------- helpers


def ruled_table(drawings, cap, gap: float = 320, reach: float = 60):
    """The box spanned by a LaTeX (booktabs) table's horizontal rules next to
    its caption, or None. Looks just above the caption first (these manuals put
    captions under tables), then just below. Rules belong to the same table
    while the gap to the next one is under `gap` points."""
    rules = sorted(
        (r for r in drawings if r.height < 2 and r.width > 60), key=lambda r: r.y0
    )
    above = [r for r in rules if r.y1 <= cap.y0 + 2 and cap.y0 - r.y1 < reach]
    below = [r for r in rules if r.y0 >= cap.y1 - 2 and r.y0 - cap.y1 < reach]
    if above:
        group = [above[-1]]
        for r in reversed([r for r in rules if r.y1 < group[0].y0]):
            if group[-1].y0 - r.y1 > gap:
                break
            group.append(r)
    elif below:
        group = [below[0]]
        for r in [r for r in rules if r.y0 > group[0].y1]:
            if r.y0 - group[-1].y1 > gap:
                break
            group.append(r)
    else:
        return None
    if len(group) < 2:
        return None
    # Rules are zero-height lines, which Rect union ignores, so take the extremes.
    return pymupdf.Rect(
        min(r.x0 for r in group),
        min(r.y0 for r in group),
        max(r.x1 for r in group),
        max(r.y1 for r in group),
    )


def slugify(text: str) -> str:
    """Close to github-slugger, which Starlight uses for heading ids."""
    text = unicodedata.normalize('NFKC', text).strip().lower()
    text = re.sub(r'[^\w\- ]', '', text, flags=re.UNICODE)
    return text.replace(' ', '-')


def norm(text: str) -> str:
    return re.sub(r'[^a-z0-9]', '', text.lower())


def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()


def md_escape(text: str) -> str:
    text = text.replace('\\', '\\\\')
    text = re.sub(r'([*_`\[\]<>])', r'\\\1', text)
    return text


def yaml_str(text: str) -> str:
    return json.dumps(text, ensure_ascii=False)


def is_bold(font: str) -> bool:
    return 'BX' in font or 'Bold' in font or 'XC' in font


def is_italic(font: str) -> bool:
    return 'TI' in font or 'Italic' in font or 'SL' in font


def is_mono(font: str) -> bool:
    return 'Mon' in font or 'TT' in font or 'Courier' in font


def is_math(font: str) -> bool:
    return font.startswith(MATH_FONTS)


def block_text(block: dict) -> str:
    return ' '.join(''.join(s['text'] for s in l['spans']) for l in block['lines']).strip()


def first_span(block: dict) -> dict:
    for l in block['lines']:
        for s in l['spans']:
            if s['text'].strip():
                return s
    return block['lines'][0]['spans'][0]


def span_markdown(spans: list[dict]) -> str:
    """Join spans of one line, wrapping runs of bold / italic / mono / super- and subscript text."""
    live = [s for s in spans if s['text']]
    if not live:
        return ''
    main = max(live, key=lambda s: len(s['text']))
    main_size, base = main['size'], main['origin'][1]
    out = []
    prev_font = ''
    for s in live:
        t, f = s['text'], s['font']
        small = s['size'] < main_size * 0.85
        if small and (s['flags'] & 1 or s['origin'][1] < base - 1):
            style = 'sup'
        elif small and s['origin'][1] > base + 1:
            style = 'sub'
        else:
            style = 'mono' if is_mono(f) else 'bold' if is_bold(f) else 'italic' if is_italic(f) else ''
            # LaTeX math italics are followed by text without a space ("θwas")
            if prev_font and is_math(prev_font) and not is_math(f) and out and not out[-1][1].endswith((' ', '(', '[')) \
                    and re.match(r'[A-Za-z]', t) and not t.startswith(' '):
                t = ' ' + t
        prev_font = f
        out.append((style, t))
    merged: list[list[str]] = []
    for style, t in out:
        if merged and merged[-1][0] == style:
            merged[-1][1] += t
        else:
            merged.append([style, t])
    parts = []
    for style, t in merged:
        lead = t[: len(t) - len(t.lstrip())]
        trail = t[len(t.rstrip()):]
        core = t.strip()
        if not core:
            parts.append(t)
            continue
        if style == 'mono':
            parts.append(f'{lead}`{core}`{trail}')
        elif style in ('sup', 'sub'):
            parts.append(f'{lead}<{style}>{md_escape(core)}</{style}>{trail}')
        elif style == 'bold' and not re.fullmatch(r'\?+', core):
            parts.append(f'{lead}**{md_escape(core)}**{trail}')
        elif style == 'italic':
            parts.append(f'{lead}*{md_escape(core)}*{trail}')
        else:
            parts.append(md_escape(t))
    return ''.join(parts)


def paragraph_markdown(block: dict) -> str:
    lines = [span_markdown(l['spans']).strip() for l in block['lines']]
    lines = [l for l in lines if l]
    text = ''
    for line in lines:
        if not text:
            text = line
        elif re.search(r'[A-Za-z]-$', text) and re.match(r'[a-z]', line):
            text = text[:-1] + line  # undo LaTeX hyphenation
        else:
            text += ' ' + line
    text = text.replace('** **', ' ').replace('****', '')
    text = re.sub(r'(https?://\S+?)([.,;:)]?)(?=\s|$)', r'<\1>\2', text.replace('\\_', '_'))
    return text


def save_clip(page: pymupdf.Page, rect: pymupdf.Rect, path: Path, zoom: float = ZOOM) -> tuple[int, int]:
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect, alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes('png')))
    img.save(path, 'WEBP', quality=82, method=6)
    return img.size


# ---------------------------------------------------------------- page parsing


class Guide:
    def __init__(self, cfg: dict, repo: Path):
        self.cfg = cfg
        self.repo = repo
        self.pdf_path = repo / cfg['file']
        self.doc = pymupdf.open(self.pdf_path)
        self.toc = [(lvl, title.strip(), page) for lvl, title, page in self.doc.get_toc()]
        self.toc_norm = {norm(t): (lvl, t) for lvl, t, _ in self.toc}
        self.img_dir = IMG_DIR / cfg['slug']
        counts: dict[str, int] = {}
        for pg in self.doc:
            for b in pg.get_text('dict')['blocks']:
                for l in b.get('lines', []):
                    for sp in l['spans']:
                        counts[sp['font'][:2]] = counts.get(sp['font'][:2], 0) + len(sp['text'])
        self.body_family = max(counts, key=counts.get) if counts else 'SF'
        self.items: list[dict] = []  # flat stream of heading / p / li / figure / table / equation
        self.fig_count = 0

    # --- classify one page into items in reading order
    def parse_page(self, pno: int):
        page = self.doc[pno]
        data = page.get_text('dict')
        height = page.rect.height

        text_blocks = []
        image_rects = []
        for b in data['blocks']:
            r = pymupdf.Rect(b['bbox'])
            if b['type'] == 1:
                if r.width > 20 and r.height > 20:
                    image_rects.append(r)
                continue
            if b['type'] != 0:
                continue
            t = block_text(b)
            if not t:
                continue
            if re.fullmatch(r'\d{1,3}', t) and r.y0 > height - 70:
                continue  # page number
            text_blocks.append({'b': b, 'r': r, 't': t})

        drawings = [pymupdf.Rect(d['rect']) for d in page.get_drawings()]
        graphics = image_rects + [d for d in drawings if d.width > 4 or d.height > 4]
        tables = []
        try:
            tables = [pymupdf.Rect(t.bbox) for t in page.find_tables().tables]
        except Exception:
            pass

        for tb in text_blocks:
            s = first_span(tb['b'])
            t = tb['t']
            spans = [sp for l in tb['b']['lines'] for sp in l['spans'] if sp['text'].strip()]
            total = sum(len(sp['text'].strip()) for sp in spans)
            math_chars = sum(len(sp['text'].strip()) for sp in spans if is_math(sp['font']))
            tb['math'] = math_chars / max(1, total)
            if re.match(r'(Figure|Fig\.)\s*[A-Z]?\d+(\.\d+)*\s*:', t):
                tb['kind'] = 'figcaption'
            elif re.match(r'Table\s*[A-Z]?\d+(\.\d+)*\s*:', t):
                tb['kind'] = 'tabcaption'
            elif s['size'] >= 14 and is_bold(s['font']):
                tb['kind'] = 'heading'
            elif tb['math'] > 0.45 and len(t) < 300:
                tb['kind'] = 'equation'
            elif re.fullmatch(r'[)\],.\s|]*\([A-Z]?\.?\d+(\.\d+)*\)', t) or re.fullmatch(r'[)\],.\s]+', t):
                tb['kind'] = 'equation'  # equation number or a stray closing bracket
            elif re.match(r'^[•–·∙◦]\s', t):
                tb['kind'] = 'li'
            else:
                tb['kind'] = 'p'
            tb['numbered_eq'] = tb['kind'] == 'equation' and bool(re.search(r'\([A-Z]?\.?\d+(\.\d+)*\)\s*$', t))
            # body text: the document's own font at body size (plot labels use other fonts or small sizes)
            fam_ok = s['font'].startswith(self.body_family) or is_mono(s['font'])
            tb['body'] = (tb['kind'] in ('p', 'li', 'heading', 'figcaption', 'tabcaption') and fam_ok
                          and s['size'] >= BODY_MIN_SIZE) or tb['numbered_eq']

        consumed: set[int] = set()
        out: list[tuple[float, dict]] = []

        def overlaps_x(r, x0, x1, slack=4):
            return min(r.x1, x1) - max(r.x0, x0) > slack

        def area_in(r, region):
            return (pymupdf.Rect(r) & region).get_area() / max(1.0, r.get_area())

        # figures: walk up from the caption, collecting graphics and plot labels in the
        # caption's column until the first block of body text
        for i, tb in enumerate(text_blocks):
            if tb['kind'] != 'figcaption':
                continue
            cap = tb['r']
            wrap = cap.x0 > 150 or cap.x1 < 460  # wrapfigure: the caption sits in one column
            x0, x1 = (cap.x0 - 8, cap.x1 + 10) if wrap else (0, 612)
            stops = [o['r'].y1 for j, o in enumerate(text_blocks)
                     if j != i and o['body'] and o['r'].y1 <= cap.y0 + 1 and overlaps_x(o['r'], x0, x1, 14)]
            top = max(stops) + 1 if stops else 40
            parts = [r for r in graphics if r.y0 >= top - 2 and r.y1 <= cap.y0 + 2 and overlaps_x(r, x0, x1)]
            labels = [j for j, o in enumerate(text_blocks)
                      if j != i and not o['body'] and o['r'].y0 >= top - 2 and o['r'].y1 <= cap.y0 + 2
                      and overlaps_x(o['r'], x0, x1) and (not wrap or o['r'].x0 >= x0 - 20)]
            parts += [text_blocks[j]['r'] for j in labels]
            if parts:
                region = pymupdf.Rect(parts[0])
                for r in parts[1:]:
                    region |= r
                region = region + (-4, -4, 4, 4)
                region.y0 = max(region.y0, top)
                region.y1 = min(region.y1, cap.y0)
            else:
                region = pymupdf.Rect(max(TEXT_X0, x0), top, min(TEXT_X1, x1), cap.y0 - 2)
            for j, o in enumerate(text_blocks):
                if j != i and not o['body'] and area_in(o['r'], region) > 0.4:
                    consumed.add(j)
            consumed.update(labels)
            consumed.add(i)
            if region.height < 12 or region.width < 12:
                continue
            self.fig_count += 1
            name = f'fig-{self.fig_count:02d}-p{pno + 1}.webp'
            w, h = save_clip(page, region, self.img_dir / name, zoom=ZOOM_NARROW if wrap else ZOOM)
            out.append((region.y0, {
                'type': 'figure', 'src': name, 'w': w, 'h': h, 'wrap': wrap, 'rect': region,
                'caption': paragraph_markdown(tb['b']), 'alt': tb['t'][:200], 'page': pno + 1,
            }))

        # tables: render the ruled region next to a "Table" caption, keep the cell text as alt
        for i, tb in enumerate(text_blocks):
            if tb['kind'] != 'tabcaption':
                continue
            cap = tb['r']
            near = [t for t in tables if abs(t.y1 - cap.y0) < 60 or abs(t.y0 - cap.y1) < 60]
            ruled = ruled_table(drawings, cap)
            if near:
                region = pymupdf.Rect(near[0])
                for r in drawings:
                    if r.height < 2 and r.y0 >= region.y0 - 6 and r.y1 <= region.y1 + 6:
                        region |= r
            elif ruled is not None:
                # find_tables() missed it (its results change between PyMuPDF
                # versions), but the table's horizontal rules are there.
                region = ruled
            else:
                below = [o['r'].y0 for o in text_blocks if o['r'].y0 > cap.y1 + 4 and o['body'] and len(o['b']['lines']) >= 2]
                region = pymupdf.Rect(TEXT_X0, cap.y1 + 2, TEXT_X1, (min(below) - 2) if below else cap.y1 + 200)
            region = region + (-6, -4, 6, 4)
            cells = []
            for j, o in enumerate(text_blocks):
                if j != i and area_in(o['r'], region) > 0.5:
                    consumed.add(j)
                    cells.append(o['t'])
            consumed.add(i)
            self.fig_count += 1
            name = f'table-{self.fig_count:02d}-p{pno + 1}.webp'
            w, h = save_clip(page, region, self.img_dir / name)
            out.append((min(region.y0, cap.y0), {
                'type': 'figure', 'src': name, 'w': w, 'h': h, 'table': True, 'rect': region,
                'caption': paragraph_markdown(tb['b']), 'alt': (tb['t'] + ' ' + ' '.join(cells))[:400], 'page': pno + 1,
            }))

        # display equations: LaTeX splits one equation over several blocks, so cluster them
        clusters: list[list[int]] = []
        for j, o in enumerate(text_blocks):
            if j in consumed or o['kind'] != 'equation':
                continue
            r = o['r']
            for c in clusters:
                if any(min(r.y1, text_blocks[k]['r'].y1) - max(r.y0, text_blocks[k]['r'].y0) > -8 for k in c):
                    c.append(j)
                    break
            else:
                clusters.append([j])
        for c in clusters:
            region = pymupdf.Rect(text_blocks[c[0]]['r'])
            for k in c[1:]:
                region |= text_blocks[k]['r']
            region = region + (-4, -5, 4, 8)
            consumed.update(c)
            self.fig_count += 1
            name = f'eq-{self.fig_count:02d}-p{pno + 1}.webp'
            w, h = save_clip(page, region, self.img_dir / name, zoom=2.5)
            order = sorted(c, key=lambda k: (round(text_blocks[k]['r'].y0 / 4), text_blocks[k]['r'].x0))
            alt = ' '.join(text_blocks[k]['t'] for k in order)
            out.append((region.y0, {'type': 'equation', 'src': name, 'w': w, 'h': h, 'alt': alt, 'page': pno + 1}))

        # raster images that no caption claimed
        claimed = [it['rect'] for _, it in out if 'rect' in it]
        for r in image_rects:
            if any(area_in(r, c) > 0.3 for c in claimed) or r.width < 60 or r.height < 40:
                continue
            self.fig_count += 1
            name = f'img-{self.fig_count:02d}-p{pno + 1}.webp'
            w, h = save_clip(page, r, self.img_dir / name)
            out.append((r.y0, {'type': 'figure', 'src': name, 'w': w, 'h': h, 'caption': '',
                               'alt': 'Image from the PDF', 'page': pno + 1}))

        for i, tb in enumerate(text_blocks):
            if i in consumed:
                continue
            kind = tb['kind']
            if kind == 'heading':
                out.append((tb['r'].y0, {'type': 'heading', 'text': tb['t'], 'page': pno + 1}))
            elif kind == 'li':
                for text in re.split(r'\s(?=[•–·∙◦]\s)', paragraph_markdown(tb['b'])):
                    text = re.sub(r'^[•–·∙◦]\s*', '', text.strip())
                    if text:
                        out.append((tb['r'].y0, {'type': 'li', 'text': text, 'page': pno + 1}))
            else:
                out.append((tb['r'].y0, {'type': 'p', 'text': paragraph_markdown(tb['b']), 'raw': tb['t'], 'page': pno + 1}))

        out.sort(key=lambda x: x[0])
        return out

    def run(self):
        if self.img_dir.exists():
            shutil.rmtree(self.img_dir)
        self.img_dir.mkdir(parents=True)
        start = min(p for _, _, p in self.toc) - 1 if self.toc else 0
        for pno in range(start, self.doc.page_count):
            for _, item in self.parse_page(pno):
                self.add(item)

    def add(self, item: dict):
        # join a paragraph that continues across a page break (or around a float)
        if item['type'] == 'p' and re.match(r'^[a-z(]', item.get('raw', '')):
            for prev in reversed(self.items[-4:]):
                if prev['type'] == 'heading':
                    break
                if prev['type'] == 'p':
                    if not re.search(r'[.:!?]["”)]?$', prev['raw']):
                        joiner = '' if re.search(r'[A-Za-z]-$', prev['text']) else ' '
                        if joiner == '':
                            prev['text'] = prev['text'][:-1]
                        prev['text'] += joiner + item['text']
                        prev['raw'] += ' ' + item['raw']
                        return
                    break
        if item['type'] == 'heading' and self.items and self.items[-1]['type'] == 'heading' \
                and self.items[-1]['page'] == item['page'] and not self.items[-1].get('closed'):
            # "Chapter 3" + "How to build ..." or a heading split over two blocks
            self.items[-1]['text'] += ' ' + item['text']
            return
        self.items.append(item)

    # --- headings -> chapters
    def chapters(self) -> list[dict]:
        toc_l1 = [(norm(t), t) for lvl, t, _ in self.toc if lvl == 1]
        chapters: list[dict] = []
        expanded = []
        for it in self.items:
            if it['type'] != 'heading':
                expanded.append(it)
                continue
            text = re.sub(r'([a-z])- ([a-z])', r'\1\2', it['text'])
            # "Chapter 2 Title 2.1 Section" -> two headings
            for piece in re.split(r'\s+(?=(?:[A-Z]|\d+)(?:\.\d+)+\s)', text):
                if piece.strip():
                    expanded.append({**it, 'text': piece.strip()})
        for it in expanded:
            if it['type'] == 'heading':
                text = re.sub(r'^(Chapter|Appendix)\s+[A-Z0-9]+\s*', '', it['text']).strip()
                text = re.sub(r'^([A-Z]|\d+)(\.\d+)*\s+(?=[A-Z(])', '', text).strip()
                n = norm(text)
                match = self.toc_norm.get(n)
                if not match:
                    # tolerate a TOC title that is a prefix/suffix of the heading text (or vice versa)
                    for k, v in self.toc_norm.items():
                        if k and (n.endswith(k) or k.endswith(n)) and min(len(k), len(n)) > 6:
                            match = v
                            break
                level, title = match if match else (3, text)
                if level == 1:
                    chapters.append({'title': title, 'page': it['page'], 'body': []})
                    continue
                it = {**it, 'level': level, 'title': title}
            if not chapters:
                chapters.append({'title': 'Document Overview', 'page': it['page'], 'body': []})
            chapters[-1]['body'].append(it)
        return chapters


# ---------------------------------------------------------------- output


SPLIT_MIN_PAGES = 8      # chapters longer than this ...
SPLIT_MIN_SECTIONS = 4   # ... with at least this many sections get one page per section


def body_lines(slug: str, items: list[dict], shift: int = 0) -> tuple[list[str], list[dict]]:
    lines: list[str] = []
    sections: list[dict] = []
    in_list = False
    for it in items:
        t = it['type']
        if t != 'li' and in_list:
            lines.append('')
            in_list = False
        if t == 'heading':
            level = max(2, min(4, it['level'] - shift))
            lines += [f'{"#" * level} {md_escape(it["title"])}', '']
            sections.append({'title': it['title'], 'level': level, 'id': slugify(it['title'])})
        elif t == 'p':
            lines += [it['text'], '']
        elif t == 'li':
            lines.append(f'- {it["text"]}')
            in_list = True
        elif t == 'figure':
            alt = it['alt'].replace('"', '&quot;')
            cls = 'cw-guide-fig'
            if it.get('table'):
                cls += ' cw-guide-table'
            elif it.get('wrap'):
                cls += ' cw-guide-narrow'
            cap = f'\n  <figcaption>{it["caption"]}</figcaption>\n' if it['caption'] else ''
            lines += [
                f'<figure class="{cls}">',
                f'  <img src="/guides/{slug}/{it["src"]}" width="{it["w"]}" height="{it["h"]}" alt="{alt}" loading="lazy" decoding="async" />',
                cap,
                '</figure>',
                '',
            ]
        elif t == 'equation':
            alt = it['alt'].replace('"', '&quot;')
            lines += [
                f'<p class="cw-guide-eq"><img src="/guides/{slug}/{it["src"]}" width="{round(it["w"] / 2.5 * 1.3)}" '
                f'alt="{alt}" loading="lazy" decoding="async" /></p>',
                '',
            ]
    return lines, sections


def page_text(g: Guide, meta: dict, title: str, order: int, first: int, last: int, body: list[str], pdf_url: str) -> str:
    slug = g.cfg['slug']
    pages = f'{first}–{last}' if last > first else f'{first}'
    label = 'pages' if last > first else 'page'
    # The site's live PDF viewer (src/pages/pdf/[slug].astro), opened at this chapter's first page.
    viewer = f'/pdf/{slug}/#page={first}'
    head = [
        '---',
        f'title: {yaml_str(title)}',
        f'description: {yaml_str(g.cfg["title"] + ", " + label + " " + pages + ". Generated from the PDF on GitHub.")}',
        'sidebar:',
        f'  order: {order}',
        'editUrl: false',
        '---',
        '',
        f'<!-- Generated by scripts/sync-guides.py from {g.cfg["file"]}. Do not edit by hand. -->',
        '',
        f'<div class="cw-guide-source not-content" data-repo="{GITHUB_REPO}" data-branch="{BRANCH}" '
        f'data-path="{g.cfg["file"]}" data-sha="{meta["blobSha"]}" data-date="{meta["commitDate"]}">'
        f'<span class="cw-gs-doc">From <a href="{viewer}" target="_blank" rel="noopener" title="Opens the latest PDF from GitHub in a new tab">{g.cfg["file"]}</a>, {label} {pages}</span>'
        f'<span class="cw-gs-status" data-state="idle">Synced with the PDF from {meta["commitDate"][:10]}</span>'
        f'<span class="cw-gs-note" hidden></span></div>',
        '',
    ]
    foot = [
        '',
        f'<p class="cw-guide-foot">From <a href="{viewer}" target="_blank" rel="noopener" title="Opens the latest PDF from GitHub in a new tab">{g.cfg["file"]}</a>, {label} {pages}.'
        '</p>',
        '',
    ]
    return '\n'.join(head + body + foot)


def write_guide(g: Guide, meta: dict) -> dict:
    slug = g.cfg['slug']
    out_dir = DOCS_DIR / slug
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    chapters = g.chapters()
    pdf_url = f'https://github.com/{GITHUB_REPO}/blob/{BRANCH}/{g.cfg["file"].replace(" ", "%20")}'
    summary = []
    used = set()
    for idx, ch in enumerate(chapters):
        cslug = slugify(ch['title']) or f'part-{idx + 1}'
        while cslug in used:
            cslug += '-2'
        used.add(cslug)
        last = chapters[idx + 1]['page'] - 1 if idx + 1 < len(chapters) else g.doc.page_count
        last = max(last, ch['page'])
        l2 = [i for i, it in enumerate(ch['body']) if it['type'] == 'heading' and it['level'] == 2]
        entry = {'title': ch['title'], 'pages': [ch['page'], last]}

        if last - ch['page'] + 1 >= SPLIT_MIN_PAGES and len(l2) >= SPLIT_MIN_SECTIONS:
            # one page per section, plus an intro page for the text before the first section
            cdir = out_dir / cslug
            cdir.mkdir()
            intro = ch['body'][: l2[0]]
            lines, _ = body_lines(slug, intro)
            starts = l2 + [len(ch['body'])]
            children = []
            sused = set()
            for k in range(len(l2)):
                head = ch['body'][starts[k]]
                body = ch['body'][starts[k] + 1: starts[k + 1]]
                sslug = slugify(head['title'])[:80].rstrip('-')
                while sslug in sused:
                    sslug += '-2'
                sused.add(sslug)
                first = head['page']
                nxt = ch['body'][starts[k + 1]]['page'] if k + 1 < len(l2) else last
                end = max(first, nxt if k + 1 == len(l2) else nxt - (0 if nxt == first else 0))
                blines, secs = body_lines(slug, body, shift=1)
                (cdir / f'{sslug}.md').write_text(
                    page_text(g, meta, head['title'], k + 1, first, end, blines, pdf_url), encoding='utf-8')
                children.append({'title': head['title'], 'url': f'/docs/guides/{slug}/{cslug}/{sslug}/',
                                 'pages': [first, end], 'sections': secs})
            lines += ['## In this chapter', '']
            lines += [f'- [{md_escape(c["title"])}]({c["url"]})' for c in children]
            (cdir / 'index.md').write_text(
                page_text(g, meta, ch['title'], 0, ch['page'], last, lines, pdf_url), encoding='utf-8')
            entry.update({'url': f'/docs/guides/{slug}/{cslug}/', 'children': children, 'sections': []})
        else:
            lines, secs = body_lines(slug, ch['body'])
            (out_dir / f'{cslug}.md').write_text(
                page_text(g, meta, ch['title'], idx + 1, ch['page'], last, lines, pdf_url), encoding='utf-8')
            entry.update({'url': f'/docs/guides/{slug}/{cslug}/', 'sections': [s for s in secs if s['level'] <= 3]})
        summary.append(entry)
    return {
        **{k: g.cfg[k] for k in ('slug', 'file', 'title', 'blurb')},
        **meta,
        'pdfUrl': pdf_url,
        'pageCount': g.doc.page_count,
        'figures': len(list(g.img_dir.glob('*.webp'))),
        'chapters': summary,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', required=True, type=Path, help='clone of the v3X repository')
    args = ap.parse_args()
    repo = args.repo.resolve()

    manifest = {
        'repo': GITHUB_REPO,
        'branch': BRANCH,
        'syncedCommit': git(repo, 'rev-parse', 'HEAD'),
        'syncedCommitDate': git(repo, 'log', '-1', '--format=%cI'),
        'guides': [],
    }
    for cfg in GUIDES:
        path = repo / cfg['file']
        if not path.exists():
            print(f'skip {cfg["file"]}: not in repo')
            continue
        meta = {
            'blobSha': git(repo, 'rev-parse', f'HEAD:{cfg["file"]}'),
            'commit': git(repo, 'log', '-1', '--format=%H', '--', cfg['file']),
            'commitDate': git(repo, 'log', '-1', '--format=%cI', '--', cfg['file']),
            'bytes': path.stat().st_size,
        }
        g = Guide(cfg, repo)
        g.run()
        entry = write_guide(g, meta)
        manifest['guides'].append(entry)
        print(f'{cfg["file"]}: {len(entry["chapters"])} chapters, {entry["figures"]} images')
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
