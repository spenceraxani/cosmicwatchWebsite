// "Download the GUI" buttons: zip the GUI/ folder of the v3X repository in the
// browser, straight from GitHub, so the download is always the current GUI and
// people don't have to fetch the whole ~140 MB repository.
// Markup: <a data-gui-zip data-repo="owner/name" href="(GUI folder on GitHub)">.
// If anything fails, the link's own href (the GUI folder on GitHub) opens instead.
import { zip, type AsyncZippable } from 'fflate';

const SKIP = /(^|\/)\.claude(\/|$)|(^|\/)\.DS_Store$/;

interface TreeItem {
  path: string;
  type: string;
}

async function buildZip(repo: string, onProgress: (text: string) => void) {
  const tree = await fetch(
    `https://api.github.com/repos/${repo}/git/trees/main?recursive=1`,
    { headers: { Accept: 'application/vnd.github+json' } }
  );
  if (!tree.ok) throw new Error(`GitHub answered ${tree.status}`);
  const files = ((await tree.json()).tree as TreeItem[]).filter(
    f => f.type === 'blob' && f.path.startsWith('GUI/') && !SKIP.test(f.path)
  );
  if (!files.length) throw new Error('No GUI files found');

  const entries: AsyncZippable = {};
  let done = 0;
  const queue = [...files];
  const worker = async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      const url = `https://raw.githubusercontent.com/${repo}/main/${f.path
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${f.path}: ${r.status}`);
      entries[f.path.replace(/^GUI\//, 'CosmicWatch-GUI/')] = new Uint8Array(
        await r.arrayBuffer()
      );
      done++;
      onProgress(`Downloading ${done} of ${files.length} files…`);
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));

  onProgress('Zipping…');
  return new Promise<Uint8Array>((resolve, reject) =>
    zip(entries, { level: 6 }, (err, data) =>
      err ? reject(err) : resolve(data)
    )
  );
}

function save(data: Uint8Array) {
  const url = URL.createObjectURL(
    new Blob([data as BlobPart], { type: 'application/zip' })
  );
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: 'CosmicWatch-GUI.zip',
  });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

for (const link of document.querySelectorAll<HTMLAnchorElement>(
  'a[data-gui-zip]'
)) {
  const label = link.querySelector<HTMLElement>('[data-label]') ?? link;
  const original = label.textContent;
  link.addEventListener('click', async event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    if (link.dataset.busy) return;
    link.dataset.busy = '1';
    link.setAttribute('aria-busy', 'true');
    try {
      save(
        await buildZip(link.dataset.repo!, text => (label.textContent = text))
      );
      label.textContent = 'Downloaded';
      setTimeout(() => (label.textContent = original), 4000);
    } catch {
      label.textContent = original;
      window.open(link.href, '_blank', 'noopener');
    } finally {
      delete link.dataset.busy;
      link.removeAttribute('aria-busy');
    }
  });
}
