# Changelog

## 1.9.0

- Added an Ollama Command Center with balanced, precise, creative, coding, and agentic prompt profiles.
- Replaced generic compatibility chat with Ollama's native streaming API, separate thinking display, structured JSON mode, adjustable temperature/top-p/context/output/seed/keep-alive, and response performance metrics.
- Added capability-aware installed and loaded model telemetry, persistent per-model selection, refresh, and explicit model unload.
- Added natural-language `/agent` execution using an installed tool-capable Ollama model and the existing approved, bounded local-tool layer.
- Added Command/Ctrl+Enter transmit and Command/Ctrl+L composer-focus shortcuts.

## 1.8.3

- Clear now purges every provider conversation, drafts, temporary attachment indexes, creative-session pointers, Chromium conversation storage, and cache instead of clearing only the visible provider. Generated media stays in Archive.
- Added Clear All for a broader permanent wipe of conversations, generated images and videos, media prompts and job lineage, and Reference Studio records.
- Both privacy actions preserve API tokens, provider configuration, downloaded models, tool permissions, theme, view, and route preferences.

## 1.8.2

- Refreshes provider health and the model catalog immediately after Hugging Face authentication succeeds.

## 1.8.1

- Added an in-app Hugging Face setup dialog with the official router endpoint, configurable chat model, encrypted token storage, and a live authentication test.
- Removed the need to place a Hugging Face token in the repository `.env` file.
- Added actionable provider status while keeping the token out of renderer state and diagnostics.

## 1.8.0

- Completed local Whisper readiness discovery and exposed microphone permission, runtime, model, and ffmpeg health.
- Added provider-neutral narration/dialogue contracts for macOS local TTS and optional ElevenLabs.
- Added separate reversible transcription, narration, dialogue, effects, and mux job records.
- Added immutable audio artifact hashing with cue/timing, provider/model, source, lineage, and archive metadata.

## 1.7.0 — 2026-09-19

- Added Project → Subject → Reference Sheet → Shot → Variant hierarchy with schema-v1 migration.
- Added contact sheets, drag/drop imports, annotations, branching, promotion/rejection, and A/B or four-up comparison.
- Added executable multi-shot queues with concurrency, per-shot state, retry, cancel, resume, and persistent variants.
- Added continuity metadata, reference strength, denoise, live model/workflow selection, queue clearing, session closing, and VRAM release.
- Kept IP-Adapter and ControlNet visibly gated pending AMD node/model/license/workflow verification.

## 1.6.1 — 2026-09-19

- Fixed `/video` contract routing so it no longer reports video as an invalid media type.
- Added an accurate readiness response when the Windows worker lacks an approved local video workflow/model bundle.

## 1.6.0 — 2026-09-19

- Added durable, recoverable ComfyUI job ledger and six-stage progress reporting.
- Added cancel, retry, duplicate, resume, idempotency, lineage, and stale-output rejection.
- Added live checkpoint and generation parameter controls.
- Added versioned image, revision, rebuild, and upscale workflow contracts.
- Added artifact reveal, metadata, checksum, recovery, and revision controls.
- Passed 54 automated tests and a 20-job live AMD ComfyUI acceptance run.

## 1.3.0 — 2026-09-19

- Added a private-LAN-only ComfyUI connector for one-prompt image and video jobs.
- Added reviewed API-workflow boundaries, artifact hashing, and local output storage.
- Added connector health telemetry and `/image`, `/video`, and `/agent diagnostics` prompt routes.
- Added a bounded agent runner with allowlisted tools, eight-step/two-minute limits, and layered approvals.
- Added a Windows ComfyUI bootstrap script that installs the framework without guessing or downloading model weights.
- Added the researched creative-agent architecture, acceptance gates, licensing boundaries, and upgrade backlog.
- Added fixture coverage for URL containment, workflow substitution, queue/poll/download, artifact hashing, agent limits, and approvals.
- Added user-data connector settings and validated the live Windows AMD ROCm worker channel.

## 1.0.6

- Throttled optional 3D hologram rendering to reduce steady GPU and renderer load.

## 1.0.5

- Stopped ordinary launcher clicks from rebuilding and replacing the running app.
- Stopped command suggestions from opening or selecting anything on an empty prompt.
- Restored the supplied Master Chief mascot as the interactive 3D identity instead of drawing a generic officer over it.
- Reduced 3D pixel density and paused rendering while hidden.

## 1.0.4

- Replaced the placeholder officer with the supplied Master Chief bot artwork.
- Added interactive command states, automatic time-of-day themes, and Light/Dark overrides.
- Added accessible controls, compact-window behavior, cancellation, and provider-specific chat history.
- Enabled renderer sandboxing and background throttling, removed perpetual idle animations, and added a packaged macOS build.

## 1.0.3 — 2026-09-12

- Added original full-body Master Chief AI hologram artwork to the repository and application.
- Added subtle idle float and pulse animation for the static hologram.
- Added asset provenance, generation prompt, runtime role, and acceptance checks.
- Preserved the SVG fallback for missing or damaged artwork.

## 1.0.2 — 2026-09-12

- Removed an accidental square preview duplicate from the release package.
- Kept the verified 16:9 PAPM visual brief as the canonical image.

## 1.0.1 — 2026-09-12

- Added Codex Desktop as the recommended working AI route using the existing ChatGPT/Codex login.
- Added provider health chips for Codex, OpenAI, Grok, and GitHub repository authentication.
- Moved credentials and provider calls out of the renderer into the Electron main process.
- Removed the retired GitHub Models inference option.
- Added local per-provider conversation history and single-instance focus behavior.
- Updated Electron and removed vulnerable dependencies; `npm audit` reports zero vulnerabilities.
- Added the PAPM program plan, system flow/UML, visual brief, and technical learning guide.
- Added a reliable macOS launcher script.
