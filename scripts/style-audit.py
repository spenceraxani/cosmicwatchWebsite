"""Flag generic AI patterns in the site source (copy, design, code). Rules in STYLE.md.
Usage: python3 scripts/style-audit.py src"""
import re, sys, os, collections, json
ROOT = sys.argv[1]
SKIP_DIRS = {'node_modules', 'dist', '.astro', 'guides'}  # guides = generated from the PDFs
EXT = ('.astro', '.ts', '.tsx', '.mjs', '.js', '.css', '.mdx', '.md', '.json')

WORDS = r"\b(delve|crucial|pivotal|seamless(ly)?|robust|leverag(e|es|ing)|empower(s|ing)?|unlock(s|ing)?|streamline(s|d)?|journey|landscape|testament|showcas(e|es|ing)|foster(s|ing)?|vibrant|cutting[- ]edge|innovative|powerful|comprehensive|harness(es|ing)?|elevate(s|d)?|tapestry|realm|embark|game[- ]changer|world[- ]class|next[- ]generation|effortless(ly)?|supercharge|revolutioni[sz]e|unparalleled|meticulous(ly)?|intricate|boast(s)?|nestled|ever[- ]evolving|in today's|dive into|additionally|moreover|furthermore|whether you're|look no further|key role)\b"
RULES = {
  # writing
  'em-dash': r'—',
  'spaced en/em dash label': r' – ',
  'ai-vocabulary': WORDS,
  'not-x-but-y': r"\b(not just|isn't just|it's not .{1,40}, it's|more than just|not only .{1,60} but)\b",
  'middle-dot meta': r' · ',
  'arrow glyph in text': r'→|&rarr;|->\s*<\/',
  'curly quotes': r'[“”‘’]',
  'exclamation': r'[a-z]!\s',
  # design
  'uppercase tracked label': r'uppercase[^"\']*tracking|tracking-[a-z]+[^"\']*uppercase',
  'one-word headline accent': r'<span class=\\?"text-(yellow|orange)-[0-9]+[^>]*>[^<]{1,40}</span>',
  'shadow-lg/xl/2xl': r'\bshadow-(lg|xl|2xl)\b',
  'rounded-xl+': r'\brounded-(xl|2xl|3xl|\[3[0-9]px\])\b',
  'hover lift/scale': r'hover:(scale|-translate-y|translate-y)',
  'transition-all': r'transition-all',
  'gradient decoration': r'bg-(linear|gradient)-|from-[a-z]+-[0-9]+[^"]*to-|bg-clip-text|text-transparent',
  'backdrop-blur/glass': r'backdrop-blur|bg-white/(5|10|\[\.)|border-white/',
  'pulse animation': r'animate-pulse|animate-ping|cw-gs-pulse',
  'left border strip': r'border-l-(2|4)|border-s-(2|4)',
  'icon tile above heading': r'(size|h)-(10|12|14) [^"]*rounded[^"]*bg-',
  'equal 3/4-up grid': r'(sm|md|lg):grid-cols-(3|4)\b',
  'numbered markers 01/02': r'>\s*0[1-9]\s*<|"0[1-9]"',
  'arrow on button (component)': r'arrowRight|ArrowRight|Icon name="arrow',
  'tiny text (text-xs)': r'\btext-xs\b',
  # code
  'decorative comment banner': r'(//|/\*|\{/\*|<!--)\s*[-=*#]{4,}',
  'step narration comment': r'(//|\{/\*|<!--)\s*(Step \d|First,|Next,|Finally,)',
  'obvious label comment': r'(//|\{/\*)\s*(Define|Import|Initialize|Main|Helper|Render|Return|Set up|Styled|Container|Wrapper)\b',
  'jsdoc block': r'/\*\*',
  'try/catch': r'\btry\s*\{',
  'empty catch': r'catch\s*(\([^)]*\))?\s*\{\s*(/\*[^*]*\*/\s*)?\}',
  'console.log': r'console\.(log|debug)',
  'as any': r'\bas any\b',
}
hits = collections.defaultdict(collections.Counter)
comment_lines = collections.Counter(); code_lines = collections.Counter()
for dp, dns, fns in os.walk(ROOT):
    dns[:] = [d for d in dns if d not in SKIP_DIRS]
    for fn in fns:
        if not fn.endswith(EXT): continue
        p = os.path.join(dp, fn); rel = os.path.relpath(p, ROOT)
        try: s = open(p, encoding='utf-8').read()
        except Exception: continue
        if fn.endswith('.json') and 'copy' not in rel: continue
        for name, rx in RULES.items():
            n = len(re.findall(rx, s, flags=re.I if name in ('ai-vocabulary','not-x-but-y') else 0))
            if n: hits[name][rel] += n
        if fn.endswith(('.ts', '.mjs', '.js', '.astro', '.css')):
            for line in s.splitlines():
                t = line.strip()
                if not t: continue
                if t.startswith(('//', '/*', '*', '{/*', '<!--')): comment_lines[rel] += 1
                else: code_lines[rel] += 1
out = {}
for name in RULES:
    c = hits[name]; total = sum(c.values())
    out[name] = total
    print(f'{name:30} {total:5}   ' + ', '.join(f'{f}({n})' for f, n in c.most_common(4)))
print('\ncomment density (comment lines / code lines), top files:')
dens = sorted(((comment_lines[f] / max(1, code_lines[f]), f) for f in comment_lines if code_lines[f] > 15), reverse=True)
for d, f in dens[:12]: print(f'  {d:5.2f}  {f} ({comment_lines[f]} comment lines)')
print('\nTOTAL comment lines', sum(comment_lines.values()), 'code lines', sum(code_lines.values()))
json.dump(out, open(sys.argv[2] if len(sys.argv) > 2 else '/tmp/audit/last.json', 'w'))
