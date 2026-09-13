(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.masterChiefAutocomplete = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const commands = Object.freeze([
    'Check system readiness', 'Run voice self-test', 'Create a PAPM plan for ',
    'Create a local AI plan for ', 'Create a graphics and 3D plan for ',
    'Index local document ', 'Inspect local runtime', 'Inspect project Git status',
    'Open artifact catalog'
  ]);
  function suggestions(value, limit = 5) {
    const query = String(value || '').trim().toLowerCase();
    if (!query) return commands.slice(0, limit);
    return commands.filter(command => command.toLowerCase().startsWith(query)).slice(0, limit);
  }
  return { commands, suggestions };
}));
