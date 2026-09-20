'use strict';

const NON_CHAT_PATTERN = /(?:^|[-_.:])(embed|embedding|rerank|reranker)(?:$|[-_.:])/i;

function modelFamily(model = {}) {
  const name = String(model.name || '').toLowerCase();
  if (/qwen/.test(name)) return 'qwen';
  if (/dolphin/.test(name)) return 'dolphin';
  if (/deepseek/.test(name)) return 'deepseek';
  if (/mistral|mixtral/.test(name)) return 'mistral';
  if (/llama/.test(name)) return 'llama';
  if (/gemma/.test(name)) return 'gemma';
  return 'other';
}

function classifyWorkload(objective = '', mode = 'standard') {
  const text = String(objective).toLowerCase();
  if (mode === 'agent' || /\b(agent|use (?:a )?tool|run tests?|git status|inspect (?:the )?repository)\b/.test(text)) return 'agent';
  if (/\b(image|photo|picture|screenshot|vision|ocr|diagram)\b/.test(text)) return 'vision';
  if (/\b(code|python|javascript|typescript|sql|debug|repository|refactor|test)\b/.test(text)) return 'code';
  if (/\b(reason|analy[sz]e|compare|evaluate|plan|architecture|research)\b/.test(text)) return 'reasoning';
  if (/\b(classify|route|intent|short|summari[sz]e)\b/.test(text)) return 'fast';
  if (/\b(story|creative|brainstorm|character|poem)\b/.test(text)) return 'creative';
  return 'chat';
}

function inspectLocalModel(model = {}) {
  const name = String(model.name || '');
  const capabilities = Array.isArray(model.capabilities) ? model.capabilities.map(value => String(value).toLowerCase()) : [];
  const family = modelFamily(model);
  const parameterMatch = String(model.details?.parameter_size || name).match(/([\d.]+)\s*[bB]/);
  return {
    name,
    family,
    parameterBillions: parameterMatch ? Number(parameterMatch[1]) : 0,
    chatEligible: Boolean(name) && !NON_CHAT_PATTERN.test(name),
    tools: capabilities.includes('tools'),
    thinking: capabilities.includes('thinking'),
    vision: capabilities.includes('vision') || /(?:vision|vl(?:[:._-]|$)|llava)/i.test(name),
    coding: /(?:coder|code|deepseek-coder|starcoder)/i.test(name),
    instructionTuned: /(?:instruct|chat|dolphin)/i.test(name) || capabilities.includes('completion'),
    quantization: String(model.details?.quantization_level || ''),
    format: String(model.details?.format || ''),
    capabilities
  };
}

function compatibility(profile, workload) {
  if (!profile.chatEligible) return { compatible: false, reason: 'embedding and reranking models cannot serve chat requests' };
  if (workload === 'agent' && !profile.tools) return { compatible: false, reason: 'agent mode requires advertised tool-calling support' };
  if (workload === 'vision' && !profile.vision) return { compatible: false, reason: 'vision work requires an installed vision-capable model' };
  return { compatible: true, reason: '' };
}

function routeLocalModel({ objective = '', models = [], requested = '', mode = 'standard' } = {}) {
  const workload = classifyWorkload(objective, mode);
  const candidates = models.map(item => ({ item, profile: inspectLocalModel(item) }));
  const exact = candidates.find(entry => entry.item.name === requested);
  if (exact) {
    const fit = compatibility(exact.profile, workload);
    if (fit.compatible) return { model: exact.item.name, family: exact.profile.family, workload, role: 'operator selected', reason: 'explicit compatible model selection', mode, fallback: false };
  }
  const scored = candidates.map(entry => {
    const { item, profile } = entry;
    const fit = compatibility(profile, workload);
    if (!fit.compatible) return { ...entry, score: -Infinity };
    let score = Math.min(30, profile.parameterBillions);
    if (workload === 'agent' && profile.tools) score += 120;
    if (workload === 'vision' && profile.vision) score += 120;
    if (workload === 'code' && profile.coding) score += 100;
    if (workload === 'reasoning' && profile.thinking) score += 60;
    if (workload === 'fast' && profile.parameterBillions > 0 && profile.parameterBillions <= 4) score += 45;
    if (workload === 'creative' && profile.family === 'dolphin') score += 35;
    if (profile.instructionTuned) score += 10;
    if (item.loaded) score += 4;
    return { ...entry, score };
  }).sort((left, right) => right.score - left.score || Number(right.item.size || 0) - Number(left.item.size || 0));
  const selected = scored.find(entry => Number.isFinite(entry.score));
  if (!selected) {
    const reason = exact ? compatibility(exact.profile, workload).reason : `no installed ${workload}-compatible local model`;
    return { model: '', family: exact?.profile.family || '', workload, role: 'unavailable', reason, mode, fallback: Boolean(exact) };
  }
  const role = workload === 'code' ? 'coding' : workload === 'agent' ? 'tool agent' : workload === 'vision' ? 'vision' : workload === 'reasoning' ? 'reasoning' : 'general chat';
  const fallback = Boolean(requested && selected.item.name !== requested);
  const reason = fallback
    ? `requested model is incompatible with ${workload}; selected the best installed compatible model`
    : `best installed local ${workload} capability match`;
  return { model: selected.item.name, family: selected.profile.family, workload, role, reason, mode, fallback };
}

module.exports = { routeLocalModel, modelFamily, classifyWorkload, inspectLocalModel, compatibility };
