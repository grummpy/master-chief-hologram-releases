'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('repository requires direct owner approval for new content controls', () => {
  const policy = fs.readFileSync(path.resolve(__dirname, '..', 'AGENTS.md'), 'utf8');
  assert.match(policy, /direct and explicit approval/);
  assert.match(policy, /prompt\s+rewriting/);
  assert.match(policy, /automatic negative-prompt injection/);
  assert.match(policy, /Provider policies remain the provider's\s+responsibility/);
  assert.match(policy, /current baseline contains no app-owned content filter/);
});

test('legal publishing and safety proposals cannot become executable without exact owner approval', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const policy = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
  const main = fs.readFileSync(path.join(projectRoot, 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(projectRoot, 'preload.js'), 'utf8');
  const renderer = fs.readFileSync(path.join(projectRoot, 'renderer.js'), 'utf8');
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  assert.match(policy, /PROPOSED—NOT APPROVED OR DEPLOYED/);
  assert.match(policy, /show the owner the exact proposal/);
  assert.doesNotMatch(main, /governance-status|publication-preflight/);
  assert.doesNotMatch(preload, /getGovernanceStatus|publicationPreflight/);
  assert.doesNotMatch(renderer, /openGovernanceCenter|publicationPreflight/);
  assert.doesNotMatch(html, /governanceCenterBtn|publicationPreflightForm/);
  assert.equal(fs.existsSync(path.join(projectRoot, 'governance-center.js')), false);
});
