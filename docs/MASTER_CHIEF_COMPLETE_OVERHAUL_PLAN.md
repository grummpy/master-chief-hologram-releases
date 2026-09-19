# Master Chief Complete Capability Overhaul

Version 1.0 — 2026-09-19  
Baseline: app v1.5.3, Electron operator UI, Ollama language route, Windows AMD ComfyUI worker

## Target outcome

Build one dependable local-first command interface for language, coding, images, revision, upscale, reference continuity, video, audio, bounded agent work, archives, and multiple home-compute nodes. Every added runtime must have a health check, explicit job contract, visible progress, provenance, cancellation, recovery, and rollback before it becomes a default.

Reliability comes before adding more model families. Prompt transport is working; recent image misses point to checkpoint capability and workflow behavior. The immediate priority is proving the stronger checkpoint, then making the selected model and generation parameters visible.

## Release sequence

| Release | Mission | Required result |
|---|---|---|
| v1.6 Reliability and Model Control | Implemented; remote SSH gate remains operator setup | Every request records what ran, where, with which model and parameters. |
| v1.7 Reference Studio Execution | Implemented; IP-Adapter/ControlNet remain gated | A promoted reference drives queued shots with compare/revise/promote controls. |
| v1.8 Motion and Sound | Short-form video and audio pilots | One AMD-supported video workflow and one speech workflow pass cancel/retry/archive tests. |
| v2.0 Agent Fabric | Durable multi-step local work | Jobs survive restart and resume without duplication. |
| v2.1 Home Compute Fabric | Optional multi-node language inference | Apple aggregation beats the single-node baseline on a measured workload. |

## Phase 0 — operable baseline

1. Complete Remote Gate R0 using [the Windows runbook](WINDOWS_INSTALL_SEQUENCE.md).
2. Install and checksum-verify Juggernaut XL; prove one end-to-end image return.
3. Run a fixed 10-prompt set against stock SDXL and Juggernaut. Record adherence, anatomy, text, latency, peak VRAM, and failures.
4. Verify gaming handoff: stop ComfyUI, confirm GPU release, keep SSH online, then restore the worker.
5. Capture a complete readiness report as the release baseline.

Exit: remote maintenance, generation, archive, download, revision recovery, and GPU release pass from the installed desktop build.

## Phase 1 — v1.6 Reliability and Model Control

- Add a durable job ledger: request/session IDs, route, workflow version, checkpoint, seed, sampler, scheduler, steps, CFG, dimensions, references, timing, status, errors, hashes, and parent revision.
- Show queue, load, generate, save, transfer, and archive as distinct progress stages.
- Add cancel, retry, duplicate-as-new, and resume with idempotent request IDs.
- Preserve unfinished sessions and output cards across refresh, restart, and worker outage.
- Display the exact positive and negative prompt sent to ComfyUI. Preserve user text; warnings may inform but never silently rewrite it.
- Populate a checkpoint selector from the live API; expose seed, CFG, steps, sampler, scheduler, size, batch, and denoise.
- Create a versioned workflow registry with model-family compatibility, required nodes/models, checksums, capabilities, and rollback target.
- Separate fresh generation, image-to-image revision, structural rebuild, and upscale contracts. Reject stale outputs.

Acceptance: 20 consecutive jobs without a lost output; a revision visibly changes and retains lineage; restart produces a recoverable state; every artifact has preview, reveal, download/save-as, metadata, and checksum.

## Phase 2 — v1.7 Reference Studio Execution

- Use Project → Subject → Reference Sheet → Shot → Variant hierarchy.
- Store approved views, appearance notes, palette, pose, environment, camera, lighting, model/workflow, and continuity locks.
- Add drag/drop, contact sheets, promote/reject, annotation, branching, A/B and four-up comparison.
- Execute the multi-shot queue with per-shot state, concurrency limits, retry, cancel, and resume.
- Add reference strength and denoise. Pilot IP-Adapter/ControlNet only after AMD/node and license verification.
- Add unload model, clear queue, close runtime session, and verified VRAM release while preserving archival lineage.

Exit: a five-shot character set maintains recognizable identity and styling, survives restart, and supports revision without losing lineage.

## Phase 3 — v1.8 Motion and Sound

### Video

- Prove one small maintained AMD-compatible ComfyUI workflow before adopting a family.
- Begin with short low-resolution clips and measured VRAM/RAM/disk ceilings.
- Add storyboard, duration, aspect, frame rate, motion, camera, reference frame, seed, and prompt controls.
- Preserve frames, encoded output, workflow, prompt, model, and hash provenance.
- Require cancel, timeout, retry, partial cleanup, and VRAM recovery.

CogVideoX and an LTX-family workflow remain pilots until the AMD path completes a real clip. Mochi is excluded from this 16 GB worker because its reference requirements exceed local capacity.

### Audio

- Complete local speech-to-text readiness and expose microphone/transcription health.
- Add a provider-neutral speech contract for local TTS and optional ElevenLabs.
- Treat narration, dialogue, effects, and final mux as separate reversible jobs.
- Archive source audio, cue/timing data, provider/model data, and final media.

Exit: a short storyboard becomes archived video with synchronized narration; either media leg can retry independently.

## Phase 4 — v2.0 Durable Agent Fabric

- Introduce local FastAPI only when multiple runtimes need one job/event API.
- Use SQLite for jobs, steps, artifacts, approvals, heartbeats, leases, and checkpoints.
- Define typed tools, timeouts, idempotency, bounded retry, and compensating actions.
- Keep the current bounded runner as control. Compare LangGraph only after resume and duplicate-prevention tests; do not run overlapping orchestrators.
- Put connectors behind one credential/permission interface; secrets stay in the OS credential store, never prompts, logs, artifacts, or Git.
- Add project scopes and a dry-run view of intended external actions.

Exit: interrupt, restart, and resume a multi-step job exactly once with a complete audit trail.

## Phase 5 — v2.1 Home Compute Fabric

- Inventory each Apple node: model, RAM, OS, network, disk, and thermal behavior.
- Keep independent Ollama/OpenAI-compatible endpoints as the dependable fallback.
- Pilot EXO only on compatible Apple silicon over wired Ethernet. It does not combine the Windows AMD ComfyUI GPU into the same model execution.
- Compare time-to-first-token, tokens/second, usable model size, power, stability, and recovery.
- Promote only with a measured benefit and automatic fallback.

## Interface overhaul

1. **Command deck:** live route/model/workflow selector, health, positive/negative prompts, `/`, `@`, spellcheck, keyboard send, attachments, preflight estimate.
2. **Live operations:** phase progress, elapsed/estimated time, queue, cancel/retry, node use, actionable errors.
3. **Artifact workspace:** universal image/video/audio/document viewers, download, reveal, compare, metadata, lineage, revision chat, archive search.
4. **Reference Studio:** projects, sheets, shot board, continuity, queues, compare/promote, memory release.
5. **Runtime center:** node health, models, workflows, disk/VRAM, verified downloads, pilot/promote/rollback, gaming mode.
6. **Agent center:** plans, tools, approvals, steps, recovery, connectors, logs, deliverables.
7. **Settings/onboarding:** discovery, endpoint tests, credentials, routes, accessibility, diagnostics, restore defaults.

## Commercial release gates

| Area | Gate |
|---|---|
| Functional | Automated suites and a real Windows generation smoke test pass. |
| Reliability | No lost jobs, duplicates, or unrecoverable sessions in restart/network-loss drills. |
| Performance | Responsive UI, accurate progress, and memory release after unload. |
| Compatibility | macOS and AMD Windows versions are pinned and reported. |
| Security | Keys/secrets stay out of Git/logs; SSH is controller-restricted; dependencies are scanned. |
| Privacy | Local/cloud route is explicit; storage location and provider are disclosed. |
| Accessibility | Keyboard operation, focus, scaling, contrast, reduced motion, and labels pass. |
| Packaging | Rollback retained; clean-install and upgrade drills pass; signing/notarization tracked. |
| Documentation | Operator, recovery, model, workflow, connector, and release evidence match the build. |

## Next upgrade queue

1. **P0:** finish passwordless SSH Remote Gate R0.
2. **P0:** install/verify Juggernaut XL and run the controlled comparison.
3. **P0:** live model selector plus provenance/parameter drawer.
4. **P0:** prove new revision render, lineage, persistence, and stale-output rejection.
5. **P1:** persistent queue, cancellation, retry, resume, and recovery ledger.
6. **P1:** connect Reference Studio data to real queued workflows.
7. **P1:** runtime center for manifests, compatibility, downloads, health, rollback, and gaming mode.
8. **P2:** one short AMD video workflow with resource recovery.
9. **P2:** local transcription plus provider-neutral narration/mux.
10. **P2:** FastAPI/SQLite job fabric after contracts stabilize.
11. **P3:** optional Apple EXO wired benchmark.

## Definition of complete

The overhaul is complete only when the installed launcher can submit and monitor each promoted job type, display and download every returned media type, preserve revision history, recover from app/worker/network interruption, release Windows GPU resources for gaming, report exact model/workflow provenance, and pass the release gates above. A model name in the UI or a downloaded file alone is not completion evidence.
