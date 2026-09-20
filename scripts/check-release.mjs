import { readFileSync, existsSync } from 'node:fs';

const tag = process.argv[2];
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (tag !== `v${manifest.version}` || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
  throw new Error('Release tag must exactly match the package version.');
}
if (!existsSync(new URL(`../docs/releases/${manifest.version}.md`, import.meta.url))) {
  throw new Error('Commit release notes before tagging.');
}
console.log(`${tag}: manifest and release notes verified`);
