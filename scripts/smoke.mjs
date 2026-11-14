import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';

const DIST = resolve(new URL('../dist/', import.meta.url).pathname);
// Every marketing route, plus a few docs pages.
const ROUTES = [
  '/',
  '/detector/',
  '/shop/',
  '/measure/',
  '/github/',
  '/contact/',
  '/contact/thanks/',
  '/docs/',
  '/docs/parts-list/',
  '/pdf/instruction-manual/',
  '/pdf/troubleshooting/',
  '/docs/guides/instruction-manual/how-to-build-a-cosmicwatch-detector-v3x/',
  '/docs/guides/example-measurements/tested-measurements/',
  '/docs/guides/troubleshooting/troubleshooting/',
  '/404',
];

// Cheap content assertions on top of the status check.
const EXPECTATIONS = {
  '/contact/': [
    'id="contact-form"',
    'id="faq"',
    'id="people"',
    'data-focus-form',
  ],
  '/': [
    '<html lang="en"',
    'CosmicWatch',
    'id="about"',
    'data-gui-zip',
    'href="/measure"',
  ],
  '/detector/': ['id="papers"'],
  '/measure/': ['id="m-pdf"', 'data-tab="dt"'],
  '/shop/': [
    'data-product="assembled"',
    'data-product="kit"',
    '/docs/parts-list/',
  ],
  '/docs/parts-list/': [
    'Digi-Key Bulk Add, 1 detector',
    'sl-steps',
    'step-5-backorder',
  ],
  '/github/': ['id="gh-fw-link"', 'data-gui-zip'],
  '/pdf/instruction-manual/': ['raw.githubusercontent.com', 'id="pdf-frame"'],
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
};

function resolvePath(urlPath) {
  let pathname = decodeURIComponent(urlPath.split('?')[0]);
  if (pathname.includes('\0') || /(?:^|[/\\])\.\.(?:[/\\]|$)/.test(pathname)) {
    throw Object.assign(new Error('Invalid path'), { code: 'EINVAL' });
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  else if (!extname(pathname)) pathname += '/index.html';
  if (pathname === '/404/index.html') pathname = '/404.html';

  const filePath = resolve(DIST, pathname.replace(/^[/\\]+/, ''));
  const rel = relative(DIST, filePath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw Object.assign(new Error('Path escapes dist'), { code: 'EACCES' });
  }
  return filePath;
}

async function run() {
  const server = createServer(async (req, res) => {
    try {
      const filePath = resolvePath(req.url || '/');
      const data = await readFile(filePath);
      const type = MIME[extname(filePath)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    } catch {
      try {
        const data = await readFile(resolve(DIST, '404.html'));
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  let failed = false;
  try {
    for (const route of ROUTES) {
      const res = await fetch(`${base}${route}`);
      const ok = route === '/404' ? res.status === 404 || res.ok : res.ok;
      if (!ok) {
        console.error(`FAIL ${route} → ${res.status}`);
        failed = true;
        continue;
      }
      const html = await res.text();
      const missing = (EXPECTATIONS[route] ?? []).filter(
        needle => !html.includes(needle)
      );
      if (missing.length) {
        console.error(`FAIL ${route} → missing ${missing.join(', ')}`);
        failed = true;
      } else {
        console.log(`OK   ${route} → ${res.status}`);
      }
    }
  } finally {
    server.close();
  }

  if (failed) process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
