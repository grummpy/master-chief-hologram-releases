(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.masterChiefAutocomplete = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const commands = Object.freeze([
    '/image ', '/video ', '/revise ', '/agent diagnostics',
    '@master-chief ', '@papm ', '@jarvis ', '@imagination ',
    '@prompt-engineering ', '@chief-ux ', '@captain-intelligence ',
    'Check system readiness', 'Run voice self-test', 'Create a PAPM plan for ',
    'Create a local AI plan for ', 'Create a graphics and 3D plan for ',
    'Index local document ', 'Inspect local runtime', 'Inspect project Git status',
    'Open artifact catalog'
  ]);
  function suggestions(value, limit = 5) {
    const query = String(value || '').trim().toLowerCase();
    // An empty prompt is a normal focus state. Do not cover the command box or
    // imply that the first suggestion has been selected until the user types.
    if (!query) return [];
    return commands.filter(command => command.toLowerCase().startsWith(query)).slice(0, limit);
  }
  return { commands, suggestions };
}));
