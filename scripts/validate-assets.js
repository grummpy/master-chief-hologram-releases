#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const required = [
  ['assets/icon.png', 'png'],
  ['assets/master-chief-hologram-v1.png', 'png'],
  ['assets/hologram-placeholder.svg', 'svg'],
];

function pngSize(file) {
  const data = fs.readFileSync(file);
  if (data.readUInt32BE(0) !== 0x89504e47 || data.toString('ascii', 1, 4) !== 'PNG') throw new Error('invalid PNG signature');
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

for (const [relative, type] of required) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`missing required asset: ${relative}`);
  const stat = fs.statSync(file);
  if (!stat.size) throw new Error(`empty required asset: ${relative}`);
  if (type === 'png') {
    const { width, height } = pngSize(file);
    if (width < 256 || height < 256) throw new Error(`${relative} is too small (${width}x${height})`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (packageJson.build?.mac?.icon !== 'assets/icon.png') throw new Error('macOS build icon must be assets/icon.png');
if (!packageJson.build?.files?.includes('assets/**/*')) throw new Error('packaged assets are missing from electron-builder files');
console.log(`asset validation passed (${required.length} required assets, package v${packageJson.version})`);
