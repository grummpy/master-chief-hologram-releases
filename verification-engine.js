'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function claimLedger(text = '') {
  return String(text).split(/(?<=[.!?])\s+/).filter(Boolean).map(statement => ({
    statement,
    type: /\b(assume|estimate|likely|approximately)\b/i.test(statement) ? 'assumption' : /\b(recommend|should|best)\b/i.test(statement) ? 'recommendation' : /\b(unknown|unverified|cannot confirm)\b/i.test(statement) ? 'unknown' : /\b(calculat|percent|\$|\d)\b/i.test(statement) ? 'calculation' : 'fact',
    evidenceRequired: !/\b(assume|recommend|unknown)\b/i.test(statement)
  }));
}

function sourceQuality(sources = []) {
  const normalized = sources.map(source => ({ url: String(source.url || ''), title: String(source.title || ''), authority: Number(source.authority || 0), publishedAt: source.publishedAt || null, supports: Array.isArray(source.supports) ? source.supports : [] }));
  const conflicts = [];
  const byClaim = new Map();
  for (const source of normalized) for (const claim of source.supports) { const items = byClaim.get(claim.id) || []; items.push({ source: source.url, value: claim.value }); byClaim.set(claim.id, items); }
  for (const [claimId, items] of byClaim) if (new Set(items.map(item => JSON.stringify(item.value))).size > 1) conflicts.push({ claimId, items });
  return { sources: normalized, conflicts, coverage: normalized.length ? normalized.reduce((sum, item) => sum + item.supports.length, 0) : 0, freshnessKnown: normalized.filter(item => item.publishedAt).length };
}

function evaluateCompletion({ objective = '', acceptance = [], output = '', steps = [], criticalErrors = [] } = {}) {
  const checks = [
    { id: 'objective', pass: Boolean(String(objective).trim()) },
    { id: 'output', pass: Boolean(String(output).trim()) },
    { id: 'steps', pass: steps.every(step => ['complete', 'skipped'].includes(step.status)) },
    { id: 'critical-errors', pass: criticalErrors.length === 0 },
    ...acceptance.map((item, index) => ({ id: `acceptance-${index + 1}`, requirement: String(item), pass: String(output).toLowerCase().includes(String(item).toLowerCase()) }))
  ];
  return { pass: checks.every(check => check.pass), score: Math.round((checks.filter(check => check.pass).length / Math.max(1, checks.length)) * 100), checks };
}

function validateArtifact(file) {
  const extension = path.extname(file).toLowerCase();
  const stat = fs.statSync(file);
  const signature = fs.readFileSync(file).subarray(0, 8);
  const zipBased = ['.docx', '.xlsx', '.pptx'].includes(extension);
  const validSignature = !zipBased || signature[0] === 0x50 && signature[1] === 0x4b;
  return { file, extension, size: stat.size, nonEmpty: stat.size > 0, validSignature, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), valid: stat.size > 0 && validSignature };
}

module.exports = { claimLedger, sourceQuality, evaluateCompletion, validateArtifact };
