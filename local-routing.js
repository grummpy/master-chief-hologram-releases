(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.masterChiefLocalRouting = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function chooseDefaultProvider(status, savedProvider) {
    if (savedProvider && status?.[savedProvider]?.state === 'ready') return savedProvider;
    if (status?.ollama?.state === 'ready') return 'ollama';
    return 'codex';
  }
  return { chooseDefaultProvider };
}));
