// Writes src/data_files/github-snapshot.json from a local clone of the
// CosmicWatch v3X repository, so the GitHub page has real content even when
// the live GitHub API is unreachable or rate-limited.
//
//   git clone https://github.com/spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X ../cw-repo
//   node scripts/github-snapshot.mjs ../cw-repo
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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

const versions = readdirSync(join(repo, 'Firmware'))
  .map(n => n.match(/(\d+\.\d+\.\d+)\.uf2$/)?.[1])
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const files = readdirSync(repo)
  .filter(n => !n.startsWith('.'))
  .map(name => ({
    name,
    type: statSync(join(repo, name)).isDirectory() ? 'dir' : 'file',
  }))
  .sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1
  );

const snapshot = {
  takenAt: new Date().toISOString(),
  firmware: versions.at(-1) ?? null,
  lastUpdate: commits[0]?.date ?? null,
  commitCount: commits.length,
  commits,
  files,
};
writeFileSync(
  new URL('../src/data_files/github-snapshot.json', import.meta.url),
  JSON.stringify(snapshot, null, 2) + '\n'
);
console.log(
  `snapshot: ${commits.length} commits, firmware ${snapshot.firmware}, ${files.length} entries`
);
