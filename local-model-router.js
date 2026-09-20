'use strict';

function routeLocalModel({ objective = '', models = [], requested = '', mode = 'standard' } = {}) {
  const text = String(objective).toLowerCase();
  const exact = models.find(item => item.name === requested);
  if (exact) return { model: exact.name, role: 'operator selected', reason: 'explicit model selection', mode };
  const scored = models.map(item => {
    const name = String(item.name || ''); let score = Number(item.size || 0) / 1e9;
    if (/\b(code|python|javascript|typescript|sql|debug|repository|test)\b/.test(text) && /coder|code/i.test(name)) score += 100;
    if (/\b(classify|route|intent|short)\b/.test(text) && /0\.5b|1b|1\.5b|3b/i.test(name)) score += 20;
    if (item.capabilities?.includes('tools') && mode === 'agent') score += 50;
    return { item, score };
  }).sort((a, b) => b.score - a.score);
  const selected = scored[0]?.item;
  return selected ? { model: selected.name, role: /coder|code/i.test(selected.name) ? 'coding' : 'general reasoning', reason: 'best installed local capability match', mode } : { model: '', role: 'unavailable', reason: 'no installed local model', mode };
}

module.exports = { routeLocalModel };
