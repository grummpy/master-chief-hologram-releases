'use strict';

const crypto = require('crypto');

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_CHUNK_BYTES = 16 * 1024 * 1024;
const MAX_CHUNKS = 4096;

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function readTextChunk(type, data) {
  if (type === 'tEXt') {
    const split = data.indexOf(0);
    if (split < 1) return null;
    return { key: data.subarray(0, split).toString('latin1'), value: data.subarray(split + 1).toString('utf8') };
  }
  if (type === 'iTXt') {
    const split = data.indexOf(0);
    if (split < 1 || split + 2 >= data.length) return null;
    const key = data.subarray(0, split).toString('latin1');
    const compressed = data[split + 1];
    if (compressed !== 0) return null;
    let offset = split + 3;
    for (let index = 0; index < 2; index += 1) {
      const end = data.indexOf(0, offset);
      if (end < 0) return null;
      offset = end + 1;
    }
    return { key, value: data.subarray(offset).toString('utf8') };
  }
  return null;
}

function extractSettings(prompt) {
  const result = {};
  for (const node of Object.values(prompt || {})) {
    if (!node || typeof node !== 'object' || !node.inputs || typeof node.inputs !== 'object') continue;
    const inputs = node.inputs;
    if (node.class_type === 'CLIPTextEncode' && typeof inputs.text === 'string') {
      if (!result.positivePrompt) result.positivePrompt = inputs.text;
      else if (!result.negativePrompt) result.negativePrompt = inputs.text;
    }
    if (node.class_type === 'CheckpointLoaderSimple' && typeof inputs.ckpt_name === 'string') result.checkpoint = inputs.ckpt_name;
    if (node.class_type === 'VAELoader' && typeof inputs.vae_name === 'string') result.vae = inputs.vae_name;
    if (node.class_type === 'KSampler') {
      for (const key of ['seed', 'steps', 'cfg', 'sampler_name', 'scheduler', 'denoise']) if (inputs[key] !== undefined) result[key === 'sampler_name' ? 'sampler' : key] = inputs[key];
    }
    if (node.class_type === 'EmptyLatentImage') {
      for (const key of ['width', 'height', 'batch_size']) if (inputs[key] !== undefined) result[key === 'batch_size' ? 'batch' : key] = inputs[key];
    }
  }
  return result;
}

function parsePngWorkflowMetadata(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length > MAX_FILE_BYTES || bytes.length < 12 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  const text = {};
  let offset = 8;
  for (let count = 0; offset + 12 <= bytes.length && count < MAX_CHUNKS; count += 1) {
    const length = bytes.readUInt32BE(offset);
    if (length > MAX_CHUNK_BYTES || offset + 12 + length > bytes.length) break;
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    const entry = readTextChunk(type, bytes.subarray(offset + 8, offset + 8 + length));
    if (entry && ['prompt', 'workflow'].includes(entry.key) && entry.value.length <= MAX_CHUNK_BYTES) text[entry.key] = entry.value;
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  const prompt = parseJsonObject(text.prompt);
  const workflow = parseJsonObject(text.workflow);
  if (!prompt && !workflow) return null;
  return {
    available: true,
    prompt,
    workflow,
    settings: extractSettings(prompt),
    promptSha256: prompt ? crypto.createHash('sha256').update(text.prompt).digest('hex') : null,
    workflowSha256: workflow ? crypto.createHash('sha256').update(text.workflow).digest('hex') : null
  };
}

module.exports = { parsePngWorkflowMetadata, extractSettings };
