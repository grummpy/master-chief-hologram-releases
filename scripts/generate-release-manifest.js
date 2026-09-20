'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..'); const pkg = require(path.join(root, 'package.json'));
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function bundleDigest(bundle) {
  const hash = crypto.createHash('sha256');
  const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach(entry => {
    const file = path.join(directory, entry.name); const relative = path.relative(bundle, file).replaceAll(path.sep, '/');
    if (entry.isDirectory()) walk(file); else if (entry.isFile()) { hash.update(`${relative}\0${fs.statSync(file).size}\0`); hash.update(fs.readFileSync(file)); }
  });
  walk(bundle); return hash.digest('hex');
}
function generateReleaseManifest({ bundle, output, revision } = {}) {
  const appBundle = path.resolve(bundle || path.join(root, 'dist', 'mac-arm64', `${pkg.build.productName}.app`)); const asar = path.join(appBundle, 'Contents', 'Resources', 'app.asar');
  if (!fs.existsSync(appBundle) || !fs.existsSync(asar)) throw new Error(`Packaged application is unavailable: ${appBundle}`);
  let commit = revision || 'unknown'; try { if (!revision) commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
  const files = [{ path: path.relative(root, asar), bytes: fs.statSync(asar).size, sha256: sha256(asar), kind: 'app-asar' }, { path: path.relative(root, appBundle), bytes: null, sha256: bundleDigest(appBundle), kind: 'app-bundle-tree' }];
  const manifest = { schemaVersion: 2, product: pkg.name, version: pkg.version, revision: commit, generatedAt: new Date().toISOString(), signing: { verified: false, notarized: false, evidence: 'External signing evidence is required.' }, files };
  const target = path.resolve(output || path.join(root, 'release', 'manifest.json')); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, JSON.stringify(manifest, null, 2)); return manifest;
}
function verifyReleaseManifest(manifest, bundle) {
  if (manifest?.schemaVersion !== 2) throw new Error('Unsupported release manifest schema.');
  const appBundle = path.resolve(bundle); const asar = path.join(appBundle, 'Contents', 'Resources', 'app.asar'); const expectedAsar = manifest.files.find(item => item.kind === 'app-asar'); const expectedBundle = manifest.files.find(item => item.kind === 'app-bundle-tree');
  if (!expectedAsar || expectedAsar.sha256 !== sha256(asar)) throw new Error('Packaged app.asar checksum mismatch.');
  if (!expectedBundle || expectedBundle.sha256 !== bundleDigest(appBundle)) throw new Error('Packaged application checksum mismatch.');
  return true;
}
if (require.main === module) {
  if (process.argv[2] === '--verify') {
    const manifestFile = path.resolve(process.argv[4] || path.join(root, 'release', 'manifest.json')); const bundle = process.argv[3] || path.join(root, 'dist', 'mac-arm64', `${pkg.build.productName}.app`);
    verifyReleaseManifest(JSON.parse(fs.readFileSync(manifestFile, 'utf8')), bundle); console.log('release manifest verification passed');
  } else { const manifest = generateReleaseManifest({ bundle: process.argv[2], output: process.argv[3] }); console.log(`release manifest: v${manifest.version} ${manifest.files.length} packaged artifacts`); }
}
module.exports = { generateReleaseManifest, verifyReleaseManifest, bundleDigest };
