const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('protected capabilities are enforced in the main process', () => {
  const source = read('main.js');
  assert.match(source, /secureHandle\('chat'.*requireToolApproval\('chat\.send_to_configured_provider'\)/s);
  assert.match(source, /secureHandle\('transcribe-audio'.*requireToolApproval\('voice\.transcribe_microphone'\)/s);
  assert.match(source, /secureHandle\('index-document'.*requireToolApproval\('files\.attach_local_text'\)/s);
  assert.match(source, /function trustedIpc\(event\)/);
});

test('all non-stream provider fetches use the cancellable request path', () => {
  const source = read('main.js');
  assert.match(source, /async function chatFetch/);
  assert.match(source, /chatFetch\('https:\/\/api\.openai\.com\/v1\/responses'/);
  assert.match(source, /chatFetch\('https:\/\/api\.x\.ai\/v1\/chat\/completions'/);
  assert.match(source, /chatFetch\(`\$\{base\}\/api\/chat`/);
  assert.doesNotMatch(source, /execFileAsync\('ffmpeg'/);
});

test('command deck exposes route residency, consent, accessible log, and responsive actions', () => {
  const html = read('index.html');
  const css = read('styles.css');
  assert.match(html, /id="residencyBadge"/);
  assert.match(html, /id="externalConsent"/);
  assert.match(html, /role="log"/);
  assert.match(html, /Commander Nova/);
  assert.match(html, /id="professionalViewBtn"/);
  assert.match(html, /id="personalViewBtn"/);
  assert.match(read('renderer.js'), /mcPersonaView/);
  assert.match(read('renderer.js'), /permissions, and privacy controls stay unchanged/);
  assert.match(css, /\.utility-actions\{display:flex;flex-wrap:wrap/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('renderer clears every model history and purges temporary indexes', () => {
  const source = read('renderer.js');
  assert.match(source, /Object\.keys\(histories\)\.forEach/);
  assert.match(source, /clearPrivateHistory/);
  assert.match(source, /removeIndexedDocument\(attachment\.name\)/);
  assert.match(source, /confirmExternalRoute/);
  assert.match(source, /e\.key==='Enter'&&!e\.shiftKey&&!e\.isComposing/);
  assert.match(read('index.html'), /Enter to send · Shift\+Enter for newline/);
});

test('launcher fails closed instead of installing a stale build', () => {
  const source = read('scripts/launch-mac.sh');
  assert.doesNotMatch(source, /run dist:mac[^\n]*\|\| true/);
  assert.match(source, /"\$NPM_BIN" test/);
  assert.match(source, /"\$NPM_BIN" run inspect:mac/);
  assert.match(source, /PREVIOUS_BUNDLE/);
});

test('packaging removes broad transport and unused hardware permissions', () => {
  const source = read('scripts/after-pack.js');
  assert.match(source, /NSAllowsArbitraryLoads.*NO/);
  assert.match(source, /NSCameraUsageDescription/);
  assert.match(source, /NSBluetoothAlwaysUsageDescription/);
  assert.match(read('package.json'), /"afterPack": "scripts\/after-pack\.js"/);
});
