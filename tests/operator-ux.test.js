'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'renderer.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const referenceStudio = fs.readFileSync(path.join(root, 'reference-studio.js'), 'utf8');

test('G3 operator controls expose autocomplete, spellcheck, archive, and progress', () => {
  assert.match(html, /id="prompt" spellcheck="true"/);
  assert.match(html, /id="autocompleteList"/);
  assert.match(html, /id="archiveBtn"/);
  assert.match(html, /id="generationStatus"/);
  assert.match(renderer, /showGenerationStatus/);
});

test('slash autocomplete never traps prompt editing', () => {
  assert.match(renderer, /e\.key==='Backspace'\|\|e\.key==='Delete'/);
  const editEscape = renderer.match(/if\(e\.key==='Backspace'\|\|e\.key==='Delete'\)\{([^}]*)\}/)?.[1] || '';
  assert.match(editEscape, /closeAutocomplete\(\)/);
  assert.doesNotMatch(editEscape, /preventDefault/);
});

test('Clear purges all conversation history and local retrieval traces', () => {
  assert.match(renderer, /Object\.keys\(histories\)\.forEach/);
  assert.match(renderer, /localStorage\.clear\(\)/);
  assert.match(renderer, /clearPrivateHistory/);
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(main, /clear-private-history/);
  assert.match(main, /clearStorageData/);
  assert.match(main, /ragIndex\.clear\(\)/);
  assert.match(main, /conversationsClearedAt/);
  assert.match(main, /privacy-receipt-migration/);
  assert.match(main, /initializePrivacyState\(\)/);
  assert.match(renderer, /Clear Chat/);
});

test('Clear All removes generated media lineage while preserving credentials and settings', () => {
  assert.match(html, /id="clearAllBtn"/);
  assert.match(renderer, /purgePrivateActivity\(true\)/);
  assert.match(renderer, /PRIVATE_PREFERENCE_KEYS/);
  assert.match(renderer, /clearPrivateHistory\(includeMedia\)/);
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(main, /mediaJobLedger\.clear\(\)/);
  assert.match(main, /referenceStudio\.clear\(\)/);
  assert.match(main, /recordPrivacyClear\(includeMedia\)/);
  assert.match(renderer, /restorePrivateHistory/);
  assert.match(main, /fs\.rmSync\(path\.join\(generatedArtifactDir, entry\.name\)/);
  assert.doesNotMatch(main.slice(main.indexOf("secureHandle('clear-private-history'"), main.indexOf("secureHandle('open-artifact'")), /credentials|connector-settings|tool-approvals/);
});

test('natural-language ComfyUI prompt authoring fills both prompt fields', () => {
  assert.match(renderer, /isComfyPromptAuthoringRequest/);
  assert.match(renderer, /intent:'comfy-prompt'/);
  assert.match(renderer, /applyComfyPromptPair/);
  assert.match(fs.readFileSync(path.join(root, 'autocomplete.js'), 'utf8'), /\/prompt /);
});

test('workspace shell exposes protected Projects, right-side previews, and connector setup', () => {
  assert.match(html, /id="filesViewBtn"/);
  assert.match(html, /id="projectTree"/);
  assert.match(html, /Saved Projects survive Clear and Clear All/);
  assert.match(html, /id="previewTabBtn"/);
  assert.match(html, /id="activityTabBtn"/);
  assert.match(html, /id="connectorSetup"/);
  assert.match(renderer, /saveArtifactToProject/);
  assert.match(renderer, /refreshProjects/);
  assert.match(html, /id="pullRequestsNavBtn"/);
  assert.match(html, /id="scheduledNavBtn"/);
  assert.match(html, /id="pluginsNavBtn"/);
  assert.match(html, /id="exploreNavBtn"/);
  assert.match(css, /left-panel-view\[hidden\].*display:none!important/);
  assert.match(renderer, /archiveCurrentThread/);
});

test('Systems and connector status rows open preselected credential setup', () => {
  assert.match(renderer, /SETUP_BY_PROVIDER/);
  assert.match(renderer, /SETUP_BY_CONNECTOR/);
  assert.match(renderer, /openConnectorSetup\(setupId\)/);
  for (const provider of ['gemini','gmail','cursor','suno','openai','xai','huggingface','github','comfyui','elevenlabs']) {
    assert.match(renderer, new RegExp(`['"]?${provider}['"]?`));
  }
  assert.match(html, /id="connectorSecretLabel"/);
  assert.match(renderer, /secretRequired/);
  assert.match(css, /provider-setup label\[hidden\].*display:none!important/);
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(main, /ComfyUI private worker/);
  assert.match(main, /candidate\.health\(\)/);
});

test('Runtime Center exposes live evidence and confirmed fixed worker controls', () => {
  for (const id of ['runtimeCenterBtn','runtimeCenter','runtimeCenterGrid','runtimeCheckpointList','runtimeRefreshBtn','runtimeOpenBtn','runtimeConfigureBtn','runtimeRestartBtn','gamingModeBtn','runtimeResumeBtn','runtimeReadinessBtn','runtimeReadinessList']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(renderer, /getComfyUiRuntimeStatus/);
  assert.match(renderer, /queue\.running/);
  assert.match(renderer, /vramFree/);
  assert.match(renderer, /confirm\(`/);
  assert.match(renderer, /controlComfyUiRuntime/);
  assert.match(renderer, /getOperationalReadiness/);
  const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(preload, /operational-readiness/);
  assert.match(main, /secureHandle\('operational-readiness'/);
  assert.match(main, /windowsWorkerControl\(\)\.status\(\)/);
});

test('Scheduled workspace creates and manages durable local reminders', () => {
  for (const id of ['schedulerSetup','schedulerTitle','schedulerMessage','schedulerDueAt','schedulerRepeat']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(renderer, /renderScheduledJobs/);
  assert.match(renderer, /scheduledJobAction/);
  assert.match(renderer, /createScheduledJob/);
  const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(preload, /scheduler-list/);
  assert.match(main, /secureHandle\('scheduler-create'/);
  assert.match(main, /new Notification/);
  assert.match(html, /id="monitorTarget"/);
  assert.match(renderer, /createMonitor/);
  assert.match(main, /runMonitorTick/);
});

test('personal hologram removes the local-display banner', () => {
  assert.doesNotMatch(renderer, /Personal · local display/);
  assert.match(css, /data-persona-view=personal.*persona-badge/);
});

test('media controls expose explicit prompts, upscale, and Reference Studio', () => {
  assert.match(html, /id="positivePrompt"/);
  assert.match(html, /id="negativePrompt"/);
  assert.match(html, /id="referenceStudioBtn"/);
  assert.match(renderer, /kind:'upscale'/);
  assert.match(html, /id="mediaVae"/);
  assert.match(renderer, /UltraSharp Safe 2×/);
  assert.match(renderer, /ultrasharp-upscale-v1/);
  assert.ok(fs.existsSync(path.join(root, 'workflows', 'image-upscale-api.json')));
});

test('blank media seed remains random instead of becoming seed zero', () => {
  const renderer = fs.readFileSync(path.join(root, 'renderer.js'), 'utf8');
  assert.match(renderer, /if\(raw===undefined\|\|raw===null\|\|raw==='\'\)return undefined/);
  assert.doesNotMatch(renderer, /const value=Number\(\$\(id\)\?\.value\)/);
});

test('major revision overrides conservative panel denoise and retains source lineage', () => {
  const renderer = fs.readFileSync(path.join(root, 'renderer.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(renderer, /parameters\.denoise=revisionStrength/);
  assert.match(renderer, /sourceArtifact:isRevision\?activeCreativeSession\.artifact\.path/);
  assert.match(renderer, /contract==='rebuild'\)parameters\.seed=undefined/);
  assert.match(main, /requireChanged: \['revision', 'rebuild'\]\.includes\(contract\)/);
  assert.match(fs.readFileSync(path.join(root, 'image-output-validator.js'), 'utf8'), /ComfyUI returned the unchanged source image/);
});

test('Reference Studio exposes hierarchy, review, comparison, queue, and runtime controls', () => {
  for (const id of ['mediaWorkflow','mediaEngineHint','referenceProjectSelect','referenceSubjectSelect','referenceSheetSelect','referenceContactSheet','referenceComparison','runReferenceQueue','cancelReferenceQueue','resumeReferenceQueue','clearReferenceQueue','closeReferenceRuntime','openComfyDesignStudio','shotReferenceStrength','shotDenoise','shotReferenceMode','clearActiveReference','newCleanReferenceDraft','identityLockPreset','sceneCoachAdvice','referencePreflight','referencePreflightPrompt','referencePreflightNegative','shotSeed','shotSampler','shotScheduler','shotSteps','shotCfg','shotWidth','shotHeight','shotBatch','exploreFourVariants','shotControlMode','shotControlnet','shotControlStrength','shotControlStart','shotControlEnd']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(referenceStudio, /button\.id='extractPoseMap'/);
  assert.match(referenceStudio, /kind: 'posemap'/);
  assert.match(referenceStudio, /onReferenceQueueEvent/);
  assert.match(referenceStudio, /saveReferenceVariant/);
  assert.match(referenceStudio, /clean generation/);
  assert.match(referenceStudio, /preflightReferenceShot/);
  assert.match(referenceStudio, /Confirm add to queue/);
  assert.match(referenceStudio, /Identity Lock loaded from the verified InstantID test/);
  assert.match(referenceStudio, /Compare source/);
  assert.match(referenceStudio, /automatic pose extraction not installed/);
  const client = fs.readFileSync(path.join(root, 'comfyui-client.js'), 'utf8');
  assert.match(client, /poseExtractorNodes/);
  assert.match(client, /qwenImage21/);
  assert.match(referenceStudio, /Qwen-Image 2\.1 engine support detected/);
  for (const id of ['shotIdentityReference','shotStyleReference','shotPoseReference','shotCompositionReference','shotDepthReference','shotLightingReference']) assert.match(referenceStudio, new RegExp(id));
});

test('live pose extractor gate produces an auditable prepared map', () => {
  const script = fs.readFileSync(path.join(root, 'scripts', 'live-pose-extractor-readiness.js'), 'utf8');
  assert.match(script, /DWPreprocessor/);
  assert.match(script, /MasterChief-PoseMap/);
  assert.match(script, /detect_hand: 'enable'/);
  assert.match(script, /CPUExecutionProvider/);
});

test('Ollama Command Center exposes native generation and agent controls', () => {
  for (const id of ['ollamaControls','ollamaMode','ollamaThink','ollamaFormat','ollamaTemperature','ollamaTopP','ollamaContext','ollamaMaxTokens','ollamaSeed','ollamaKeepAlive','ollamaRefreshBtn','ollamaEvaluateBtn','ollamaEvaluationStatus','ollamaUnloadBtn']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(renderer, /runOllamaAgent/);
  assert.match(renderer, /stream:p==='ollama'/);
  assert.match(renderer, /renderOllamaMetrics/);
});

test('explicit report requests create downloadable Word artifacts', () => {
  assert.match(renderer, /function isDocumentRequest/);
  assert.match(renderer, /window\.masterChief\.createDocument/);
  assert.match(renderer, /Word document/);
  assert.match(renderer, /aria-label.*artifactName/);
  const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(preload, /create-document/);
  assert.match(main, /secureHandle\('create-document'/);
  assert.ok(fs.existsSync(path.join(root, 'document-generator.js')));
});

test('productivity artifact routes and universal attachment ingestion are wired', () => {
  assert.match(renderer, /function productivityKind/);
  assert.match(renderer, /createProductivityArtifact/);
  assert.match(renderer, /ingestAttachment/);
  assert.match(renderer, /addAttachmentFiles/);
  assert.match(html, /id="fileInput" class="sr-only" type="file" multiple/);
  const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(preload, /create-productivity-artifact/);
  assert.match(preload, /ingest-attachment/);
  assert.match(main, /secureHandle\('create-productivity-artifact'/);
  assert.match(main, /secureHandle\('ingest-attachment'/);
});
