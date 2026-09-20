'use strict';

const fs = require('node:fs');

const DATA_STORES = Object.freeze([
  { id: 'credentials', data: 'Provider credentials', location: 'macOS encrypted credential storage', retention: 'Until replaced in connector setup or the app credential store is manually removed', clearBehavior: 'Preserved by Clear and Clear All', sensitivity: 'secret' },
  { id: 'conversations', data: 'Conversation text', location: 'Local app user-data', retention: 'Until deleted or Clear is used', clearBehavior: 'Removed by Clear and Clear All, including recoverable trash', sensitivity: 'private' },
  { id: 'retrieval', data: 'Temporary attachment text and retrieval chunks', location: 'Local retrieval index', retention: 'Removed after the request when temporary; otherwise until Clear', clearBehavior: 'Removed by Clear and Clear All', sensitivity: 'private' },
  { id: 'generated-media', data: 'Generated media, prompts, and lineage', location: 'Local generated-media archive and private Windows worker while active', retention: 'Until Clear All or manual deletion', clearBehavior: 'Preserved by Clear; removed by Clear All', sensitivity: 'private' },
  { id: 'projects', data: 'Artifacts deliberately saved to Projects', location: 'Local Projects folder', retention: 'Until manually deleted by the operator', clearBehavior: 'Preserved by Clear and Clear All', sensitivity: 'private' },
  { id: 'diagnostics', data: 'Secret-free operational events', location: 'Local rotating diagnostic files', retention: 'Current file plus one bounded prior file', clearBehavior: 'Not conversation or generated-media content', sensitivity: 'operational' }
]);

const ROUTES = Object.freeze({
  ollama: { destination: 'Local Ollama runtime', residency: 'local or operator-configured private LAN', sends: 'Prompt, selected conversation context, and explicitly attached context', externalRetention: 'Not applicable to a local runtime; private-LAN host storage is operator managed' },
  comfyui: { destination: 'Private ComfyUI worker', residency: 'operator-configured private LAN', sends: 'Visible media prompt, selected references, and generation settings', externalRetention: 'Worker queue/history and output retention are operator managed' },
  openai: { destination: 'OpenAI API', residency: 'cloud', sends: 'Prompt, selected conversation context, and explicitly attached context', externalRetention: 'Controlled by the provider account and current provider terms; verify before sensitive use' },
  codex: { destination: 'Codex Desktop or configured bridge', residency: 'cloud and local', sends: 'Command and only the context selected by the app workflow', externalRetention: 'Controlled by the connected product/account; verify before sensitive use' },
  grok: { destination: 'xAI API', residency: 'cloud', sends: 'Prompt, selected conversation context, and explicitly attached context', externalRetention: 'Controlled by the provider account and current provider terms; verify before sensitive use' },
  huggingface: { destination: 'Configured Hugging Face inference endpoint', residency: 'cloud unless the configured endpoint is private', sends: 'Prompt and selected conversation context', externalRetention: 'Depends on the selected inference provider and account terms; verify the exact route' },
  gemini: { destination: 'Google Gemini API', residency: 'cloud', sends: 'Prompt, selected conversation context, and explicitly attached context', externalRetention: 'Controlled by the provider account and current provider terms; verify before sensitive use' },
  elevenlabs: { destination: 'ElevenLabs API', residency: 'cloud', sends: 'Narration text and selected voice settings', externalRetention: 'Controlled by the provider account and current provider terms; verify before sensitive use' },
  searxng: { destination: 'Local SearXNG and its enabled public search engines', residency: 'local gateway plus public engines', sends: 'Research query only', externalRetention: 'Each enabled search engine has its own terms and logs' }
});

function systemInventory(version = '') {
  return {
    schemaVersion: 1,
    product: 'Master Chief Hologram',
    version: String(version || 'unknown'),
    purpose: 'Operator-directed local-first AI chat, artifact generation, research, agent tools, and private-LAN media workflows.',
    accountableOwner: 'Repository owner/operator',
    decisionAuthority: 'The operator retains final approval; model output is not a legal, financial, medical, security, or publishing determination.',
    autonomy: 'Bounded allowlisted tools with main-process approval enforcement and reversible write receipts where supported.',
    dataStores: DATA_STORES.map(item => ({ ...item })),
    routes: Object.fromEntries(Object.entries(ROUTES).map(([id, route]) => [id, { ...route }]))
  };
}

function routeDisclosure(id) {
  const key = String(id || '').toLowerCase();
  const route = ROUTES[key];
  if (!route) return { id: key || 'unknown', known: false, residency: 'unknown', notice: 'Destination is not in the governance inventory. Do not send private data until the route is reviewed.' };
  return { id: key, known: true, ...route, notice: `${route.destination} receives: ${route.sends}. ${route.externalRetention}` };
}

function publicationPreflight(input = {}) {
  const checks = {
    accountableOwner: Boolean(String(input.accountableOwner || '').trim()),
    artifactIdentified: Boolean(String(input.artifact || '').trim()),
    provenanceReviewed: input.provenanceReviewed === true,
    rightsReviewed: input.rightsReviewed === true,
    consentReviewed: input.consentReviewed === true,
    privacyReviewed: input.privacyReviewed === true,
    factualClaimsReviewed: input.factualClaimsReviewed === true,
    disclosureDecisionRecorded: input.disclosureDecisionRecorded === true,
    humanApproved: input.humanApproved === true
  };
  const labels = {
    accountableOwner: 'Name an accountable human owner.', artifactIdentified: 'Identify the exact artifact and version.', provenanceReviewed: 'Review source, model, workflow, and artifact provenance.', rightsReviewed: 'Review licenses, ownership, trademark, publicity, and intended distribution rights.', consentReviewed: 'Review consent/authorization for identifiable people, voices, confidential inputs, and reference assets.', privacyReviewed: 'Review personal, sensitive, confidential, and regulated data before distribution.', factualClaimsReviewed: 'Have a qualified human review factual claims, citations, and material omissions.', disclosureDecisionRecorded: 'Record the operator decision on AI-assistance and sponsorship disclosure.', humanApproved: 'Record final human approval for the named audience and channel.'
  };
  const blockers = Object.entries(checks).filter(([, passed]) => !passed).map(([id]) => ({ id, message: labels[id] }));
  return {
    schemaVersion: 1,
    readyForHumanRelease: blockers.length === 0,
    determination: 'Operational preflight only; not legal advice, license clearance, platform approval, or a finding of compliance.',
    checks,
    blockers,
    reviewedAt: new Date().toISOString()
  };
}

function dependencyLicenseInventory(lockFile) {
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(lockFile, 'utf8')); } catch { return { status: 'unavailable', packages: [], issues: [{ type: 'error', message: 'Package lock could not be read.' }] }; }
  const packages = Object.entries(parsed.packages || {}).filter(([name]) => name.startsWith('node_modules/')).map(([name, meta]) => ({ name: name.replace(/^node_modules\//, ''), version: String(meta.version || ''), license: String(meta.license || 'UNKNOWN') }));
  const issues = [];
  for (const item of packages) {
    if (!item.license || item.license === 'UNKNOWN') issues.push({ type: 'missing-license', package: item.name, message: 'License metadata is missing; inspect the package source before distribution.' });
    const permissiveAlternative = /MIT|Apache|BSD|ISC|Unlicense|BlueOak/i.test(item.license);
    if (!permissiveAlternative && /GPL|AGPL|LGPL|CC-BY|SEE LICENSE|Custom|Proprietary/i.test(item.license)) issues.push({ type: 'manual-review', package: item.name, license: item.license, message: 'Manual redistribution and notice review is required.' });
  }
  return { status: issues.length ? 'review' : 'clear-metadata', packages, issues, disclaimer: 'Metadata inventory only; verify license texts, notices, bundled assets, model weights, and workflow-node terms before publication.' };
}

module.exports = { DATA_STORES, ROUTES, systemInventory, routeDisclosure, publicationPreflight, dependencyLicenseInventory };
