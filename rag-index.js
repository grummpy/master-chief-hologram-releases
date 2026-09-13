const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SCHEMA_VERSION = 1, CHUNK_SIZE = 1200, OVERLAP = 160, MAX_RESULTS = 5, MAX_CONTEXT_CHARS = 7000;
function createRagIndex(filePath) {
  let state = { schemaVersion: SCHEMA_VERSION, documents: [], chunks: [] };
  try { const p = JSON.parse(fs.readFileSync(filePath, 'utf8')); if (Array.isArray(p.documents)) state = { schemaVersion: SCHEMA_VERSION, documents: p.documents, chunks: p.chunks || [] }; } catch (_) {}
  const save = () => { fs.mkdirSync(path.dirname(filePath), { recursive: true }); const t = `${filePath}.tmp`; fs.writeFileSync(t, JSON.stringify(state), { mode: 0o600 }); fs.renameSync(t, filePath); };
  function indexDocument(name, text) { const clean = String(text || '').slice(0, 200000); if (!clean.trim()) throw new Error('Document is empty.'); const id = crypto.createHash('sha256').update(`${name}\0${clean}`).digest('hex'); state.documents = state.documents.filter(d => d.id !== id && d.name !== name); state.chunks = state.chunks.filter(c => c.documentId !== id && c.name !== name); state.documents.push({ id, name: String(name).slice(0, 200), bytes: Buffer.byteLength(clean), indexedAt: new Date().toISOString() }); for (let start = 0, n = 0; start < clean.length; start += CHUNK_SIZE - OVERLAP, n++) { state.chunks.push({ id: `${id}:${n}`, documentId: id, name: String(name).slice(0, 200), content: clean.slice(start, start + CHUNK_SIZE) }); if (start + CHUNK_SIZE >= clean.length) break; } save(); return { id, chunks: state.chunks.filter(c => c.documentId === id).length }; }
  function search(query, options = {}) { const terms = [...new Set(String(query || '').toLowerCase().match(/[a-z0-9]{2,}/g) || [])]; const limit = Math.min(Number(options.limit) || MAX_RESULTS, MAX_RESULTS); return state.chunks.map(c => ({ ...c, score: terms.reduce((s, t) => s + (c.content.toLowerCase().split(t).length - 1), 0) })).filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(({ id, name, content, score }) => ({ id, name, content, score })); }
  function context(query) { let used = 0; return search(query).map(x => `--- ${x.name} ---\n${x.content}`).filter(part => { if (used + part.length > MAX_CONTEXT_CHARS) return false; used += part.length; return true; }).join('\n\n'); }
  return { indexDocument, search, context, stats: () => ({ schemaVersion: state.schemaVersion, documents: state.documents.length, chunks: state.chunks.length }) };
}
module.exports = { createRagIndex, SCHEMA_VERSION };
