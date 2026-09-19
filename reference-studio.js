'use strict';

(() => {
  const get = id => document.getElementById(id);
  const dialog = get('referenceStudio');
  if (!dialog || !window.masterChief?.referenceStudioState) return;
  let state = { schemaVersion: 2, projects: [] }, project = null, subject = null, sheet = null, activeQueueId = null;
  const comparison = new Set();
  const ids = shotId => ({ projectId: project?.id, subjectId: subject?.id, sheetId: sheet?.id, ...(shotId ? { shotId } : {}) });
  const selectValue = (id, fallback = '') => get(id)?.value || fallback;

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
    select.replaceChildren(new Option('Use approved sheet view', ''), ...artifacts.filter(item => /\.(png|jpe?g|webp)$/i.test(item.filename)).map(item => new Option(item.filename, item.path))); select.value = prior;
    const model = get('shotModel'), selectedModel = model.value; model.replaceChildren(new Option('Automatic installed checkpoint', ''), ...catalog.checkpoints.map(name => new Option(name, name))); model.value = [...model.options].some(option => option.value === selectedModel) ? selectedModel : '';
    const workflow = get('shotWorkflow'), selectedWorkflow = workflow.value; workflow.replaceChildren(new Option('Automatic compatible workflow', ''), ...catalog.workflows.filter(item => ['image', 'revision'].includes(item.contract)).map(item => new Option(`${item.id} · ${item.version}`, item.id))); workflow.value = [...workflow.options].some(option => option.value === selectedWorkflow) ? selectedWorkflow : '';
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
      const branch = document.createElement('button'); branch.textContent = 'Branch'; branch.onclick = async () => { get('shotTitle').value = `${shot.title} branch`; get('shotPositive').value = shot.positivePrompt; get('shotNegative').value = shot.negativePrompt; get('shotReferenceArtifact').value = variant.artifact; get('shotDenoise').value = shot.denoise; get('shotDenoiseValue').value = shot.denoise; get('shotPositive').focus(); };
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
      const details = document.createElement('small'); details.textContent = [shot.pose, shot.environment, shot.camera, shot.lighting, `strength ${shot.referenceStrength}`, `denoise ${shot.denoise}`, shot.model || 'auto model'].filter(Boolean).join(' · ');
      const actions = document.createElement('div'); actions.className = 'reference-shot-actions';
      const run = document.createElement('button'); run.textContent = shot.status === 'failed' ? 'Retry' : 'Run'; run.onclick = async () => { await window.masterChief.saveReferenceShot({ ...ids(), shot: { ...shot, status: 'queued', error: '' } }); await loadState(); await runQueue(shot.id); };
      const load = document.createElement('button'); load.textContent = 'Load'; load.onclick = () => { get('positivePrompt').value = shot.positivePrompt; get('negativePrompt').value = shot.negativePrompt; get('prompt').value = '/image Reference Studio shot'; dialog.close(); get('prompt').focus(); };
      const remove = document.createElement('button'); remove.textContent = 'Remove'; remove.onclick = async () => { await window.masterChief.removeReferenceShot({ ...ids(shot.id) }); await loadState(); };
      actions.append(run, load, remove); card.append(title, status, promptText, details); if (shot.error) { const error = document.createElement('small'); error.className = 'shot-error'; error.textContent = shot.error; card.append(error); } card.append(actions); await renderVariants(card, shot); queue.append(card);
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
  get('shotReferenceStrength').oninput = event => { get('shotReferenceStrengthValue').value = event.target.value; }; get('shotDenoise').oninput = event => { get('shotDenoiseValue').value = event.target.value; };
  get('addReferenceShot').onclick = async () => { if (!sheet) await saveHierarchy(); const positivePrompt = get('shotPositive').value; if (!positivePrompt.trim()) { get('shotPositive').focus(); return; } await window.masterChief.saveReferenceShot({ ...ids(), shot: { title: get('shotTitle').value, positivePrompt, negativePrompt: get('shotNegative').value, referenceArtifact: get('shotReferenceArtifact').value, pose: get('shotPose').value, environment: get('shotEnvironment').value, camera: get('shotCamera').value, lighting: get('shotLighting').value, model: get('shotModel').value, workflow: get('shotWorkflow').value, referenceStrength: Number(get('shotReferenceStrength').value), denoise: Number(get('shotDenoise').value), continuityLocks: get('shotContinuityLocks').value, status: 'queued' } }); ['shotTitle','shotPositive','shotNegative','shotPose','shotEnvironment','shotCamera','shotLighting','shotContinuityLocks'].forEach(id => { get(id).value = ''; }); await loadState(); };
  get('runReferenceQueue').onclick = () => runQueue(); get('resumeReferenceQueue').onclick = async () => { for (const shot of sheet?.shots || []) if (['failed','cancelled','recoverable'].includes(shot.status)) await window.masterChief.saveReferenceShot({ ...ids(), shot: { ...shot, status: 'queued', error: '' } }); await loadState(); await runQueue(); };
  get('cancelReferenceQueue').onclick = async () => { if (activeQueueId) await window.masterChief.cancelReferenceQueue(activeQueueId); };
  get('clearReferenceQueue').onclick = async () => { if (sheet) { const result = await window.masterChief.clearReferenceQueue(ids()); get('referenceQueueStatus').textContent = `${result.cleared} pending shots cleared`; await loadState(); } };
  get('closeReferenceRuntime').onclick = async () => { if (!sheet) return; const result = await window.masterChief.closeReferenceRuntime(ids()); get('referenceQueueStatus').textContent = result.gpuMemoryReleased ? 'Runtime closed; VRAM release requested. Lineage preserved.' : 'Runtime session closed. Lineage preserved.'; await loadState(); };
  if (window.masterChief.onReferenceQueueEvent) window.masterChief.onReferenceQueueEvent(async event => { if (event.queueId) activeQueueId = event.status === 'complete' || event.status === 'cancelled' ? null : event.queueId; get('referenceQueueStatus').textContent = event.type === 'shot' ? `${event.status}: ${event.shotId}` : `${event.status}: ${event.completed || 0}/${event.total || 0}`; if (event.type === 'shot') await loadState(); });
})();
