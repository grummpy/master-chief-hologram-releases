'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePngWorkflowMetadata } = require('../png-workflow-metadata');

function chunk(type, data) {
  const body = Buffer.from(data);
  const header = Buffer.alloc(8); header.writeUInt32BE(body.length); header.write(type, 4, 4, 'ascii');
  return Buffer.concat([header, body, Buffer.alloc(4)]);
}

test('recovers exact ComfyUI prompt settings from bounded PNG metadata', () => {
  const prompt = { a: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'model.safetensors' } }, b: { class_type: 'CLIPTextEncode', inputs: { text: 'exact positive' } }, c: { class_type: 'CLIPTextEncode', inputs: { text: 'exact negative' } }, d: { class_type: 'KSampler', inputs: { seed: 42, steps: 31, cfg: 6.2, sampler_name: 'euler', scheduler: 'normal', denoise: .75 } }, e: { class_type: 'EmptyLatentImage', inputs: { width: 832, height: 1216, batch_size: 4 } } };
  const bytes = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('tEXt', Buffer.concat([Buffer.from('prompt\0'), Buffer.from(JSON.stringify(prompt))])), chunk('IEND', Buffer.alloc(0))]);
  const result = parsePngWorkflowMetadata(bytes);
  assert.deepEqual(result.settings, { checkpoint: 'model.safetensors', positivePrompt: 'exact positive', negativePrompt: 'exact negative', seed: 42, steps: 31, cfg: 6.2, sampler: 'euler', scheduler: 'normal', denoise: .75, width: 832, height: 1216, batch: 4 });
  assert.match(result.promptSha256, /^[a-f0-9]{64}$/);
});

test('rejects non-PNG and malformed metadata', () => {
  assert.equal(parsePngWorkflowMetadata(Buffer.from('not an image')), null);
});
