# Implementation Status

Version 1.3 · 2026-09-12

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

## Evidence

`npm test` passes (run the current suite before release). JavaScript syntax checks and `git diff --check` pass. `npm run dist:mac` produces `dist/mac-arm64`; `npm run launch:mac` updates and launches the Desktop bundle. Live UI inspection must confirm provider choices, ATTACH, MIC, Transmit, command palette, and tool-access scope/risk labels.

## Next critical path

Signed/notarized distribution, real end-to-end audio fixtures, packaged whisper.cpp models, higher-fidelity local embeddings, full MCP execution adapters, and automated visual regression. These remain intentionally separate increments because they add native dependencies, permissions, or durable data contracts.
