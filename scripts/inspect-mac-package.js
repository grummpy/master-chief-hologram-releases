#!/usr/bin/env node
'use strict';

// A local release gate. It reports signing state but never signs, notarizes,
// uploads, or otherwise modifies the bundle.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const packageJson = require(path.join(root, 'package.json'));
const appBundle = process.argv[2] || path.join(root, 'dist', 'mac-arm64', `${packageJson.build.productName}.app`);
const contents = path.join(appBundle, 'Contents');
const plist = path.join(contents, 'Info.plist');
const asar = path.join(contents, 'Resources', 'app.asar');
const requiredFiles = ['main.js', 'preload.js', 'renderer.js', 'three-scene.js', 'three-scene.bundle.js', 'autocomplete.js', 'local-routing.js', 'local-ai-manifest.js', 'local-ai-manifest.json', 'local-ai-audit.js', 'artifact-links.js', 'microphone-access.js', 'security.js', 'credential-store.js', 'tool-registry.js', 'rag-index.js', 'build-info.json', 'LICENSE', 'assets/icon.png', 'assets/vendor/three.module.min.js', 'assets/vendor/three.core.min.js', 'assets/characters/command-officer-reference-v1.png', 'assets/characters/commander-nova-personal-v1.png'];
function command(command, args) { return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
function fail(message) { throw new Error(`package inspection failed: ${message}`); }
if (!fs.existsSync(appBundle)) fail(`missing app bundle: ${appBundle}`);
if (!fs.existsSync(plist)) fail('Contents/Info.plist is missing');
if (!fs.existsSync(asar)) fail('Contents/Resources/app.asar is missing');
const plistVersion = command('plutil', ['-extract', 'CFBundleShortVersionString', 'raw', plist]).trim();
if (plistVersion !== packageJson.version) fail(`Info.plist version ${plistVersion} does not match package version ${packageJson.version}`);
const microphoneUsage = command('plutil', ['-extract', 'NSMicrophoneUsageDescription', 'raw', plist]).trim();
if (!microphoneUsage) fail('Info.plist is missing NSMicrophoneUsageDescription');
let arbitraryLoads = '';
try { arbitraryLoads = command('plutil', ['-extract', 'NSAppTransportSecurity.NSAllowsArbitraryLoads', 'raw', plist]).trim(); } catch {}
if (arbitraryLoads === 'true') fail('Info.plist permits arbitrary network loads');
const asarLib = require('@electron/asar');
const archived = asarLib.listPackage(asar).map(value => value.replace(/^\//, ''));
for (const file of requiredFiles) if (!archived.includes(file)) fail(`app.asar is missing ${file}`);
let manifest;
try { manifest = JSON.parse(asarLib.extractFile(asar, 'build-info.json').toString('utf8')); } catch { fail('build-info.json is not valid JSON'); }
if (manifest.version !== packageJson.version) fail('build-info.json version does not match package.json');
if (!manifest.revision || !manifest.builtAt || manifest.schemaVersion !== 1) fail('build-info.json is incomplete');
let signing = 'unsigned or uninspectable';
try {
  const details = command('codesign', ['-dv', '--verbose=2', appBundle]);
  const team = (details.match(/TeamIdentifier=(.+)/) || [])[1];
  signing = team && team !== 'not set' ? `Developer ID team ${team}` : 'ad hoc signature';
} catch (error) {
  const details = String(error.stderr || '');
  if (!/Signature=adhoc/.test(details)) fail(`codesign inspection error: ${details.trim()}`);
  signing = 'ad hoc signature';
}
console.log(`package inspection passed: ${path.basename(appBundle)} v${manifest.version} ${manifest.revision} (${signing})`);
