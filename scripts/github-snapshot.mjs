// Writes src/data_files/github-snapshot.json from a clone of the CosmicWatch
// v3X repository: newest firmware, recent commits, the top-level files, and the
// current names of the files the site links to (Gerbers, purchasing list,
// placement sheet). The Downloads and Parts List pages are built from it, and
// the browser still asks GitHub for anything newer. Reads names from git, so a
// sparse or blobless clone (as in .github/workflows/sync-guides.yml) works.
//
//   git clone https://github.com/spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X ../cw-repo
//   node scripts/github-snapshot.mjs ../cw-repo
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const repo = process.argv[2];
if (!repo) {
  console.error('usage: node scripts/github-snapshot.mjs <path-to-clone>');
  process.exit(1);
}
const git = (...args) =>
  execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });

const commits = git('log', '--format=%H%x1f%aI%x1f%an%x1f%s')
  .trim()
  .split('\n')
  .map(line => {
    const [sha, date, author, message] = line.split('\x1f');
    return { sha, date, author, message };
  });

// Every path in the repository at HEAD, with its type.
const tree = git('ls-tree', '-r', '-t', '--name-only', 'HEAD')
  .trim()
  .split('\n');
const dirs = new Set(
  git('ls-tree', '-r', '-d', '--name-only', 'HEAD').trim().split('\n')
);
const inDir = dir => tree.filter(p => p.startsWith(`${dir}/`) && !dirs.has(p));
const newest = (paths, re) =>
  paths
    .filter(p => re.test(p))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .at(-1) ?? null;

const versions = inDir('Firmware')
  .map(n => n.match(/(\d+\.\d+\.\d+)\.uf2$/)?.[1])
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const files = tree
  .filter(p => !p.includes('/') && !p.startsWith('.'))
  .map(name => ({ name, type: dirs.has(name) ? 'dir' : 'file' }))
  .sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1
  );

// Current names of linked files, so a renamed or re-versioned file keeps working.
const top = files.filter(f => f.type === 'file').map(f => f.name);
const links = {
  firmware: newest(inDir('Firmware'), /\.uf2$/i),
  gerbers: newest(inDir('PCB'), /Gerber.*\.zip$/i),
  purchasingList: newest(top, /^Purchasing_List.*\.xlsx$/i),
  placementSheet: newest(top, /Placement.*\.xlsx$/i),
  enclosure: dirs.has('Enclosure') ? 'Enclosure' : null,
  gui: dirs.has('GUI') ? 'GUI' : null,
  importData: tree.find(p => /(^|\/)import_data\.py$/.test(p)) ?? null,
  plot: tree.find(p => /(^|\/)plot\.py$/.test(p)) ?? null,
};

const snapshot = {
  takenAt: new Date().toISOString(),
  firmware: versions.at(-1) ?? null,
  lastUpdate: commits[0]?.date ?? null,
  commitCount: commits.length,
  commits: commits.slice(0, 50),
  files,
  links,
};
writeFileSync(
  new URL('../src/data_files/github-snapshot.json', import.meta.url),
  JSON.stringify(snapshot, null, 2) + '\n'
);
console.log(
  `snapshot: ${commits.length} commits, firmware ${snapshot.firmware}, ${files.length} entries`
);
