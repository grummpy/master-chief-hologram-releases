'use strict';

(() => {
  const get = id => document.getElementById(id);
  const dialog = get('referenceStudio');
  if (!dialog || !window.masterChief?.referenceStudioState) return;
  let state = { schemaVersion: 2, projects: [] }, project = null, subject = null, sheet = null, activeQueueId = null;
  let reviewedShot = null;
  const comparison = new Set();
  const ids = shotId => ({ projectId: project?.id, subjectId: subject?.id, sheetId: sheet?.id, ...(shotId ? { shotId } : {}) });
  const selectValue = (id, fallback = '') => get(id)?.value || fallback;
  const shotTextFields = ['shotTitle','shotPositive','shotNegative','shotPose','shotEnvironment','shotCamera','shotLighting','shotContinuityLocks'];

  function shotPayload() {
    return {
      title: get('shotTitle').value, positivePrompt: get('shotPositive').value, negativePrompt: get('shotNegative').value,
      referenceMode: get('shotReferenceMode').value, referenceArtifact: get('shotReferenceArtifact').value,
      controlMode: get('shotControlMode').value, controlnet: get('shotControlnet').value,
      controlStrength: Number(get('shotControlStrength').value), controlStart: Number(get('shotControlStart').value), controlEnd: Number(get('shotControlEnd').value),
      pose: get('shotPose').value, environment: get('shotEnvironment').value, camera: get('shotCamera').value, lighting: get('shotLighting').value,
      model: get('shotModel').value, workflow: get('shotWorkflow').value,
      referenceStrength: Number(get('shotReferenceStrength').value), denoise: Number(get('shotDenoise').value),
      seed: get('shotSeed').value ? Number(get('shotSeed').value) : null, sampler: get('shotSampler').value, scheduler: get('shotScheduler').value,
      steps: Number(get('shotSteps').value), cfg: Number(get('shotCfg').value), width: Number(get('shotWidth').value), height: Number(get('shotHeight').value), batch: Number(get('shotBatch').value),
      continuityLocks: get('shotContinuityLocks').value, status: 'queued'
    };
  }

  function invalidatePreflight() {
    reviewedShot = null;
    get('referencePreflight').hidden = true;
    get('addReferenceShot').textContent = 'Review job';
  }

  function renderPreflight(result, signature) {
    const values = [
      ['Contract', result.contract], ['Reference mode', result.referenceMode], ['Reference', result.source?.path || 'none'],
      ['Reference SHA-256', result.source?.sha256 || 'none'], ['Workflow', `${result.workflow.id} · ${result.workflow.version}`],
      ['Workflow SHA-256', result.workflow.sha256], ['Checkpoint', result.checkpoint],
      ['Sampling', `${result.parameters.sampler} / ${result.parameters.scheduler} · ${result.parameters.steps} steps · CFG ${result.parameters.cfg}`],
      ['Canvas', `${result.parameters.width}×${result.parameters.height} · batch ${result.parameters.batch}`],
      ['Revision', `denoise ${result.parameters.denoise} · reference strength ${result.parameters.referenceStrength}`], ['Seed', result.parameters.seed]
      ,['Reference purpose', result.parameters.controlMode === 'pose' ? `prepared pose map · ${result.parameters.controlnet} · strength ${result.parameters.controlStrength} · ${result.parameters.controlStart}–${result.parameters.controlEnd}` : 'visual image revision']
      ,['What changes', result.changePlan.changes.join(' · ') || 'Only the main positive prompt']
      ,['What stays locked', result.changePlan.locks.join(' · ') || 'No explicit continuity locks']
    ];
    const grid = get('referencePreflightGrid'); grid.replaceChildren();
    for (const [label, value] of values) { const term = document.createElement('dt'); term.textContent = label; const detail = document.createElement('dd'); detail.textContent = value; grid.append(term, detail); }
    get('referencePreflightPrompt').textContent = result.effectivePrompt;
    get('referencePreflightNegative').textContent = result.negativePrompt || '(empty)';
    get('referencePreflightState').textContent = 'Ready for confirmation';
    get('referencePreflight').hidden = false;
    reviewedShot = { signature, result };
    get('addReferenceShot').textContent = 'Confirm add to queue';
  }

  function setReferenceMode(mode = 'approved') {
    get('shotReferenceMode').value = mode;
    const selected = mode === 'selected';
    get('shotReferenceArtifact').disabled = !selected;
    get('shotReferenceStrength').disabled = mode === 'none';
  }

  function resetShotEditor({ cleanReference = false } = {}) {
    shotTextFields.forEach(id => { get(id).value = ''; });
    get('shotReferenceArtifact').value = '';
    get('shotControlMode').value = 'revision';
    get('shotWorkflow').value = '';
    get('shotModel').value = '';
    get('shotReferenceStrength').value = '0.75';
    get('shotReferenceStrengthValue').value = '0.75';
    get('shotDenoise').value = '0.84';
    get('shotDenoiseValue').value = '0.84';
    get('shotSeed').value = '';
    get('shotSampler').value = 'dpmpp_2m'; get('shotScheduler').value = 'karras'; get('shotSteps').value = '28'; get('shotCfg').value = '6.5';
    get('shotWidth').value = '768'; get('shotHeight').value = '1024'; get('shotBatch').value = '1';
    get('shotControlnet').value = 'OpenPoseXL2.safetensors'; get('shotControlStrength').value = '1'; get('shotControlStart').value = '0'; get('shotControlEnd').value = '1';
    setReferenceMode(cleanReference ? 'none' : 'approved');
    invalidatePreflight();
  }

  function loadShotEditor(shot) {
    get('shotTitle').value = shot.title || '';
    get('shotPositive').value = shot.positivePrompt || '';
    get('shotNegative').value = shot.negativePrompt || '';
    get('shotReferenceArtifact').value = shot.referenceArtifact || '';
    get('shotControlMode').value = shot.controlMode || 'revision';
    get('shotPose').value = shot.pose || '';
    get('shotEnvironment').value = shot.environment || '';
    get('shotCamera').value = shot.camera || '';
    get('shotLighting').value = shot.lighting || '';
    get('shotModel').value = shot.model || '';
    get('shotWorkflow').value = shot.workflow || '';
    get('shotReferenceStrength').value = shot.referenceStrength ?? .75;
    get('shotReferenceStrengthValue').value = shot.referenceStrength ?? .75;
    get('shotDenoise').value = shot.denoise ?? .84;
    get('shotDenoiseValue').value = shot.denoise ?? .84;
    get('shotSeed').value = shot.seed || '';
    get('shotSampler').value = shot.sampler || 'dpmpp_2m'; get('shotScheduler').value = shot.scheduler || 'karras'; get('shotSteps').value = shot.steps || 28; get('shotCfg').value = shot.cfg ?? 6.5;
    get('shotWidth').value = shot.width || 768; get('shotHeight').value = shot.height || 1024; get('shotBatch').value = shot.batch || 1;
    get('shotControlnet').value = shot.controlnet || 'OpenPoseXL2.safetensors'; get('shotControlStrength').value = shot.controlStrength ?? 1; get('shotControlStart').value = shot.controlStart ?? 0; get('shotControlEnd').value = shot.controlEnd ?? 1;
    get('shotContinuityLocks').value = shot.continuityLocks || '';
    setReferenceMode(shot.referenceMode || (shot.referenceArtifact ? 'selected' : 'approved'));
    invalidatePreflight();
  }

  function chooseCurrent() {
    const savedProject = localStorage.getItem('mcReferenceProject');
    project = state.projects.find(item => item.id === selectValue('referenceProjectSelect', savedProject)) || state.projects.find(item => item.id === savedProject) || state.projects[0] || null;
    const savedSubject = localStorage.getItem('mcReferenceSubject');
    subject = project?.subjects.find(item => item.id === selectValue('referenceSubjectSelect', savedSubject)) || project?.subjects.find(item => item.id === savedSubject) || project?.subjects[0] || null;
    const savedSheet = localStorage.getItem('mcReferenceSheet');
    sheet = subject?.referenceSheets.find(item => item.id === selectValue('referenceSheetSelect', savedSheet)) || subject?.referenceSheets.find(item => item.id === savedSheet) || subject?.referenceSheets[0] || null;
  }

  function renderSelectors() {
    const projectSelect = get('referenceProjectSelect');
    projectSelect.replaceChildren(...state.projects.map(item => new Option(item.title, item.id)), new Option('+ New project', '__new__'));
    projectSelect.value = project?.id || '__new__';
    const subjectSelect = get('referenceSubjectSelect');
    subjectSelect.replaceChildren(...(project?.subjects || []).map(item => new Option(item.name, item.id)), new Option('+ New subject', '__new__'));
    subjectSelect.value = subject?.id || '__new__';
    const sheetSelect = get('referenceSheetSelect');
    sheetSelect.replaceChildren(...(subject?.referenceSheets || []).map(item => new Option(item.title, item.id)), new Option('+ New sheet', '__new__'));
    sheetSelect.value = sheet?.id || '__new__';
  }

  function fillHierarchy() {
    get('referenceProjectTitle').value = project?.title || 'Commander Nova project';
    get('referenceSubjectName').value = subject?.name || 'Commander Nova';
    get('referenceSheetTitle').value = sheet?.title || 'Primary reference sheet';
    get('referenceAppearanceNotes').value = sheet?.appearanceNotes || subject?.appearanceNotes || '';
    get('referencePalette').value = sheet?.palette || subject?.palette || '';
    get('referenceIdentityLock').value = sheet?.continuityLocks || subject?.continuityLocks || '';
  }

  async function previewNode(artifact, alt) {
    const preview = await window.masterChief.previewArtifact(artifact);
    const image = document.createElement('img'); image.alt = alt; image.src = preview.dataUrl; return image;
  }

  async function saveView(view, patch) {
    await window.masterChief.saveReferenceView({ ...ids(), view: { ...view, ...patch, id: view.id } });
    await loadState();
  }

  async function renderContactSheet() {
    const contact = get('referenceContactSheet'); contact.replaceChildren();
    for (const view of sheet?.approvedViews || []) {
      const card = document.createElement('article'); card.className = `reference-view status-${view.status}`;
      try { card.append(await previewNode(view.artifact, view.label)); } catch { const missing = document.createElement('span'); missing.textContent = 'Preview unavailable'; card.append(missing); }
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = comparison.has(view.id); checkbox.setAttribute('aria-label', `Select ${view.label} for comparison`); checkbox.onchange = () => { checkbox.checked ? comparison.add(view.id) : comparison.delete(view.id); get('comparisonCount').textContent = `${comparison.size} selected`; };
      const label = document.createElement('strong'); label.textContent = view.label;
      const status = document.createElement('small'); status.textContent = `${view.view || 'view'} · ${view.status}`;
      const annotation = document.createElement('small'); annotation.textContent = view.annotation || 'No annotation';
      const actions = document.createElement('div'); actions.className = 'reference-view-actions';
      const promote = document.createElement('button'); promote.textContent = 'Promote'; promote.onclick = () => saveView(view, { status: 'approved' });
      const reject = document.createElement('button'); reject.textContent = 'Reject'; reject.onclick = () => saveView(view, { status: 'rejected' });
      const annotate = document.createElement('button'); annotate.textContent = 'Annotate'; annotate.onclick = () => { const value = prompt('Reference annotation', view.annotation || ''); if (value !== null) saveView(view, { annotation: value }); };
      const branch = document.createElement('button'); branch.textContent = 'Branch'; branch.onclick = async () => { await window.masterChief.saveReferenceView({ ...ids(), view: { artifact: view.artifact, label: `${view.label} branch`, view: view.view, status: 'candidate', annotation: view.annotation, parentViewId: view.id } }); await loadState(); };
      actions.append(promote, reject, annotate, branch); card.append(checkbox, label, status, annotation, actions); contact.append(card);
    }
    if (!contact.children.length) contact.textContent = 'No reference views yet. Drop or import images to begin the contact sheet.';
    get('comparisonCount').textContent = `${comparison.size} selected`;
  }

  async function showComparison(limit) {
    const chosen = (sheet?.approvedViews || []).filter(view => comparison.has(view.id)).slice(0, limit);
    if (chosen.length !== limit) { get('referenceQueueStatus').textContent = `Select exactly ${limit} reference views first.`; return; }
    const box = get('referenceComparison'); box.hidden = false; box.className = `reference-comparison compare-${limit}`; box.replaceChildren();
    for (const view of chosen) { const item = document.createElement('figure'); try { item.append(await previewNode(view.artifact, view.label)); } catch {} const caption = document.createElement('figcaption'); caption.textContent = `${view.label} · ${view.status}`; item.append(caption); box.append(item); }
  }

  async function loadArtifacts() {
    const [artifacts, catalog] = await Promise.all([window.masterChief.listGeneratedMedia(200), window.masterChief.getMediaCatalog()]);
    const select = get('shotReferenceArtifact'), prior = select.value;
    select.replaceChildren(new Option('Choose an artifact', ''), ...artifacts.filter(item => /\.(png|jpe?g|webp)$/i.test(item.filename)).map(item => new Option(item.filename, item.path))); select.value = prior;
    const model = get('shotModel'), selectedModel = model.value; model.replaceChildren(new Option('Automatic installed checkpoint', ''), ...catalog.checkpoints.map(name => new Option(name, name))); model.value = [...model.options].some(option => option.value === selectedModel) ? selectedModel : '';
    const workflow = get('shotWorkflow'), selectedWorkflow = workflow.value; workflow.replaceChildren(new Option('Automatic compatible workflow', ''), ...catalog.workflows.filter(item => ['image', 'revision', 'control'].includes(item.contract)).map(item => { const option = new Option(`${item.id} · ${item.version}${item.readiness === 'ready' ? ' · ready' : ' · blocked'}`, item.id); option.disabled = item.readiness !== 'ready'; option.title = item.readiness === 'ready' ? 'All required nodes and models were detected.' : `Missing: ${[...(item.missingNodes || []), ...(item.missingModels || [])].join(', ')}`; return option; })); workflow.value = [...workflow.options].some(option => option.value === selectedWorkflow && !option.disabled) ? selectedWorkflow : '';
    const controlnet = get('shotControlnet'), selectedControlnet = controlnet.value; controlnet.replaceChildren(...catalog.controlnets.map(name => new Option(name, name))); controlnet.value = [...controlnet.options].some(option => option.value === selectedControlnet) ? selectedControlnet : (catalog.controlnets.find(name => /openposexl2/i.test(name)) || catalog.controlnets[0] || '');
    const ready = [];
    if (catalog.detected?.ipAdapter && catalog.clipVision?.length) ready.push(`IP-Adapter detected (${catalog.clipVision.length} vision model); FaceID remains gated until an InsightFace recognition model is verified`);
    if (catalog.detected?.controlNet && catalog.controlnets?.length) ready.push(`pose/structure control (${catalog.controlnets.length} model${catalog.controlnets.length === 1 ? '' : 's'})`);
    if (catalog.detected?.inpaint) ready.push('targeted inpaint nodes');
    if (catalog.detected?.lora) ready.push(`LoRA routing${catalog.loras?.length ? ` (${catalog.loras.length} installed)` : ''}`);
    get('referenceAdapterGate').textContent = ready.length ? `Detected on live worker: ${ready.join(' · ')}. Registered API workflows remain the execution gate.` : 'Advanced reference nodes or compatible model files were not detected; basic image and revision workflows remain available.';
  }

  async function renderVariants(container, shot) {
    if (!shot.variants.length) return;
    const strip = document.createElement('div'); strip.className = 'variant-strip';
    for (const variant of shot.variants) {
      const item = document.createElement('figure'); item.className = `variant status-${variant.status}`;
      try { item.append(await previewNode(variant.artifact, `${shot.title} variant`)); } catch {}
      const caption = document.createElement('figcaption'); caption.textContent = `${variant.status}${variant.branchLabel ? ` · ${variant.branchLabel}` : ''}`;
      const promote = document.createElement('button'); promote.textContent = 'Promote'; promote.onclick = async () => { await window.masterChief.saveReferenceVariant({ ...ids(shot.id), variant: { ...variant, status: 'approved' } }); await loadState(); };
      const reject = document.createElement('button'); reject.textContent = 'Reject'; reject.onclick = async () => { await window.masterChief.saveReferenceVariant({ ...ids(shot.id), variant: { ...variant, status: 'rejected' } }); await loadState(); };
      const annotate = document.createElement('button'); annotate.textContent = 'Note'; annotate.onclick = async () => { const value = prompt('Variant annotation', variant.annotation || ''); if (value !== null) { await window.masterChief.saveReferenceVariant({ ...ids(shot.id), variant: { ...variant, annotation: value } }); await loadState(); } };
      const branch = document.createElement('button'); branch.textContent = 'Branch'; branch.onclick = async () => { loadShotEditor({ ...shot, title: `${shot.title} branch`, referenceArtifact: variant.artifact, referenceMode: 'selected' }); get('shotPositive').focus(); };
      item.append(caption, promote, reject, annotate, branch); strip.append(item);
    }
    container.append(strip);
  }

  async function renderQueue() {
    const queue = get('referenceShotQueue'), shots = sheet?.shots || []; queue.replaceChildren();
    if (!shots.length) { queue.textContent = 'No shots yet. Add a shot to build an executable continuity queue.'; return; }
    for (const shot of shots) {
      const card = document.createElement('article'); card.className = 'reference-shot';
      const title = document.createElement('strong'); title.textContent = shot.title;
      const status = document.createElement('span'); status.className = `reference-shot-status status-${shot.status}`; status.textContent = shot.status;
      const promptText = document.createElement('p'); promptText.textContent = shot.positivePrompt || 'No positive prompt recorded.';
      const details = document.createElement('small'); details.textContent = [shot.referenceMode === 'none' ? 'clean generation' : `${shot.referenceMode || 'approved'} reference`, shot.controlMode === 'pose' ? `pose control ${shot.controlStrength}` : 'visual revision', shot.pose, shot.environment, shot.camera, shot.lighting, `seed ${shot.seed || 'random'}`, `${shot.steps || 28} steps`, `CFG ${shot.cfg ?? 6.5}`, `${shot.width || 768}×${shot.height || 1024}`, `batch ${shot.batch || 1}`, `strength ${shot.referenceStrength}`, `denoise ${shot.denoise}`, shot.model || 'auto model'].filter(Boolean).join(' · ');
      const actions = document.createElement('div'); actions.className = 'reference-shot-actions';
      const run = document.createElement('button'); run.textContent = shot.status === 'failed' ? 'Retry' : 'Run'; run.onclick = async () => { await window.masterChief.saveReferenceShot({ ...ids(), shot: { ...shot, status: 'queued', error: '' } }); await loadState(); await runQueue(shot.id); };
      const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.onclick = () => { loadShotEditor(shot); get('shotPositive').focus(); };
      const load = document.createElement('button'); load.textContent = 'Send to command'; load.onclick = () => { get('positivePrompt').value = shot.positivePrompt; get('negativePrompt').value = shot.negativePrompt; get('prompt').value = '/image Reference Studio shot'; dialog.close(); get('prompt').focus(); };
      const remove = document.createElement('button'); remove.textContent = 'Remove'; remove.onclick = async () => { await window.masterChief.removeReferenceShot({ ...ids(shot.id) }); await loadState(); };
      actions.append(run, edit, load, remove); card.append(title, status, promptText, details); if (shot.error) { const error = document.createElement('small'); error.className = 'shot-error'; error.textContent = shot.error; card.append(error); } card.append(actions); await renderVariants(card, shot); queue.append(card);
    }
  }

  async function loadState() {
    state = await window.masterChief.referenceStudioState(); chooseCurrent(); renderSelectors(); fillHierarchy(); await Promise.all([renderContactSheet(), renderQueue()]);
  }

  async function saveHierarchy() {
    project = await window.masterChief.saveReferenceProject({ id: project?.id, title: get('referenceProjectTitle').value });
    subject = await window.masterChief.saveReferenceSubject({ projectId: project.id, subject: { id: subject?.id, name: get('referenceSubjectName').value, appearanceNotes: get('referenceAppearanceNotes').value, palette: get('referencePalette').value, continuityLocks: get('referenceIdentityLock').value } });
    sheet = await window.masterChief.saveReferenceSheet({ projectId: project.id, subjectId: subject.id, sheet: { id: sheet?.id, title: get('referenceSheetTitle').value, appearanceNotes: get('referenceAppearanceNotes').value, palette: get('referencePalette').value, continuityLocks: get('referenceIdentityLock').value } });
    localStorage.setItem('mcReferenceProject', project.id); localStorage.setItem('mcReferenceSubject', subject.id); localStorage.setItem('mcReferenceSheet', sheet.id); await loadState(); return sheet;
  }

  async function importFiles(files) {
    if (!sheet) await saveHierarchy();
    for (const file of files) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 25 * 1024 * 1024) { get('referenceQueueStatus').textContent = `${file.name}: unsupported or over 25 MB`; continue; }
      const imported = await window.masterChief.importReferenceImage(file.name, await file.arrayBuffer());
      await window.masterChief.saveReferenceView({ ...ids(), view: { artifact: imported.artifact, label: file.name, status: 'candidate', annotation: '' } });
    }
    await Promise.all([loadState(), loadArtifacts()]);
  }

  async function runQueue(shotId) {
    if (!sheet) return; get('referenceQueueStatus').textContent = 'Starting queue…';
    try { const result = await window.masterChief.runReferenceQueue({ ...ids(), shotId, concurrency: Number(get('referenceConcurrency').value) }); if (!activeQueueId) activeQueueId = result.queueId; get('referenceQueueStatus').textContent = result.message || `${result.completed}/${result.total} complete`; await Promise.all([loadState(), loadArtifacts()]); }
    catch (error) { get('referenceQueueStatus').textContent = error.message; await loadState(); }
  }

  get('referenceStudioBtn').onclick = async () => { await Promise.all([loadState(), loadArtifacts()]); dialog.showModal(); };
  get('closeReferenceStudio').onclick = () => dialog.close(); get('saveReferenceProject').onclick = saveHierarchy;
  get('referenceProjectSelect').onchange = async event => { project = event.target.value === '__new__' ? null : state.projects.find(item => item.id === event.target.value); subject = project?.subjects[0] || null; sheet = subject?.referenceSheets[0] || null; renderSelectors(); fillHierarchy(); await Promise.all([renderContactSheet(), renderQueue()]); };
  get('referenceSubjectSelect').onchange = async event => { subject = event.target.value === '__new__' ? null : project?.subjects.find(item => item.id === event.target.value); sheet = subject?.referenceSheets[0] || null; renderSelectors(); fillHierarchy(); await Promise.all([renderContactSheet(), renderQueue()]); };
  get('referenceSheetSelect').onchange = async event => { sheet = event.target.value === '__new__' ? null : subject?.referenceSheets.find(item => item.id === event.target.value); renderSelectors(); fillHierarchy(); await Promise.all([renderContactSheet(), renderQueue()]); };
  get('referenceFileInput').onchange = async event => { await importFiles([...event.target.files]); event.target.value = ''; };
  const drop = get('referenceDropZone'); drop.ondragover = event => { event.preventDefault(); drop.classList.add('dragging'); }; drop.ondragleave = () => drop.classList.remove('dragging'); drop.ondrop = async event => { event.preventDefault(); drop.classList.remove('dragging'); const artifact = event.dataTransfer.getData('application/x-master-chief-artifact'); if (artifact) { if (!sheet) await saveHierarchy(); await window.masterChief.saveReferenceView({ ...ids(), view: { artifact, label: artifact.split('/').pop(), status: 'candidate' } }); await loadState(); } else await importFiles([...event.dataTransfer.files]); };
  get('compareTwoViews').onclick = () => showComparison(2); get('compareFourViews').onclick = () => showComparison(4); get('clearComparison').onclick = () => { comparison.clear(); get('referenceComparison').hidden = true; renderContactSheet(); };
  get('shotReferenceMode').onchange = event => { setReferenceMode(event.target.value); invalidatePreflight(); };
  get('shotControlMode').onchange = event => { get('shotWorkflow').value = ''; invalidatePreflight(); get('sceneCoachAdvice').textContent = event.target.value === 'pose' ? 'Pose control expects a prepared OpenPose skeleton map, not a normal photograph. The installed OpenPose XL model will copy that structure while the text prompt controls appearance.' : 'Visual revision uses the actual selected image as the redraw source.'; };
  get('clearActiveReference').onclick = () => { get('shotReferenceArtifact').value = ''; setReferenceMode('none'); get('referenceQueueStatus').textContent = 'Active reference cleared. The next queued shot will start clean; saved references remain available.'; };
  get('newCleanReferenceDraft').onclick = () => { comparison.clear(); get('referenceComparison').hidden = true; resetShotEditor({ cleanReference: true }); get('sceneCoachAdvice').textContent = 'Clean draft ready. No approved or selected image will be sent unless you choose a reference mode again.'; get('referenceQueueStatus').textContent = 'New clean draft started. Saved projects, references, variants, and media were not deleted.'; renderContactSheet(); get('shotPositive').focus(); };
  const sceneMoves = {
    scene: { focus: 'shotEnvironment', advice: 'Describe only the new location, time, weather, and background action. Keep face, body, costume, and color anchors in Continuity locks. Use an approved reference with moderate denoise.' },
    pose: { focus: 'shotPose', advice: 'Describe body position, hand placement, gaze, and action. Keep environment and camera unchanged. Use the selected or approved reference; lower denoise preserves more identity.' },
    camera: { focus: 'shotCamera', advice: 'Specify shot size, lens or field of view, angle, height, distance, and depth of field. Leave character locks unchanged.' },
    light: { focus: 'shotLighting', advice: 'Specify key direction, softness, fill ratio, rim light, practical sources, color temperature, and exposure mood. Keep pose and camera fixed.' },
    detail: { focus: 'shotPositive', advice: 'Use a lower-denoise revision for texture, material, hair, skin, and edge cleanup. Do not add a new scene or pose in the same pass.', denoise: .35 },
    rebuild: { focus: 'shotPositive', advice: 'Use a clean generation when composition is fundamentally wrong. Restate the complete subject, action, environment, camera, lighting, and continuity locks.', mode: 'none', denoise: .84 }
  };
  document.querySelectorAll('[data-scene-move]').forEach(button => { button.onclick = () => { const move = sceneMoves[button.dataset.sceneMove]; if (move.mode) setReferenceMode(move.mode); if (move.denoise) { get('shotDenoise').value = move.denoise; get('shotDenoiseValue').value = move.denoise; } get('sceneCoachAdvice').textContent = move.advice; get(move.focus).focus(); }; });
  const sceneRecipes = {
    portrait: { title: 'Portrait study', camera: 'head-and-shoulders portrait, eye-level camera, 85mm lens, shallow depth of field', lighting: 'soft key light, controlled fill, subtle rim separation', width: 832, height: 1216, advice: 'Portrait recipe loaded. Add expression and background details, then review the exact job.' },
    fullbody: { title: 'Full-body character study', pose: 'full body visible, both hands and both feet visible, balanced natural stance', camera: 'full-body three-quarter composition, eye-level camera, 50mm lens', width: 832, height: 1216, advice: 'Full-body recipe loaded. For exact limb geometry, select a prepared OpenPose map.' },
    turnaround: { title: 'Character turnaround', pose: 'neutral standing reference pose, full body visible, clear silhouette', camera: 'orthographic-style character reference, centered, minimal perspective distortion', lighting: 'even neutral studio lighting, minimal shadows', width: 1024, height: 1024, batch: 4, advice: 'Turnaround exploration loaded as four variants. Promote the strongest consistent views into the reference sheet.' },
    cinematic: { title: 'Cinematic scene', camera: 'cinematic three-quarter composition, 35mm lens, layered foreground and background, controlled depth of field', lighting: 'motivated key light, shaped fill, strong rim separation, practical environmental sources', width: 1216, height: 832, advice: 'Cinematic recipe loaded. Describe the scene and action; keep identity anchors in Continuity locks.' }
  };
  document.querySelectorAll('[data-scene-recipe]').forEach(button => { button.onclick = () => { const recipe = sceneRecipes[button.dataset.sceneRecipe]; for (const field of ['title','pose','camera','lighting']) if (recipe[field]) get(`shot${field[0].toUpperCase()}${field.slice(1)}`).value = recipe[field]; if (recipe.width) get('shotWidth').value = recipe.width; if (recipe.height) get('shotHeight').value = recipe.height; if (recipe.batch) get('shotBatch').value = recipe.batch; invalidatePreflight(); get('sceneCoachAdvice').textContent = recipe.advice; get('shotPositive').focus(); }; });
  get('shotReferenceStrength').oninput = event => { get('shotReferenceStrengthValue').value = event.target.value; }; get('shotDenoise').oninput = event => { get('shotDenoiseValue').value = event.target.value; };
  get('addReferenceShot').onclick = async () => {
    if (!sheet) await saveHierarchy();
    const shot = shotPayload();
    if (!shot.positivePrompt.trim()) { get('shotPositive').focus(); return; }
    if (shot.referenceMode === 'selected' && !shot.referenceArtifact) { get('referenceQueueStatus').textContent = 'Choose a reference artifact or select a different reference mode.'; get('shotReferenceArtifact').focus(); return; }
    const signature = JSON.stringify(shot);
    try {
      if (!reviewedShot || reviewedShot.signature !== signature) {
        const result = await window.masterChief.preflightReferenceShot({ ...ids(), shot });
        renderPreflight(result, signature);
        get('referenceQueueStatus').textContent = 'Review the exact job preflight, then confirm to add it to the queue.';
        return;
      }
      shot.referenceSha256 = reviewedShot.result.source?.sha256 || '';
      shot.seed = reviewedShot.result.parameters.seed;
      await window.masterChief.saveReferenceShot({ ...ids(), shot });
      get('referenceQueueStatus').textContent = 'Preflight-confirmed shot added to the queue.';
      resetShotEditor(); await loadState();
    } catch (error) { get('referenceQueueStatus').textContent = error.message; }
  };
  get('runReferenceQueue').onclick = () => runQueue(); get('resumeReferenceQueue').onclick = async () => { for (const shot of sheet?.shots || []) if (['failed','cancelled','recoverable'].includes(shot.status)) await window.masterChief.saveReferenceShot({ ...ids(), shot: { ...shot, status: 'queued', error: '' } }); await loadState(); await runQueue(); };
  get('cancelReferenceQueue').onclick = async () => { if (activeQueueId) await window.masterChief.cancelReferenceQueue(activeQueueId); };
  get('clearReferenceQueue').onclick = async () => { if (sheet) { const result = await window.masterChief.clearReferenceQueue(ids()); get('referenceQueueStatus').textContent = `${result.cleared} pending shots cleared`; await loadState(); } };
  get('openComfyDesignStudio').onclick = async () => { try { await window.masterChief.openComfyUiRuntime(); get('referenceQueueStatus').textContent = 'Opened the live ComfyUI design canvas in your browser.'; } catch (error) { get('referenceQueueStatus').textContent = error.message; } };
  get('closeReferenceRuntime').onclick = async () => { if (!sheet) return; const result = await window.masterChief.closeReferenceRuntime(ids()); get('referenceQueueStatus').textContent = result.gpuMemoryReleased ? 'Runtime closed; VRAM release requested. Lineage preserved.' : 'Runtime session closed. Lineage preserved.'; await loadState(); };
  document.querySelectorAll('.shot-editor input,.shot-editor textarea,.shot-editor select').forEach(control => control.addEventListener('input', invalidatePreflight));
  get('exploreFourVariants').onclick = () => { get('shotBatch').value = '4'; get('shotSeed').value = ''; invalidatePreflight(); get('sceneCoachAdvice').textContent = 'Four-up exploration ready. Review once to lock a random seed; ComfyUI will return four related variants for contact-sheet review.'; get('shotPositive').focus(); };
  setReferenceMode('approved');
  if (window.masterChief.onReferenceQueueEvent) window.masterChief.onReferenceQueueEvent(async event => { if (event.queueId) activeQueueId = event.status === 'complete' || event.status === 'cancelled' ? null : event.queueId; get('referenceQueueStatus').textContent = event.type === 'shot' ? `${event.status}: ${event.shotId}` : `${event.status}: ${event.completed || 0}/${event.total || 0}`; if (event.type === 'shot') await loadState(); });
})();
