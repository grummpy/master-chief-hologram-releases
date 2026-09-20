'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function writeAtomic(file, state) { fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 }); const temp = `${file}.${process.pid}.tmp`; fs.writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 }); fs.renameSync(temp, file); }
function safeMessages(messages) { return (Array.isArray(messages) ? messages : []).slice(-200).filter(item => item && ['user','assistant','system'].includes(item.role)).map(item => ({ role: item.role, content: String(item.content || '').slice(0, 12000), at: item.at || new Date().toISOString() })); }
function createConversationStore(file) {
  let state; try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { state = { version: 1, threads: [], trash: [] }; }
  if (!Array.isArray(state.threads)) state.threads = []; if (!Array.isArray(state.trash)) state.trash = [];
  const save = () => writeAtomic(file, state); const find = id => state.threads.find(item => item.id === id);
  return {
    upsert(input = {}) { const id = String(input.id || crypto.randomUUID()); let thread = find(id); const messages = safeMessages(input.messages); if (!thread) { thread = { id, title: String(input.title || messages.find(item => item.role === 'user')?.content || 'Conversation').replace(/\s+/g, ' ').slice(0, 100), provider: String(input.provider || 'ollama'), pinned: false, archived: false, parentId: input.parentId || null, branchPoint: input.branchPoint ?? null, createdAt: new Date().toISOString(), messages: [] }; state.threads.unshift(thread); } thread.messages = messages; thread.provider = String(input.provider || thread.provider); thread.updatedAt = new Date().toISOString(); save(); return thread; },
    list(options = {}) { const query = String(options.query || '').toLowerCase(); return state.threads.filter(item => options.archived === undefined || item.archived === Boolean(options.archived)).filter(item => !query || item.title.toLowerCase().includes(query) || item.messages.some(message => message.content.toLowerCase().includes(query))).sort((a,b) => Number(b.pinned)-Number(a.pinned) || String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, Math.max(1, Math.min(200, Number(options.limit)||100))).map(item => ({ ...item, messages: options.includeMessages ? item.messages : undefined, messageCount: item.messages.length })); },
    get(id) { return find(String(id)) || null; },
    action(id, action, value) { const thread = find(String(id)); if (!thread) throw new Error('Conversation was not found.'); if (action === 'rename') thread.title = String(value || '').trim().slice(0,100) || thread.title; else if (action === 'pin') thread.pinned = Boolean(value); else if (action === 'archive') thread.archived = Boolean(value); else throw new Error('Unknown conversation action.'); thread.updatedAt = new Date().toISOString(); save(); return thread; },
    branch(id, messageIndex) { const source = find(String(id)); if (!source) throw new Error('Conversation was not found.'); const point = Math.max(0, Math.min(source.messages.length, Number(messageIndex) || source.messages.length)); return this.upsert({ title: `${source.title} · branch`, provider: source.provider, parentId: source.id, branchPoint: point, messages: source.messages.slice(0, point) }); },
    remove(id) { const index = state.threads.findIndex(item => item.id === String(id)); if (index < 0) throw new Error('Conversation was not found.'); const [thread] = state.threads.splice(index,1); state.trash.unshift({ ...thread, deletedAt: new Date().toISOString() }); state.trash = state.trash.slice(0,50); save(); return { deleted: true, id: thread.id, recoverable: true }; },
    restore(id) { const index = state.trash.findIndex(item => item.id === String(id)); if (index < 0) throw new Error('Deleted conversation was not found.'); const [thread] = state.trash.splice(index,1); delete thread.deletedAt; thread.updatedAt = new Date().toISOString(); state.threads.unshift(thread); save(); return thread; },
    clear() { const removed = state.threads.length + state.trash.length; state = { version: 1, threads: [], trash: [] }; save(); return { removed }; }
  };
}

module.exports = { createConversationStore, safeMessages };
