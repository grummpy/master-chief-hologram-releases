# Changelog

## 1.20.0

- Added fixed-command SSH controls for restarting, stopping, and resuming the private Windows ComfyUI worker.
- Added explicit operator confirmations, queue-empty interlocks, disabled controls while actions run, and bounded operation audit events.
- Added a gaming handoff that verifies the worker process exited before reporting its GPU allocation released.
- Added SSH channel identity, scheduled-task evidence, and a bounded five-entry endpoint history to Runtime Center.
- Reduced Windows status output to structured operational evidence before it crosses into the renderer.
- Corrected the Windows background task to run through a hidden VBS wrapper in the signed-in GPU user's session; the prior SYSTEM/direct-console task could lose AMD access or exit after the SSH session closed.

## 1.19.0

- Added a read-only Runtime Center for the private Windows ComfyUI worker.
- Runtime evidence now includes the active endpoint, ComfyUI/Python/PyTorch versions, system RAM, GPU/VRAM, queue depth, and installed checkpoints.
- Added refresh, endpoint configuration, and open-worker actions while deliberately excluding restart and gaming-mode mutations from this visibility-first release.
- Bounded all worker-provided labels and checkpoint results before displaying them in the app.

## 1.18.0

- Added self-service ComfyUI private-worker endpoint configuration to Systems and Creative connectors.
- The app validates private-network URLs and performs a live ComfyUI health check before saving or switching the active worker.
- A verified endpoint takes effect immediately without restarting Master Chief; invalid or unreachable endpoints leave the working route unchanged.
- Connector setup now hides the credential field for local runtimes that require an endpoint rather than a secret.

## 1.17.0

- Added a private, localhost-only SearXNG metasearch service backed by an automatically starting Colima/Docker runtime.
- Local agent research now prefers SearXNG and falls back to the existing free public endpoints only when the local service is unavailable.
- Added SearXNG runtime health and connector capability reporting to the app.
- Added source normalization, URL validation, deduplication, bounded result handling, and explicit privacy limitations for search results.

## 1.16.0

- Added combined previews for atomic patch sets spanning up to ten different project files.
- Multi-file apply verifies every source hash before writing any file and restores partial writes if a filesystem failure occurs.
- Whole-set rollback refuses to overwrite newer work when any applied file has changed.
- Added separate Tool Access approvals and typed Ollama tools for multi-file preview, apply, and rollback.

## 1.15.0

- Added durable, quiet health monitors for local Ollama and the private-LAN Windows ComfyUI worker.
- Monitors notify only after the initial baseline when health state or its diagnostic label changes.
- Added monitor create, pause, resume, cancel, status, last-check, next-check, and bounded history controls to Files → Scheduled.
- Added typed Ollama tools and separate Tool Access approvals for listing, creating, and managing local runtime monitors.

## 1.14.0

- Added a durable local reminder scheduler with native macOS notifications, one-time and repeating jobs, restart recovery, execution history, and overdue-run reconciliation.
- Replaced the passive Scheduled workspace with a working reminder manager supporting create, pause, resume, cancel, status, next-run time, and history counts.
- Added typed Ollama agent tools for listing, creating, and managing reminders behind separate Tool Access approvals.
- Reminder text and state remain local and are never sent to a model when created from the Scheduled workspace.

## 1.13.0

- Added a durable, bounded repository editing sequence for the local Ollama agent: exact replacement preview, readable diff, hash-verified apply, and hash-verified rollback.
- Preview and rollback receipts survive application restarts in private local application storage.
- Stale previews and rollback attempts fail closed when a file has changed, preserving newer work.
- Added separate Tool Access approvals and Ollama tool schemas for preview, apply, and rollback.

## 1.12.3

- Made configurable Systems health rows and Creative connector rows open the credential setup dialog directly with the selected service preloaded.
- Credentials remain in the encrypted local credential store, and saving immediately refreshes provider and connector health.
- Preserved truthful follow-up states for services that require more than an API token, including Gmail OAuth consent and Suno endpoint verification.

## 1.12.2

- Fixed the Plugins workspace so it traverses the Codex cache hierarchy and lists installed plugin packages instead of only showing the `cache` directory.
- Added plugin source, installed version, and available package description to the workspace catalog.

## 1.12.1

- Fixed Files mode so the Commander Nova hologram panel is fully removed rather than visually overlapping the workspace.
- Added Codex-style New chat, Pull requests, Scheduled, Plugins, Explore, recent conversations, and Projects navigation.
- Added read-only discovery of local automation and plugin libraries plus direct access to the private repository pull-request page.
- New chat now archives the current conversation locally for reopening instead of destroying it.

## 1.12.0

- Added a three-mode left rail: Professional, Personal, and a full Projects file browser.
- Removed the personal-view overlay banner so Commander Nova remains unobstructed.
- Added protected Projects storage that is explicitly preserved by Clear and Clear All.
- Added right-side Systems, Preview, and Activity workspaces with media review and Save to Project actions.
- Added encrypted, unified connector setup for Gemini, Gmail OAuth credentials, Suno, Cursor, OpenAI, xAI, GitHub, ElevenLabs, and Hugging Face.
- Added Google Gemini chat routing through Google's OpenAI-compatible API while preserving explicit cloud-send confirmation.
- Added honest Gmail OAuth, Cursor CLI, and Suno readiness states without claiming incomplete integrations are operational.
- Added one bounded automatic retry for transient provider failures with visible recovery activity.

## 1.11.0

- Expanded the Ollama agent with local attachment search, connector diagnostics, and downloadable artifact creation.
- Added a live connector catalog for Ollama, Codex, Hugging Face, OpenAI, xAI, GitHub, ComfyUI, and ElevenLabs.
- Added visible connector cost classes and kept the automatic Ollama agent loop local-only and provider-charge-free.
- Increased bounded local tool-loop depth from four to eight turns for multi-step work.
- Added Qwen3 8B as the preferred local tool-calling tier once its local installation is verified.
- Added a no-key public research tool using fixed DuckDuckGo Instant Answer and Wikipedia endpoints; it never falls back to a paid AI provider.
- Corrected ElevenLabs telemetry so local macOS speech no longer makes the cloud connector appear configured.
- Added strongest-tool-model selection so local agent work prefers Qwen3 8B over micro models once installed.
- Added a bounded local code loop: exact one-match repository patches with before/after hashes plus a fixed `npm test` command.
- Added cost class directly to the provider selector and one-time cloud-send confirmation.
- Corrected packaged-app repository routing so local Git, edit, test, and explicitly selected Codex work target the Desktop source repository rather than the read-only app bundle.
- Added a single-file HTTP Range server for resumable private-LAN transfers of large verified model checkpoints to Windows BITS.

## 1.10.1

- Added a truthful Codex-to-Ollama capability parity matrix.
- Expanded Ollama's bounded agent tools with project file listing, bounded project text reads, and generated-artifact inventory.
- Added path-containment, text-size, approval, audit, and regression coverage for the new local tools.

## 1.10.0

- Added deterministic local Word, Excel, PowerPoint, Python, R, and SQL artifact routes with Open, Reveal, Save As, hashes, and explicit slash commands.
- Added local multi-file and drag/drop ingestion for Office, PDF, OpenDocument, EPUB, RTF, structured text, source code, and arbitrary metadata-only binary attachments up to 25 MB each.
- Added Ollama JSON-schema artifact specifications, executable-code validation requirements, and one bounded Python/R repair pass when explicit input rejection is missing.
- Added a versioned 100-point Ollama evaluation with an in-app Run 90% Check control, persistent evidence, and PASS/HOLD status.
- Verified live Excel and PowerPoint generation plus round-trip parsing, Python compilation/execution, R source generation, and a 100/100 `dolphin3:8b` synthetic gate.
- Added dependency overrides for patched `image-size` and `uuid` releases; the production dependency audit reports zero known vulnerabilities.

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
