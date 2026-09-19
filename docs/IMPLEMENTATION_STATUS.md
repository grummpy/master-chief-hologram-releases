# Implementation Status

Version 1.3.0 · 2026-09-19

## Completed in the current increments

- Safe fast-forward Git update/build/launch helper with single-bundle Desktop policy.
- Provider validation, bounded messages, credential redaction, and smoke tests.
- Codex, OpenAI, Grok, Ollama, and Hugging Face endpoint routing.
- Dynamic Ollama/Hugging Face model catalog refresh.
- Browser recording with local whisper.cpp detection, ffmpeg conversion, and OpenAI fallback.
- Microphone state, transcript insertion, accessibility labels, keyboard command palette, diagnostics refresh, history migration, and JSON export.
- Local TXT/MD/JSON/CSV attachment context with size limits and removable chips.
- Streaming deltas and cancellation events for compatible providers.
- Encrypted credential storage with safe environment fallback and migration tests.
- Deterministic asset validation and release checklist.
- Persistent local RAG index with chunked lexical retrieval, local feature-vector similarity, schema migration, and attachment provenance. Document text remains on-device.
- Local voice readiness diagnostics for whisper.cpp, model files, and ffmpeg.
- Deterministic voice fixture contract and an in-app self-test that never records audio or calls a transcription provider.
- Explicit tool risk classes and approval controls in the UI.
- Tool registry now exposes capability scope and risk labels; approval-required actions remain opt-in and persist per user profile.
- Tool access UI shows per-capability scope, risk class, and explicit approval state.
- Local tool execution is restricted to a fixed, tested adapter catalog: runtime details and an approval-gated `git status --short --branch` scoped to this project. Each execution, denial, and failure receives a secret-free local audit event. Arbitrary shell commands and network mutations are not exposed.
- The compose panel has deterministic, no-provider command autocomplete with keyboard selection and insertion.
- A healthy local Ollama route is the default and first option for Master Chief. If it is unavailable, the app stops with a local recovery message; it never silently sends the prompt to a paid cloud route.
- The versioned local-AI manifest records the localhost-only Ollama runtime and the owner-installed micro-local model. It distinguishes local development use from model redistribution, which still requires license review.
- Local Ollama executions now create a redacted on-device runtime ledger with model, outcome, and latency only. The launcher icon source set has a deterministic size audit and a separate human-review sheet; no approved artwork was replaced.
- The local-AI evaluation pack uses synthetic cases only and records the current micro-model’s bounded scope. It does not treat a local response as proof of broad reasoning capability.
- Master Chief responses can expose safe, clickable local artifact links for existing files under the Desktop repository's `docs/`, `artifacts/`, and `exports/` roots. Path traversal and other repository paths are rejected.
- The microphone flow requests macOS access before browser capture, reports denied/restricted access plainly, and opens the macOS Microphone privacy pane for recovery. The bundle explicitly declares why it needs microphone access. Offline whisper.cpp with the English base model is installed in Application Support; microphone audio never falls back to paid cloud transcription automatically.
- The hologram stage has an optional local Three.js WebGL scene with an original low-poly seated command companion and chair. It responds to pointer movement, command states, and clicks; the 2D state artwork remains the persistent fallback. The companion is a code-built interactive prototype, not a flat image presented as a 3D model.
- Separate PAPM plans now baseline graphics/3D, local-AI-first operation, and army skills/training. Local Ollama is the recommended route for lightweight prompts; Apache Spark is not part of the interactive runtime and is only a future owner-operated LAN batch option.
- The one-prompt creative route recognizes `/image` and `/video`, invokes only an approved ComfyUI API workflow on a configured private-LAN worker, downloads the result into `artifacts/generated`, and records a SHA-256 hash. It never chooses a cloud fallback.
- The connector panel exposes ComfyUI readiness. Missing worker inventory and missing reviewed workflows are explicit blocking states rather than guessed installations.
- The bounded agent executor accepts typed plans of at most eight allowlisted steps and two minutes. Agent approval and each underlying tool approval are enforced in the Electron main process; arbitrary shell commands and arbitrary URLs remain unavailable.
- A Windows PowerShell bootstrap installs the official ComfyUI framework without model weights. Live image/video selection remains gated on Windows GPU model, VRAM, disk, IP, workflow, and license inventory.
- The verified Windows worker is `192.168.4.31:8188`: ComfyUI 0.36.0, Python 3.13.15, PyTorch 2.13.0 + ROCm 10.0, and AMD Radeon RX 9060 XT with 15.9 GiB reported VRAM. TCP, `/system_stats`, `/queue`, and a harmless rejected `/prompt` contract test passed from the Mac controller.

## Evidence

`npm test` passes 39/39. Asset and visual-contract gates pass. JavaScript syntax checks, package inspection, and `git diff --check` pass. `npm run dist:mac` produces `dist/mac-arm64`. Live UI inspection confirmed v1.3.0, ComfyUI status, the prompt help, and both new approvals. The npm advisory endpoint returned HTTP 503 maintenance during this release run, so the dependency advisory check is recorded as temporarily unverified rather than passed.

## Next critical path

Capture the Windows GPU inventory, reserve its LAN address, restrict Windows Firewall port 8188 to the controller, select licensed image/video models, export reviewed API workflows, and run real GPU fixtures. Then add progress/cancellation, Comfy API v2 durability, ElevenLabs TTS, and adversarial evaluation before allowing a language model to author agent plans. Signed/notarized distribution remains blocked on a Developer ID Application certificate.
