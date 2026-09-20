'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const officeParser = require('officeparser');

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 200000;
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'markdown', 'json', 'jsonl', 'csv', 'tsv', 'xml', 'html', 'htm', 'yaml', 'yml', 'js', 'jsx', 'ts', 'tsx', 'py', 'r', 'sql', 'css', 'scss', 'log', 'ini', 'toml']);
const OFFICE_EXTENSIONS = new Set(['pdf', 'docx', 'pptx', 'xlsx', 'odt', 'odp', 'ods', 'odg', 'rtf', 'epub']);

function safeFileName(value) {
  const name = path.basename(String(value || 'attachment')).replace(/[\u0000-\u001f]/g, '').slice(0, 180);
  if (!name) throw new Error('Attachment name is invalid.');
  return name;
}

async function ingestAttachment(payload = {}) {
  const name = safeFileName(payload.name);
  const bytes = Buffer.from(payload.bytes || []);
  if (!bytes.length) throw new Error('Attachment is empty.');
  if (bytes.length > MAX_ATTACHMENT_BYTES) throw new Error('Attachment exceeds the 25 MB local-ingestion limit.');
  const extension = path.extname(name).slice(1).toLowerCase();
  const mime = String(payload.type || 'application/octet-stream').slice(0, 120);
  const result = { name, bytes: bytes.length, extension, mime, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), text: '', parseStatus: 'metadata-only', warnings: [] };
  if (TEXT_EXTENSIONS.has(extension) || mime.startsWith('text/')) {
    result.text = bytes.toString('utf8').replace(/\u0000/g, '').slice(0, MAX_EXTRACTED_CHARS);
    result.parseStatus = result.text.trim() ? 'parsed' : 'metadata-only';
    return result;
  }
  if (OFFICE_EXTENSIONS.has(extension)) {
    try {
      const ast = await officeParser.parseOffice(bytes, { fileType: extension, extractAttachments: false, ocr: false });
      const converted = await ast.to('text', { textConfig: { preserveLayout: false, renderNotes: true } });
      result.text = String(converted?.value || '').slice(0, MAX_EXTRACTED_CHARS);
      result.parseStatus = result.text.trim() ? 'parsed' : 'metadata-only';
      result.warnings = (ast.warnings || []).map(value => String(value)).slice(0, 10);
    } catch (error) {
      result.parseStatus = 'parse-failed';
      result.warnings = [String(error.message || error).slice(0, 240)];
    }
  }
  return result;
}

module.exports = { ingestAttachment, MAX_ATTACHMENT_BYTES, MAX_EXTRACTED_CHARS, TEXT_EXTENSIONS, OFFICE_EXTENSIONS };
