const fs = require('fs');
const path = require('path');
function createCredentialStore({ safeStorage, filePath, env = process.env } = {}) {
  const values = new Map();
  const available = Boolean(safeStorage?.isEncryptionAvailable?.());
  if (available && filePath && fs.existsSync(filePath)) { try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(filePath, 'utf8')))) values.set(k, safeStorage.decryptString(Buffer.from(v, 'base64'))); } catch {} }
  function persist() { if (!available || !filePath) return false; try { fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 }); const out = {}; for (const [k, v] of values) out[k] = safeStorage.encryptString(v).toString('base64'); fs.writeFileSync(filePath, JSON.stringify(out), { mode: 0o600 }); return true; } catch { return false; } }
  return { available, get: (k, e = k) => values.get(k) || (available ? '' : String(env[e] || '').trim()), set(k, v) { if (!available || typeof v !== 'string' || !v.trim()) return false; values.set(k, v.trim()); return persist(); }, migrate(k, e = k) { if (available && !values.has(k) && env[e]) { values.set(k, String(env[e]).trim()); persist(); return true; } return false; }, status: () => ({ state: available ? 'ready' : 'fallback', label: available ? 'macOS secure storage ready' : 'Environment credentials only' }) };
}
module.exports = { createCredentialStore };
