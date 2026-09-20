const assert = require('node:assert/strict');
const { getToolRegistry, normalizeApprovals, setToolApproval, isToolApproved } = require('../tool-registry');

const registry = getToolRegistry();
assert.ok(registry.some(tool => tool.id === 'voice.transcribe_microphone'));
assert.equal(isToolApproved({}, 'diagnostics.provider_status'), true);
assert.equal(isToolApproved({}, 'voice.transcribe_microphone'), false);
const approved = setToolApproval({}, 'voice.transcribe_microphone', true);
assert.equal(isToolApproved(approved, 'voice.transcribe_microphone'), true);
assert.throws(() => setToolApproval({}, 'unknown.tool', true), /not user-approvable/);
assert.throws(() => setToolApproval({}, 'voice.transcribe_microphone', 'yes'), /boolean/);
assert.deepEqual(normalizeApprovals({ unknown: true, 'voice.transcribe_microphone': true }), { 'diagnostics.git_status': false, 'project.list_files': false, 'project.read_text_file': false, 'project.preview_replace': false, 'project.replace_text': false, 'project.rollback_edit': false, 'project.preview_patch_set': false, 'project.apply_patch_set': false, 'project.rollback_patch_set': false, 'project.run_tests': false, 'artifacts.list': false, 'knowledge.search_local': false, 'scheduler.list': false, 'scheduler.create': false, 'scheduler.action': false, 'monitors.list': false, 'monitors.create': false, 'monitors.action': false, 'artifacts.create': false, 'research.public_web': false, 'files.attach_local_text': false, 'vision.analyze_local_image': false, 'voice.transcribe_microphone': true, 'chat.send_to_configured_provider': false, 'media.generate_local': false, 'agents.run_bounded_plan': false });
assert.equal(isToolApproved({}, 'connectors.status'), true);
assert.equal(isToolApproved({}, 'diagnostics.git_status'), true);
assert.throws(() => setToolApproval({}, 'diagnostics.git_status', true), /not user-approvable/);
