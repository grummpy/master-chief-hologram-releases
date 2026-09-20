'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = require('docx');

function safeName(value) {
  const normalized = String(value || 'master-chief-report').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  return normalized || 'master-chief-report';
}

function requestedPages(value) {
  const text = String(value || '').toLowerCase();
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  const match = text.match(/\b(\d+|one|two|three|four|five)[- ]page\b/);
  return Math.min(5, Math.max(1, Number(match?.[1]) || words[match?.[1]] || 1));
}

function blocksFromMarkdown(markdown) {
  const blocks = [];
  for (const raw of String(markdown || '').replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/^\[PAGE BREAK\]$/i.test(line)) { blocks.push({ pageBreak: true }); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { blocks.push({ heading: heading[1].length, text: heading[2] }); continue; }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) { blocks.push({ bullet: true, text: bullet[1] }); continue; }
    blocks.push({ text: line.replace(/^\d+[.)]\s+/, '') });
  }
  return blocks;
}

function enforcePageBreaks(blocks, pages) {
  if (pages <= 1 || blocks.some(block => block.pageBreak)) return blocks;
  const result = [...blocks];
  for (let page = pages - 1; page >= 1; page--) {
    const index = Math.max(1, Math.floor((blocks.length * page) / pages));
    result.splice(index, 0, { pageBreak: true });
  }
  return result;
}

function paragraphFor(block) {
  if (block.pageBreak) return new Paragraph({ children: [new PageBreak()] });
  if (block.heading) return new Paragraph({
    heading: block.heading === 1 ? HeadingLevel.TITLE : block.heading === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    spacing: { before: block.heading === 1 ? 0 : 180, after: 100 },
    children: [new TextRun({ text: block.text, bold: true })]
  });
  return new Paragraph({
    bullet: block.bullet ? { level: 0 } : undefined,
    spacing: { after: 110, line: 276 },
    children: [new TextRun({ text: block.text, size: 22, font: 'Aptos' })]
  });
}

async function createDocxArtifact({ outputDir, title, markdown, pages = 1 }) {
  const blocks = enforcePageBreaks(blocksFromMarkdown(markdown), pages);
  if (!blocks.length) throw new Error('The provider returned no document content.');
  const document = new Document({
    creator: 'Master Chief Hologram', title: String(title || 'Master Chief Report'),
    description: 'Generated locally through the selected Master Chief provider route.',
    sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children: blocks.map(paragraphFor) }]
  });
  const bytes = await Packer.toBuffer(document);
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
  const filename = `${safeName(title)}-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.docx`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, bytes, { mode: 0o600 });
  return { filename, filePath, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
}

module.exports = { requestedPages, blocksFromMarkdown, createDocxArtifact };
