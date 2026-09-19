'use strict';

(() => {
  const get = id => document.getElementById(id);
  const dialog = get('referenceStudio');
  if (!dialog || !window.masterChief?.referenceStudioState) return;
  let state = { schemaVersion: 1, projects: [] };
  let project = null;

  function fillProject() {
    get('referenceProjectTitle').value = project?.title || 'Commander Nova project';
    get('referenceSubjectName').value = project?.subject?.name || 'Commander Nova';
    get('referenceIdentityLock').value = project?.subject?.identityLock || '';
    get('referenceAdultConfirmed').checked = Boolean(project?.subject?.adultConfirmed);
  }

  function renderQueue() {
    const queue = get('referenceShotQueue');
    const shots = project?.shots || [];
    if (!shots.length) {
      queue.textContent = 'No queued shots yet. Add a shot above to preserve its prompt and reference contract.';
      return;
    }
    queue.replaceChildren(...shots.map(shot => {
      const card = document.createElement('article');
      card.className = 'reference-shot';
      const title = document.createElement('strong');
      title.textContent = shot.title;
      const status = document.createElement('span');
      status.className = 'reference-shot-status';
      status.textContent = shot.status;
      const prompt = document.createElement('p');
      prompt.textContent = shot.positivePrompt || 'No positive prompt recorded.';
      const use = document.createElement('button');
      use.textContent = 'Load into composer';
      use.onclick = () => {
        get('positivePrompt').value = shot.positivePrompt;
        get('negativePrompt').value = shot.negativePrompt;
        get('prompt').value = '/image queued Reference Studio shot';
        dialog.close();
        get('prompt').focus();
      };
      const remove = document.createElement('button');
      remove.textContent = 'Remove';
      remove.onclick = async () => {
        await window.masterChief.removeReferenceShot({ projectId: project.id, shotId: shot.id });
        await loadState();
      };
      card.append(title, status, prompt, use, remove);
      return card;
    }));
  }

  async function loadArtifacts() {
    const select = get('shotReferenceArtifact');
    const prior = select.value;
    const artifacts = await window.masterChief.listGeneratedMedia(100);
    const options = [new Option('No reference selected', '')];
    for (const artifact of artifacts.filter(item => /\.(png|jpe?g|webp)$/i.test(item.filename))) {
      options.push(new Option(artifact.filename, artifact.path));
    }
    select.replaceChildren(...options);
    select.value = prior;
  }

  async function loadState() {
    state = await window.masterChief.referenceStudioState();
    project = state.projects[0] || null;
    fillProject();
    renderQueue();
  }

  get('referenceStudioBtn').onclick = async () => {
    await Promise.all([loadState(), loadArtifacts()]);
    dialog.showModal();
  };
  get('closeReferenceStudio').onclick = () => dialog.close();
  async function saveProject() {
    project = await window.masterChief.saveReferenceProject({
      id: project?.id,
      title: get('referenceProjectTitle').value,
      subject: {
        name: get('referenceSubjectName').value,
        identityLock: get('referenceIdentityLock').value,
        adultConfirmed: get('referenceAdultConfirmed').checked
      }
    });
    renderQueue();
    return project;
  }
  get('saveReferenceProject').onclick = saveProject;
  get('addReferenceShot').onclick = async () => {
    if (!project) await saveProject();
    const positivePrompt = get('shotPositive').value.trim();
    if (!positivePrompt) {
      get('shotPositive').focus();
      return;
    }
    await window.masterChief.saveReferenceShot({
      projectId: project.id,
      shot: {
        title: get('shotTitle').value,
        positivePrompt,
        negativePrompt: get('shotNegative').value,
        referenceArtifact: get('shotReferenceArtifact').value,
        status: 'queued'
      }
    });
    get('shotTitle').value = '';
    get('shotPositive').value = '';
    get('shotNegative').value = '';
    await loadState();
  };
})();
