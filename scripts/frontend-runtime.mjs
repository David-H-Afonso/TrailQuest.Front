import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function isCompatible(saved, expected) {
  return saved?.platform === expected.platform && saved?.architecture === expected.architecture
    && saved?.nodeMajor === expected.nodeMajor && saved?.lockHash === expected.lockHash;
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const frontend = root;
  const marker = join(root, '.local', 'frontend-runtime.json');
  const expected = {
    platform: process.platform,
    architecture: process.arch,
    nodeMajor: Number(process.versions.node.split('.')[0]),
    lockHash: createHash('sha256').update(readFileSync(join(frontend, 'package-lock.json'))).digest('hex'),
  };
  const operation = process.argv[2];
  if (operation === 'check') {
    let saved;
    try { saved = JSON.parse(readFileSync(marker, 'utf8')); }
    catch { saved = null; }
    if (!existsSync(join(frontend, 'node_modules', 'vite', 'bin', 'vite.js')) || !isCompatible(saved, expected)) {
      console.log(`Frontend dependencies need installation for ${expected.platform}-${expected.architecture}, Node ${expected.nodeMajor}.`);
      process.exitCode = 10;
    }
    return;
  }
  if (operation === 'mark') {
    mkdirSync(dirname(marker), { recursive: true });
    writeFileSync(marker, `${JSON.stringify(expected, null, 2)}\n`);
    console.log(`Frontend runtime recorded: ${expected.platform}-${expected.architecture}, Node ${expected.nodeMajor}.`);
    return;
  }
  throw new Error('Usage: node scripts/frontend-runtime.mjs <check|mark>');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
