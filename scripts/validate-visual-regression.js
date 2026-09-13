#!/usr/bin/env node
// Local visual regression gate. It avoids a browser service: approved artwork is
// content-addressed and the DOM/CSS contract locks the state presentation.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const manifest = JSON.parse(read('assets/visual-state-manifest.json'));
const html = read('index.html');
const css = read('styles.css');
const renderer = read('renderer.js');
const fail = message => { throw new Error(`visual regression: ${message}`); };
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function pngSize(file) { const data = fs.readFileSync(file); if (data.toString('ascii', 1, 4) !== 'PNG') fail(`${file} is not PNG`); return [data.readUInt32BE(16), data.readUInt32BE(20)]; }
function jpegSize(file) {
  const data = fs.readFileSync(file); if (data[0] !== 0xff || data[1] !== 0xd8) fail(`${file} is not JPEG`);
  for (let offset = 2; offset < data.length - 9;) { if (data[offset] !== 0xff) { offset += 1; continue; } const marker = data[offset + 1]; const length = data.readUInt16BE(offset + 2); if (marker >= 0xc0 && marker <= 0xc3) return [data.readUInt16BE(offset + 7), data.readUInt16BE(offset + 5)]; offset += 2 + length; }
  fail(`${file} has no JPEG frame dimensions`);
}
if (manifest.version !== 1 || !Array.isArray(manifest.assets) || manifest.assets.length < 10) fail('invalid visual-state manifest');
for (const asset of manifest.assets) { const file = path.join(root, asset.path); if (!fs.existsSync(file)) fail(`missing ${asset.path}`); if (hash(file) !== asset.sha256) fail(`${asset.path} differs from approved artwork`); const [width, height] = asset.path.endsWith('.png') ? pngSize(file) : jpegSize(file); if (width !== asset.width || height !== asset.height) fail(`${asset.path} dimensions changed to ${width}x${height}`); }
for (const token of ['id="app"', 'id="holoStage"', 'id="holoImg"', 'id="threeScene"', 'id="visualModeBtn"', 'id="holoStatus"', 'id="micBtn"', 'id="sendBtn"', 'id="autocompleteList"', 'aria-live="polite"']) if (!html.includes(token)) fail(`index.html is missing ${token}`);
for (const token of ['#app[data-theme=day]', '.holo-stage', '.holo-stage img', '#threeScene', '.three-active', 'object-fit:cover', '.holo-status', '.scanlines', '.autocomplete-list', '@media(prefers-reduced-motion:reduce)', 'button:focus-visible']) if (!css.includes(token)) fail(`styles.css is missing ${token}`);
for (const name of ['night_idle.jpg', 'night_listening.jpg', 'night_thinking.jpg', 'night_speaking.jpg', 'night_success.jpg', 'night_alert.jpg', 'night_wave.jpg', 'day_idle.jpg', 'day_ready.jpg', 'day_thinking.jpg', 'day_wave.jpg', 'day_success.jpg']) if (!renderer.includes(name)) fail(`renderer state map no longer references ${name}`);
for (const token of ['masterChiefThreeD?.setState', 'masterChiefThreeD?.setEnabled', 'mcVisualMode']) if (!renderer.includes(token)) fail(`renderer.js is missing ${token}`);
const scene = read('three-scene.js');
for (const token of ['THREE.WebGLRenderer', 'buildChair', 'buildCompanion', 'setEnabled', 'command-officer-reference-v1.png']) if (!scene.includes(token)) fail(`three-scene.js is missing ${token}`);
console.log(`visual regression validation passed (${manifest.assets.length} approved assets; day/night state contract intact)`);
