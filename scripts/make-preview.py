"""Turn the Astro dist/ (root-absolute paths) into a copy that works when served
from any sub-path: every internal URL becomes relative, directory links point
at index.html, the docs ClientRouter is dropped (full page loads instead), and
a small 'draft preview' strip is added to each page."""
import os, re, shutil, sys

SRC, OUT = sys.argv[1], sys.argv[2]
shutil.rmtree(OUT, ignore_errors=True)
shutil.copytree(SRC, OUT)

def fix_path(p, prefix):
    if p.startswith('//'):
        return p
    m = re.search(r'[?#]', p)
    path, rest = (p[:m.start()], p[m.start():]) if m else (p, '')
    path = path.lstrip('/')
    last = path.rsplit('/', 1)[-1]
    if path == '' or path.endswith('/'):
        path += 'index.html'
    elif '.' not in last:
        path += '/index.html'
    return prefix + path + rest

ATTR = re.compile(r'\b(href|src|action|poster|data-src|component-url|renderer-url|before-hydration-url)="(/[^"]*)"')
SRCSET = re.compile(r'\bsrcset="([^"]*)"')
CSSURL = re.compile(r'url\((["\']?)(/[^)"\']+)\1\)')

BANNER = ('<div style="position:fixed;left:12px;bottom:12px;z-index:9999;font:600 12px/1.2 system-ui,sans-serif;'
          'background:#111827;color:#a9d1ef;padding:6px 10px;border-radius:6px;opacity:.9;pointer-events:none">'
          'Draft preview · not the official CosmicWatch site yet</div>')

for root, _, files in os.walk(OUT):
    for f in files:
        fp = os.path.join(root, f)
        rel = os.path.relpath(fp, OUT)
        depth = rel.count(os.sep)
        prefix = '../' * depth if depth else './'
        if f.endswith('.html'):
            s = open(fp, encoding='utf-8').read()
            # drop client-side router so every link is a normal page load
            s = re.sub(r'<script type="module" src="/_astro/ClientRouter[^"]*"></script>', '', s)
            s = re.sub(r'<meta name="astro-view-transitions[^>]*>', '', s)
            s = ATTR.sub(lambda m: f'{m.group(1)}="{fix_path(m.group(2), prefix)}"', s)
            s = SRCSET.sub(lambda m: 'srcset="' + ', '.join(
                (fix_path(part.strip().split(' ')[0], prefix) + (' ' + ' '.join(part.strip().split(' ')[1:]) if ' ' in part.strip() else ''))
                if part.strip().startswith('/') else part.strip()
                for part in m.group(1).split(',')) + '"', s)
            s = CSSURL.sub(lambda m: f'url({m.group(1)}{fix_path(m.group(2), prefix)}{m.group(1)})', s)
            root_js = ('<script>window.__cwRoot=new URL(' + repr(prefix) + ',location.href).href;'
                       'document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");'
                       'if(!a||a.target||e.defaultPrevented)return;var u=new URL(a.href,location.href);'
                       'if(u.origin===location.origin&&u.pathname.endsWith("/")){e.preventDefault();'
                       'u.pathname+="index.html";location.href=u.href;}},true);</script>')
            s = s.replace('<head>', '<head>' + root_js, 1)
            s = s.replace('</body>', BANNER + '</body>', 1)
            open(fp, 'w', encoding='utf-8').write(s)
        elif f.endswith('.css'):
            s = open(fp, encoding='utf-8').read()
            s = CSSURL.sub(lambda m: f'url({m.group(1)}{fix_path(m.group(2), prefix)}{m.group(1)})', s)
            open(fp, 'w', encoding='utf-8').write(s)
        elif f.startswith('Search.astro') and f.endswith('.js'):
            s = open(fp, encoding='utf-8').read()
            s = s.replace('baseUrl:`/`', 'baseUrl:window.__cwRoot')
            s = s.replace('bundlePath:`/`.replace(/\\/$/,``)+`/pagefind/`', 'bundlePath:window.__cwRoot+`pagefind/`')
            open(fp, 'w', encoding='utf-8').write(s)

# sanity: no root-absolute internal refs left in html
left = 0
for root, _, files in os.walk(OUT):
    for f in files:
        if f.endswith('.html'):
            left += len(ATTR.findall(open(os.path.join(root, f), encoding='utf-8').read()))
print('remaining absolute attrs:', left)
