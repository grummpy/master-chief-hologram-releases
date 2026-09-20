const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// This is intentionally a local, dependency-free retrieval layer. The vector
// is a signed feature-hash projection, augmented with a small concept map. It
// is not an embedding model and never sends document text to a provider.
const SCHEMA_VERSION = 2;
const CHUNK_SIZE = 1200, OVERLAP = 160, MAX_RESULTS = 5, MAX_CONTEXT_CHARS = 7000, VECTOR_SIZE = 384;
const CONCEPTS = {
  audio: ['microphone', 'mic', 'recording', 'speech', 'transcription', 'voice'],
  microphone: ['audio', 'mic', 'recording', 'speech', 'voice'],
  transcription: ['transcribe', 'speech', 'audio', 'dictation', 'voice'],
  model: ['llm', 'ai', 'inference', 'provider'], llm: ['model', 'ai', 'inference', 'provider'],
  update: ['upgrade', 'release', 'version', 'deploy'], security: ['privacy', 'credential', 'permission', 'secret'],
  search: ['retrieve', 'retrieval', 'find', 'query'], document: ['file', 'attachment', 'text', 'markdown'],
};
function tokens(text) { return String(text || '').toLowerCase().match(/[a-z0-9]{2,}/g) || []; }
function hash(value) { let result = 2166136261; for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619); return result >>> 0; }
function vectorize(text) {
  const values = Object.create(null);
  for (const term of tokens(text)) {
    // Two expansion hops make pairs such as microphone <-> audio converge even
    // when a document uses an adjacent concept such as transcription.
    const related = new Set([term, ...(CONCEPTS[term] || [])]);
    for (const word of [...related]) for (const adjacent of CONCEPTS[word] || []) related.add(adjacent);
    for (const feature of [term, ...[...related].map(word => `semantic:${word}`)]) {
    const hashed = hash(feature), index = hashed % VECTOR_SIZE;
    values[index] = (values[index] || 0) + (feature === term ? 1 : 0.45) * (hashed & 1 ? 1 : -1);
  }
  }
  let magnitude = 0; for (const value of Object.values(values)) magnitude += value * value;
  return { values, magnitude: Math.sqrt(magnitude) };
}
function cosine(left, right) {
  if (!left?.magnitude || !right?.magnitude) return 0;
  let dot = 0; for (const [index, value] of Object.entries(left.values || {})) dot += value * (right.values?.[index] || 0);
  return Math.max(0, dot / (left.magnitude * right.magnitude));
}
function createRagIndex(filePath, { vectorizer = vectorize } = {}) {
  let state = { schemaVersion: SCHEMA_VERSION, documents: [], chunks: [] };
  try { const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')); if (Array.isArray(parsed.documents) && Array.isArray(parsed.chunks)) state = { ...state, ...parsed }; } catch (_) {}
  const save = () => { fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 }); const temporary = `${filePath}.tmp`; fs.writeFileSync(temporary, JSON.stringify(state), { mode: 0o600 }); fs.renameSync(temporary, filePath); };
  let migrated = state.schemaVersion !== SCHEMA_VERSION;
  for (const chunk of state.chunks) if (!chunk.vector) { chunk.vector = vectorizer(chunk.content); migrated = true; }
  state.schemaVersion = SCHEMA_VERSION;
  if (migrated) save();
  function indexDocument(name, text, options = {}) {
    const clean = String(text || '').slice(0, 200000); if (!clean.trim()) throw new Error('Document is empty.');
    const safeName = String(name || 'untitled').slice(0, 200); const id = crypto.createHash('sha256').update(`${safeName}\0${clean}`).digest('hex');
    state.documents = state.documents.filter(document => document.id !== id && document.name !== safeName); state.chunks = state.chunks.filter(chunk => chunk.documentId !== id && chunk.name !== safeName);
    const collection = String(options.collection || 'temporary').slice(0,100), scope = String(options.scope || 'chat').slice(0,100);
    const provenance = options.provenance && typeof options.provenance === 'object' ? { branch: String(options.provenance.branch || '').slice(0,120), revision: String(options.provenance.revision || '').slice(0,80), path: String(options.provenance.path || '').slice(0,500), sha256: String(options.provenance.sha256 || '').slice(0,64) } : null;
    state.documents.push({ id, name: safeName, bytes: Buffer.byteLength(clean), collection, scope, provenance, indexedAt: new Date().toISOString() });
    for (let start = 0, number = 0; start < clean.length; start += CHUNK_SIZE - OVERLAP, number++) { const content = clean.slice(start, start + CHUNK_SIZE); state.chunks.push({ id: `${id}:${number}`, documentId: id, name: safeName, collection, scope, provenance, chunk: number, content, vector: vectorizer(content) }); if (start + CHUNK_SIZE >= clean.length) break; }
    save(); return { id, chunks: state.chunks.filter(chunk => chunk.documentId === id).length };
  }
  function search(query, options = {}) {
    const queryTerms = [...new Set(tokens(query))], queryVector = vectorizer(query), limit = Math.min(Math.max(Number(options.limit) || MAX_RESULTS, 1), MAX_RESULTS);
    return state.chunks.filter(chunk => !options.collection || chunk.collection === options.collection).filter(chunk => !options.scope || chunk.scope === options.scope).map(chunk => { const content = chunk.content.toLowerCase(); const lexicalScore = queryTerms.reduce((score, term) => score + (content.split(term).length - 1), 0); const semanticScore = cosine(queryVector, chunk.vector); return { ...chunk, score: lexicalScore ? lexicalScore + semanticScore : semanticScore, lexicalScore, semanticScore }; })
      .filter(chunk => chunk.score > 0).sort((left, right) => right.score - left.score || right.semanticScore - left.semanticScore).slice(0, limit)
      .map(({ id, name, collection, scope, provenance, chunk, content, score, lexicalScore, semanticScore }) => ({ id, name, collection: collection || 'temporary', scope: scope || 'chat', provenance: provenance || null, chunk: Number.isInteger(chunk) ? chunk : Number(String(id).split(':').pop()) || 0, citation: `${name}#chunk-${Number.isInteger(chunk) ? chunk : Number(String(id).split(':').pop()) || 0}`, content, score: Number(score.toFixed(4)), lexicalScore, semanticScore: Number(semanticScore.toFixed(4)) }));
  }
  function removeDocument(name) {
    const safeName = String(name || '').slice(0, 200);
    const before = state.documents.length;
    state.documents = state.documents.filter(document => document.name !== safeName);
    state.chunks = state.chunks.filter(chunk => chunk.name !== safeName);
    if (state.documents.length !== before) save();
    return { removed: before - state.documents.length };
  }
  function clear() {
    const removed = { documents: state.documents.length, chunks: state.chunks.length };
    state = { schemaVersion: SCHEMA_VERSION, documents: [], chunks: [] };
    save();
    return removed;
  }
  function context(query) { let used = 0; return search(query).map(result => `--- ${result.name} ---\n${result.content}`).filter(part => { if (used + part.length > MAX_CONTEXT_CHARS) return false; used += part.length; return true; }).join('\n\n'); }
  return { indexDocument, removeDocument, clear, search, context, stats: () => ({ schemaVersion: state.schemaVersion, documents: state.documents.length, chunks: state.chunks.length, collections: [...new Set(state.documents.map(item => item.collection || 'temporary'))].sort(), retrieval: 'local-feature-vector+lexical' }) };
}
module.exports = { createRagIndex, vectorize, cosine, SCHEMA_VERSION };
