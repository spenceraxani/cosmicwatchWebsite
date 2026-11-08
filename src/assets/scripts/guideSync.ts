// Compares each guide page's PDF blob SHA with the one on GitHub and flags a newer PDF.
// Unauthenticated API calls are capped at 60 an hour, so results are cached for 15 minutes.

type Remote = { sha: string; date?: string; commitUrl?: string };

const TTL = 15 * 60 * 1000;
const inflight = new Map<string, Promise<Remote | null>>();

function cacheGet(key: string): Remote | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    return Date.now() - t < TTL ? v : null;
  } catch {
    return null;
  }
}

function cacheSet(key: string, v: Remote) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v }));
  } catch {
    /* storage unavailable: no cache */
  }
}

export async function remoteFile(repo: string, branch: string, path: string): Promise<Remote | null> {
  const key = `cw-guide:${repo}:${branch}:${path}`;
  const hit = cacheGet(key);
  if (hit) return hit;
  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    try {
      const enc = path.split('/').map(encodeURIComponent).join('/');
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${enc}?ref=${branch}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) return null;
      const meta = await res.json();
      const out: Remote = { sha: meta.sha };
      // the date only matters when the file changed, so spend the second request only then
      const known = document.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"][data-sha]`)?.dataset.sha;
      if (known && known !== meta.sha) {
        const c = await fetch(
          `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(path)}&sha=${branch}&per_page=1`
        );
        if (c.ok) {
          const [last] = await c.json();
          out.date = last?.commit?.committer?.date;
          out.commitUrl = last?.html_url;
        }
      }
      cacheSet(key, out);
      return out;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export function pdfLink(repo: string, branch: string, path: string) {
  return `https://github.com/${repo}/blob/${branch}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

async function check(el: HTMLElement) {
  if (el.dataset.checked) return;
  el.dataset.checked = '1';
  const { repo = '', branch = 'main', path = '', sha = '', date = '' } = el.dataset;
  const status = el.querySelector<HTMLElement>('.cw-gs-status');
  const note = el.querySelector<HTMLElement>('.cw-gs-note');
  if (!status) return;
  status.dataset.state = 'checking';
  status.textContent = 'Checking GitHub…';
  const remote = await remoteFile(repo, branch, path);
  if (!remote) {
    status.dataset.state = 'unknown';
    status.textContent = `Synced with the PDF from ${fmt(date)}`;
    status.title = 'GitHub could not be reached just now, so this page was not checked against the latest PDF.';
    return;
  }
  if (remote.sha === sha) {
    status.dataset.state = 'current';
    status.textContent = 'Matches the latest PDF on GitHub';
    status.title = `Checked just now. PDF last changed ${fmt(date)}.`;
    return;
  }
  status.dataset.state = 'stale';
  status.textContent = 'Newer PDF on GitHub';
  if (note) {
    note.hidden = false;
    note.innerHTML = '';
    note.append(
      `The PDF on GitHub was updated${remote.date ? ` on ${fmt(remote.date)}` : ''}, after this page was generated. `,
      'The page updates on the next site sync. Until then, ',
      Object.assign(document.createElement('a'), {
        href: pdfLink(repo, branch, path),
        textContent: 'read the latest PDF',
      }),
      '.'
    );
  }
}

function run() {
  document.querySelectorAll<HTMLElement>('.cw-guide-source[data-sha]').forEach(check);
}

document.addEventListener('astro:page-load', run);
if (document.readyState !== 'loading') run();
else document.addEventListener('DOMContentLoaded', run);
