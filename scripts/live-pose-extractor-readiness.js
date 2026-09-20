'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createComfyUiClient } = require('../comfyui-client');

(async () => {
  const source = path.resolve(process.argv[2] || '');
  if (!fs.existsSync(source)) throw new Error('Pass a local reference photograph.');
  const root = path.resolve(__dirname, '..');
  const client = createComfyUiClient({
    baseUrl: process.env.COMFYUI_BASE_URL || 'http://192.168.4.31:8188',
    artifactDir: path.join(root, 'artifacts', 'pose-extractor-readiness'),
    timeoutMs: 10 * 60 * 1000
  });
  const capabilities = await client.capabilities();
  if (!capabilities.poseExtractor) throw new Error('No live DWPose/OpenPose extractor node is registered.');
  const uploaded = await client.uploadImage(source, `pose-extractor-${Date.now()}${path.extname(source) || '.png'}`);
  const workflow = {
    '1': { class_type: 'LoadImage', inputs: { image: uploaded.name } },
    '2': { class_type: 'DWPreprocessor', inputs: {
      image: ['1', 0], detect_hand: 'enable', detect_body: 'enable', detect_face: 'enable', resolution: 512,
      bbox_detector: 'yolox_l.onnx', pose_estimator: 'dw-ll_ucoco_384.onnx', scale_stick_for_xinsr_cn: 'disable'
    } },
    '3': { class_type: 'SaveImage', inputs: { images: ['2', 0], filename_prefix: 'MasterChief-PoseMap' } }
  };
  const queued = await client.submit(workflow);
  const history = await client.wait(queued.promptId);
  const artifacts = await client.download(history, queued.promptId);
  if (artifacts.length !== 1 || artifacts[0].bytes < 1000) throw new Error('Pose extraction returned no usable pose map.');
  process.stdout.write(`${JSON.stringify({ outcome: 'PASS', promptId: queued.promptId, source: path.basename(source), extractor: 'DWPreprocessor', providers: 'CPUExecutionProvider', artifacts }, null, 2)}\n`);
})().catch(error => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
