'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createComfyUiClient, cloneAndFillWorkflow } = require('../comfyui-client');
const { createWorkflowRegistry } = require('../workflow-registry');

const sourcePath = process.argv[2];
if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error('Usage: node scripts/live-identity-benchmark.js /absolute/path/to/face-reference.jpg');

const profiles = [
  { id: 'balanced', referenceStrength: 1, instantIdControlStrength: 0.82, instantIdNoise: 0.25 },
  { id: 'strict', referenceStrength: 1.15, instantIdControlStrength: 0.9, instantIdNoise: 0 },
  { id: 'strict-flex', referenceStrength: 1.05, instantIdControlStrength: 0.72, instantIdNoise: 0 }
];

(async () => {
  const root = path.resolve(__dirname, '..');
  const artifactDir = path.join(root, 'artifacts', 'identity-benchmark');
  const client = createComfyUiClient({ baseUrl: process.env.COMFYUI_BASE_URL || 'http://192.168.4.31:8188', artifactDir });
  const definition = createWorkflowRegistry(root).get('sdxl-instantid-v1');
  const capabilities = await client.capabilities();
  for (const node of definition.requiredNodes) if (!capabilities.availableNodes.includes(node)) throw new Error(`Missing live node: ${node}`);
  const uploaded = await client.uploadImage(sourcePath, `identity-benchmark-${Date.now()}${path.extname(sourcePath).toLowerCase() || '.jpg'}`);
  const seed = 759490139;
  const prompt = process.env.IDENTITY_PROMPT || 'cinematic full-body portrait of the same adult man from the identity reference as a legendary barbarian warrior, preserve his exact recognizable face, forehead, eyes, nose, beard shape and facial proportions, powerful muscular physique, long dark windswept warrior hair, rugged leather and fur armor, bronze bracers, massive broadsword, ancient stone ruins, dramatic mountain landscape, heroic stance, photorealistic detailed skin, epic sword-and-sorcery movie still';
  const negativePrompt = process.env.IDENTITY_NEGATIVE || 'different person, changed facial structure, generic model face, clean shaven, business suit, necktie, modern clothing, eyeglasses, duplicate person, extra limbs, malformed hands, distorted face, blurry, cartoon, text, watermark';
  const results = [];
  for (const profile of profiles) {
    const workflow = cloneAndFillWorkflow(require(definition.file), {
      prompt, negativePrompt, sourceImage: uploaded.name,
      checkpoint: 'Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors', seed,
      referenceStrength: profile.referenceStrength, instantIdControlStrength: profile.instantIdControlStrength,
      instantIdNoise: profile.instantIdNoise, controlStart: 0, controlEnd: 0.9,
      steps: 30, cfg: 5, sampler: 'dpmpp_2m', scheduler: 'karras', width: 768, height: 1024, batch: 1,
      outputPrefix: `MasterChief/identity/${profile.id}`
    });
    const queued = await client.submit(workflow);
    process.stderr.write(`QUEUED ${profile.id} ${queued.promptId}\n`);
    const history = await client.wait(queued.promptId, { timeoutMs: 600000 });
    const artifacts = await client.download(history, queued.promptId);
    if (!artifacts.length) throw new Error(`${profile.id} returned no artifact.`);
    results.push({ ...profile, promptId: queued.promptId, artifacts });
  }
  await client.freeMemory().catch(() => null);
  const report = { ready: true, source: path.resolve(sourcePath), workflow: definition.id, workflowSha256: definition.sha256, seed, prompt, negativePrompt, results };
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
})().catch(error => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
