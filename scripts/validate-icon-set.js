#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const expected = { 'icon_16x16.png': [16, 16], 'icon_16x16@2x.png': [32, 32], 'icon_32x32.png': [32, 32], 'icon_32x32@2x.png': [64, 64], 'icon_128x128.png': [128, 128], 'icon_128x128@2x.png': [256, 256], 'icon_256x256.png': [256, 256], 'icon_256x256@2x.png': [512, 512], 'icon_512x512.png': [512, 512], 'icon_512x512@2x.png': [1024, 1024] };
for (const [name, size] of Object.entries(expected)) { const file = path.join(root, 'assets', 'icon.iconset', name); const data = fs.readFileSync(file); if (data.toString('ascii', 1, 4) !== 'PNG' || data.readUInt32BE(16) !== size[0] || data.readUInt32BE(20) !== size[1]) throw new Error(`icon audit failed: ${name} must be ${size.join('x')} PNG`); }
if (!fs.existsSync(path.join(root, 'assets', 'icon.png'))) throw new Error('icon audit failed: assets/icon.png is missing');
console.log('icon audit passed (10 macOS icon exports plus runtime PNG)');
