const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('local whisper command uses the current quiet flag and Finder-safe Homebrew paths', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(source, /'\/opt\/homebrew\/bin\/whisper-cli'/);
  assert.match(source, /'\/opt\/homebrew\/bin\/ffmpeg'/);
  assert.match(source, /audioFile, '-np'/);
});
