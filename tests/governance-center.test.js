'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { systemInventory, routeDisclosure, publicationPreflight, dependencyLicenseInventory } = require('../governance-center');
const projectRoot = path.join(__dirname, '..');

test('governance inventory makes retention and clear behavior explicit without exposing secrets', () => {
  const inventory = systemInventory('1.41.0');
  assert.equal(inventory.version, '1.41.0');
  assert.ok(inventory.dataStores.some(item => item.id === 'projects' && /Preserved/.test(item.clearBehavior)));
  assert.ok(inventory.dataStores.some(item => item.id === 'credentials' && item.sensitivity === 'secret'));
  assert.equal(JSON.stringify(inventory).includes('apiKey'), false);
});

test('route disclosure distinguishes local, cloud, and unknown destinations', () => {
  assert.match(routeDisclosure('ollama').residency, /local/);
  assert.equal(routeDisclosure('huggingface').known, true);
  assert.match(routeDisclosure('huggingface').externalRetention, /selected inference provider/);
  assert.equal(routeDisclosure('unregistered').known, false);
});

test('publication preflight requires human rights, privacy, provenance, claims, and disclosure review', () => {
  const incomplete = publicationPreflight({ accountableOwner: 'Operator', artifact: 'report.xlsx', provenanceReviewed: true });
  assert.equal(incomplete.readyForHumanRelease, false);
  assert.ok(incomplete.blockers.some(item => item.id === 'rightsReviewed'));
  assert.ok(incomplete.blockers.some(item => item.id === 'humanApproved'));
  const complete = publicationPreflight({ accountableOwner: 'Operator', artifact: 'report.xlsx', provenanceReviewed: true, rightsReviewed: true, consentReviewed: true, privacyReviewed: true, factualClaimsReviewed: true, disclosureDecisionRecorded: true, humanApproved: true });
  assert.equal(complete.readyForHumanRelease, true);
  assert.match(complete.determination, /not legal advice/);
});

test('dependency license inventory flags unknown and review-sensitive metadata', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-license-'));
  const lock = path.join(dir, 'package-lock.json');
  fs.writeFileSync(lock, JSON.stringify({ packages: { '': { license: 'MIT' }, 'node_modules/ok': { version: '1', license: 'MIT' }, 'node_modules/unknown': { version: '2' }, 'node_modules/review': { version: '3', license: 'LGPL-3.0' } } }));
  const report = dependencyLicenseInventory(lock);
  assert.equal(report.packages.length, 3);
  assert.ok(report.issues.some(item => item.type === 'missing-license'));
  assert.ok(report.issues.some(item => item.type === 'manual-review'));
});

test('packaged interface exposes governance review through main-process IPC', () => {
  const main = fs.readFileSync(path.join(projectRoot, 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(projectRoot, 'preload.js'), 'utf8');
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  const renderer = fs.readFileSync(path.join(projectRoot, 'renderer.js'), 'utf8');
  assert.match(main, /secureHandle\('governance-status'/);
  assert.match(main, /secureHandle\('publication-preflight'/);
  assert.match(preload, /getGovernanceStatus/);
  assert.match(html, /id="governanceCenterBtn"/);
  assert.match(html, /id="publicationPreflightForm"/);
  assert.match(renderer, /openGovernanceCenter/);
  assert.match(renderer, /publicationPreflight/);
});

test('current dependency inventory reports issues without claiming license clearance', () => {
  const report = dependencyLicenseInventory(path.join(projectRoot, 'package-lock.json'));
  assert.equal(report.packages.length > 0, true);
  assert.match(report.disclaimer, /Metadata inventory only/);
  assert.notEqual(report.status, 'unavailable');
});
