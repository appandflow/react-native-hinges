import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const tarball = process.argv[2];
if (!tarball || process.argv.length !== 3) throw new Error('Provide exactly one package tarball.');
const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
const manifest = JSON.parse(execFileSync('tar', ['-xOf', tarball, 'package/package.json'], { encoding: 'utf8' }));
const source = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (manifest.name !== source.name || manifest.version !== source.version) throw new Error('Packed manifest differs.');
for (const required of [
  'README.md',
  'LICENSE',
  'src/index.tsx',
  'lib/module/index.js',
  'lib/typescript/src/index.d.ts',
  'Hinges.podspec',
  'ios/HingesView.mm',
  'android/build.gradle',
]) {
  if (!entries.includes(`package/${required}`)) throw new Error(`Missing package file: ${required}`);
}
for (const entry of entries) {
  if (/^package\/(?:example|website|node_modules|docs|scripts|artifacts|\.github)\//.test(entry)) {
    throw new Error(`Unexpected package file: ${entry}`);
  }
}
for (const group of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
  for (const range of Object.values(manifest[group] ?? {})) {
    if (range.startsWith('workspace:')) throw new Error('Unresolved workspace range in tarball.');
  }
}
console.log(`${manifest.name}@${manifest.version}: ${entries.length} package files verified`);
