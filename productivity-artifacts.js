'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ExcelJS = require('exceljs');
const pptxgen = require('pptxgenjs');

function safeName(value, fallback = 'master-chief-artifact') {
  return String(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || fallback;
}
function artifactResult(filePath) {
  const bytes = fs.readFileSync(filePath);
  return { filename: path.basename(filePath), filePath, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
}
function normalizeRows(columns, rows) {
  return (Array.isArray(rows) ? rows : []).slice(0, 5000).map(row => Array.isArray(row) ? columns.map((_, index) => row[index] ?? '') : columns.map(column => row?.[column] ?? ''));
}
async function createSpreadsheet({ outputDir, spec }) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'Master Chief Hologram'; workbook.created = new Date();
  const sheets = Array.isArray(spec.sheets) && spec.sheets.length ? spec.sheets.slice(0, 12) : [{ name: 'Report', columns: ['Result'], rows: [[spec.summary || 'Generated workbook']] }];
  for (const item of sheets) {
    const sheet = workbook.addWorksheet(String(item.name || 'Sheet').slice(0, 31), { views: [{ state: 'frozen', ySplit: 1 }] });
    const columns = (Array.isArray(item.columns) ? item.columns : []).slice(0, 50).map(value => String(value));
    if (!columns.length) columns.push('Value');
    sheet.columns = columns.map(header => ({ header, key: header, width: Math.min(42, Math.max(12, header.length + 4)) }));
    for (const row of normalizeRows(columns, item.rows)) sheet.addRow(row);
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: columns.length } };
    sheet.getRow(1).eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123B5D' } }; cell.alignment = { vertical: 'middle' }; });
    sheet.getRow(1).height = 24;
    for (let row = 2; row <= sheet.rowCount; row++) if (row % 2 === 0) sheet.getRow(row).eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF6FA' } }; });
  }
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
  const filePath = path.join(outputDir, `${safeName(spec.title, 'analysis-workbook')}-${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(filePath); return artifactResult(filePath);
}
async function createPresentation({ outputDir, spec }) {
  const deck = new pptxgen(); deck.layout = 'LAYOUT_WIDE'; deck.author = 'Master Chief Hologram'; deck.subject = String(spec.title || 'Presentation'); deck.title = String(spec.title || 'Presentation'); deck.company = 'Private Creative Command'; deck.lang = 'en-US';
  deck.defineSlideMaster({ title: 'MASTER', background: { color: '061426' }, objects: [{ rect: { x: 0, y: 0, w: 13.333, h: .12, fill: { color: '32D5FF' }, line: { color: '32D5FF' } } }, { text: { text: 'MASTER CHIEF · LOCAL INTELLIGENCE', options: { x: .55, y: 7.08, w: 5.5, h: .2, fontFace: 'Aptos', fontSize: 8, color: '66CDE7', margin: 0 } } }], slideNumber: { x: 12.2, y: 7.03, color: '66CDE7', fontSize: 9 } });
  const slides = Array.isArray(spec.slides) && spec.slides.length ? spec.slides.slice(0, 30) : [{ title: spec.title || 'Presentation', bullets: [spec.summary || 'Generated locally'] }];
  slides.forEach((item, index) => { const slide = deck.addSlide('MASTER'); slide.addText(String(item.title || `Slide ${index + 1}`), { x: .65, y: .45, w: 12, h: .6, fontFace: 'Aptos Display', fontSize: 28, bold: true, color: 'EAFBFF', margin: 0, breakLine: false }); const bullets = (Array.isArray(item.bullets) ? item.bullets : []).slice(0, 8).map(value => ({ text: String(value), options: { bullet: { indent: 18 }, hanging: 5, breakLine: true } })); slide.addText(bullets.length ? bullets : [{ text: String(item.body || ''), options: {} }], { x: .85, y: 1.45, w: 11.65, h: 4.9, fontFace: 'Aptos', fontSize: 20, color: 'D4EAF2', breakLine: true, valign: 'mid', margin: .08, paraSpaceAfterPt: 14, fit: 'shrink' }); if (item.takeaway) slide.addText(String(item.takeaway), { x: .85, y: 6.45, w: 11.65, h: .42, fontSize: 13, bold: true, color: '58E6B0', margin: .06, fill: { color: '0C2D3D', transparency: 8 }, line: { color: '1D6178' } }); });
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
  const filePath = path.join(outputDir, `${safeName(spec.title, 'presentation')}-${Date.now()}.pptx`); await deck.writeFile({ fileName: filePath }); return artifactResult(filePath);
}
function createCodeArtifact({ outputDir, title, language, content }) {
  const normalized = String(language || '').toLowerCase(); const extension = normalized === 'r' ? 'R' : normalized === 'sql' ? 'sql' : 'py';
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 }); const filePath = path.join(outputDir, `${safeName(title, `${extension}-analysis`)}-${Date.now()}.${extension}`);
  fs.writeFileSync(filePath, String(content || ''), { mode: 0o600 }); return artifactResult(filePath);
}

module.exports = { createSpreadsheet, createPresentation, createCodeArtifact };
