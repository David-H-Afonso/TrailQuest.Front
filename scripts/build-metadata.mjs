import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
const version = (await readFile(join(root, 'VERSION'), 'utf8')).trim();
if (manifest.version !== version || lock.version !== version || lock.packages[''].version !== version || manifest.license !== 'MIT') {
  throw new Error('VERSION, package metadata and lockfile must agree before building.');
}
const output = join(root, 'public', 'licenses');
await mkdir(output, { recursive: true });
await copyFile(join(root, 'LICENSE'), join(output, 'LICENSE'));
await copyFile(join(root, 'THIRD_PARTY_NOTICES.md'), join(output, 'THIRD_PARTY_NOTICES.md'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);
const packages = [];
for (const [location, item] of Object.entries(lock.packages).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0)) {
  if (!location || !location.startsWith('node_modules/')) continue;
  const helper = /^node_modules\/(vite|rollup|esbuild)$/.test(location);
  if (item.dev && !helper) continue;
  const name = location.split('node_modules/').at(-1);
  if (!name || name.includes('..') || !item.version) throw new Error('Invalid locked package identity.');
  const directory = join(root, location);
  const texts = [];
  for (const file of (await readdir(directory)).sort()) {
    if (!/^(license|licence|copying|notice|ofl)(?:[._-].*)?$/i.test(file) || !(await stat(join(directory, file))).isFile()) continue;
    const bytes = await readFile(join(directory, file));
    const relative = `${name.replaceAll('/', '__')}@${item.version}/${file}`;
    await mkdir(dirname(join(output, relative)), { recursive: true });
    await writeFile(join(output, relative), bytes);
    texts.push({ file: relative, sha256: sha256(bytes) });
  }
  if (!texts.length || !item.license) throw new Error(`Missing distributable license evidence for ${name}@${item.version}.`);
  packages.push({ name, version: item.version, license: item.license, scope: helper && item.dev ? 'build-helper' : 'declared-runtime', source: item.resolved, texts });
}
const index = { project: 'TrailQuest Web', version, projectLicense: 'MIT', dependencyLicensesAreSeparate: true, packages };
await writeFile(join(output, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
const bom = {
  bomFormat: 'CycloneDX', specVersion: '1.6', version: 1,
  metadata: { component: { type:'application', name:'TrailQuest Web', version, licenses:[{license:{id:'MIT'}}] } },
  components: packages.map(item => ({ type:'library', name:item.name, version:item.version,
    'bom-ref':`pkg:npm/${item.name.split('/').map(encodeURIComponent).join('/')}@${item.version}`,
    purl:`pkg:npm/${item.name.split('/').map(encodeURIComponent).join('/')}@${item.version}`,
    licenses:[{expression:item.license}],
    properties:[{name:'trailquest:inventory-scope',value:item.scope}],
    externalReferences:item.source?[{type:'distribution',url:item.source}]:[] }))
};
await writeFile(join(output, 'bom.cdx.json'), `${JSON.stringify(bom, null, 2)}\n`);
await writeFile(join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>TrailQuest ${escape(version)} — licenses</title><body><main><h1>TrailQuest Web ${escape(version)}</h1><p>Project code: <a href="LICENSE">MIT</a>. Third-party software, photographs and fonts retain their own licenses. This page is a notice bundle, not a claim that every dependency is MIT.</p><p><a href="THIRD_PARTY_NOTICES.md">Third-party notices</a> · <a href="index.json">Inventory and text hashes</a> · <a href="bom.cdx.json">CycloneDX inventory</a> · <a href="/api/v1/licenses/index.json">API license inventory</a></p><ul>${packages.map(item=>`<li><strong>${escape(item.name)} ${escape(item.version)}</strong> — ${escape(item.license)}: ${item.texts.map(text=>`<a href="${text.file.split('/').map(encodeURIComponent).join('/')}">${escape(text.file.split('/').at(-1))}</a>`).join(', ')}</li>`).join('\n')}</ul><p><a href="/">Back to TrailQuest</a></p></main></body></html>\n`);
await writeFile(join(root, 'public', 'version.json'), `${JSON.stringify({ version, revision:process.env.SOURCE_REVISION || 'unversioned' })}\n`);
console.log(`Release ${version}: ${packages.length} dependency/helper license bundles generated.`);
