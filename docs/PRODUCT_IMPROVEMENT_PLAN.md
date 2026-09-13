# Master Chief Hologram — Product Improvement Plan

Version 1.0 · 2026-09-12 · PAPM/Master Chief research baseline

## Mission and success measures

Turn the current single-user Electron hologram into a dependable, local-first AI command center that can combine cloud providers with Hugging Face and other local models.

Success measures for the first production release: voice-to-text success ≥95% in a supported macOS test set; first visible response ≤2 seconds for streaming providers; zero credential leakage in logs or renderer; one reproducible launcher; crash-free smoke sessions ≥99%; and every shipped feature mapped to an acceptance test.

Constraints: macOS Apple Silicon is the current target; the app must remain usable without a cloud model when a local runtime is installed; secrets stay outside the bundle; artwork provenance and licensing must remain documented; estimates below are engineering estimates, not vendor quotes.

## Research that changes the design

- [Open WebUI](https://github.com/open-webui/open-webui) demonstrates a mature self-hosted pattern: OpenAI-compatible providers, Ollama, MCP/tools, RBAC, RAG, web search, multimodel conversations, voice/video, and local/offline operation.
- [Jan](https://github.com/janhq/jan) demonstrates a desktop-first local model path using LlamaCPP/MLX, Hugging Face model IDs, an OpenAI-compatible API, and MCP.
- [Ollama](https://github.com/ollama/ollama) is a practical local model server/API integration target.
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) provides Apple-Silicon-optimized, offline ASR with VAD; its streaming example directly covers microphone input.
- [Transformers.js](https://github.com/huggingface/transformers.js) supports browser/Node inference for text, audio ASR, TTS, vision, embeddings, and ONNX models.
- [WebLLM](https://github.com/mlc-ai/web-llm) supports WebGPU-local inference, OpenAI-compatible APIs, streaming, JSON mode, workers, and Hugging Face/MLC model artifacts.
- [LobeChat](https://github.com/lobehub/lobe-chat) provides reference patterns for multimodel UX, voice, multimodal input, artifacts, knowledge bases, and local providers.

These are reference architectures, not dependencies to copy wholesale. Adoption decisions require license, maintenance, platform, memory, and security review.

## Top 100 prioritized upgrades

Priority: P0 = release blocker, P1 = next production increment, P2 = valuable expansion, P3 = later optimization. Effort is relative: S (1–3 days), M (1–2 weeks), L (2–6 weeks).

### A. Reliability, launch, and release

1. **P0/M** Separate updater helper checks Git, fast-forwards safely, builds, swaps the app, and relaunches.
2. **P0/S** Keep exactly one Desktop launcher and archive older bundles outside Desktop.
3. **P0/S** Add single-instance lock and focus/raise behavior tests.
4. **P0/S** Add startup health screen with version, commit, provider, microphone, and model status.
5. **P0/M** Add signed/notarized macOS release workflow.
6. **P0/S** Add deterministic `npm ci` and package smoke test in CI.
7. **P1/S** Add crash recovery and last-session restoration.
8. **P1/M** Add automatic rollback to the last known-good bundle.
9. **P1/S** Add structured redacted local logs with rotation.
10. **P1/M** Add consent-based crash reports and diagnostics export.

### B. Voice and audio

11. **P0/M** Make local whisper.cpp the offline ASR fallback.
12. **P0/S** Show recording level, elapsed time, and explicit recording state.
13. **P0/S** Add Escape and second-click stop controls.
14. **P0/S** Preserve interim transcript while recording and final transcript on stop.
15. **P0/S** Detect silence/no speech and provide recovery guidance.
16. **P1/M** Add language and locale selection.
17. **P1/M** Add push-to-talk global hotkey.
18. **P1/M** Add wake-word mode with explicit privacy indicator.
19. **P1/M** Add streaming partial transcription.
20. **P1/M** Add TTS with queue, stop, replay, and voice selection.

### C. Model and provider integration

21. **P0/M** Add Ollama provider discovery and model list.
22. **P0/M** Add Hugging Face model catalog with hardware/size filters.
23. **P0/M** Add Jan/llama.cpp OpenAI-compatible endpoint configuration.
24. **P1/M** Add WebLLM/WebGPU local provider behind a capability check.
25. **P1/S** Add provider adapter contract with streaming, cancellation, usage, and errors.
26. **P1/M** Add model download, checksum, disk-space, and resume management.
27. **P1/M** Add per-model context, temperature, top-p, seed, and system prompt settings.
28. **P1/S** Add model capability badges: vision, tools, JSON, embeddings, audio.
29. **P1/M** Add automatic routing by task, latency, privacy, and availability.
30. **P2/M** Add ensemble/parallel responses with user-selected merge policy.

### D. Agent orchestration and tools

31. **P0/M** Implement the Context Manager → PAPM → use case → specialist contract in MC Mode.
32. **P0/M** Add bounded tool registry with allowlists and schemas.
33. **P0/M** Add explicit approval gates for filesystem, network, and external mutations.
34. **P1/M** Add MCP client support with per-server permissions.
35. **P1/M** Add task graph execution with retries and cancellation.
36. **P1/S** Add visible plan, current step, and handoff timeline.
37. **P1/M** Add specialist result reconciliation into one baseline.
38. **P1/M** Add durable task/run IDs and resumable jobs.
39. **P2/M** Add sandboxed terminal/code execution.
40. **P2/M** Add scheduled monitors and upgrade standby jobs.

### E. Knowledge, files, and RAG

41. **P1/M** Add drag-and-drop file attachments.
42. **P1/M** Add local text/PDF/HTML/Markdown extraction.
43. **P1/M** Add local embeddings and vector index.
44. **P1/M** Add citations with source and chunk references.
45. **P1/M** Add knowledge collections and per-chat scope.
46. **P1/M** Add hybrid BM25/vector retrieval and reranking.
47. **P1/S** Add indexing progress, pause, retry, and deletion.
48. **P2/M** Add Git repository indexing with branch/ref provenance.
49. **P2/M** Add web retrieval with domain and freshness controls.
50. **P2/M** Add multimodal image/audio/document understanding.

### F. Conversation and memory

51. **P0/S** Add reliable local persistence with schema versioning and migration.
52. **P1/M** Add searchable conversation history.
53. **P1/S** Add rename, pin, archive, export, and delete-with-recovery.
54. **P1/M** Add conversation branching and compare views.
55. **P1/M** Add per-model and per-task system profiles.
56. **P1/M** Add explicit short-term/long-term memory controls.
57. **P1/S** Add context budget meter and compaction preview.
58. **P2/M** Add user-approved memory extraction and edit screen.
59. **P2/M** Add import/export in JSON and Markdown.
60. **P2/M** Add encrypted local database and keychain integration.

### G. UX and accessibility

61. **P0/S** Make MIC, Transmit, Cancel, and Clear states visually distinct and keyboard accessible.
62. **P0/S** Add focus management after recording, errors, and responses.
63. **P0/S** Add compact/expanded layout modes.
64. **P1/S** Add command suggestions and recent commands.
65. **P1/S** Add slash commands and command palette.
66. **P1/M** Add responsive resizing with readable minimum sizes.
67. **P1/S** Add reduced-motion, high-contrast, and font-size settings.
68. **P1/M** Add screen-reader labels for every state and action.
69. **P1/M** Add onboarding that tests provider and microphone readiness.
70. **P2/M** Add mobile/web companion view over a local authenticated endpoint.

### H. Visuals, hologram, and media

71. **P0/S** Create one source-of-truth icon master and generate all macOS sizes.
72. **P0/S** Validate transparent padding, Retina rendering, and launcher cache refresh.
73. **P1/M** Replace static-only state changes with a lightweight animation fallback.
74. **P1/S** Add explicit loading/error art for missing assets.
75. **P1/M** Add visual state specification and asset regression snapshots.
76. **P1/M** Add user-selectable hologram themes and intensity.
77. **P1/M** Add audio-reactive glow while recording and speaking.
78. **P2/M** Add generated background scenes with provenance records.
79. **P2/L** Add optional 3D/WebGL hologram mode with performance fallback.
80. **P2/M** Add visual accessibility descriptions and non-color status cues.

### I. Security, privacy, and governance

81. **P0/S** Move all credentials to macOS Keychain or secure storage.
82. **P0/S** Redact keys, audio, file paths, and prompts from logs by default.
83. **P0/M** Add network destination allowlist and provider data disclosure panel.
84. **P0/M** Add threat model for tools, MCP, downloaded models, and update supply chain.
85. **P1/S** Add model/license/provenance inventory.
86. **P1/M** Add prompt-injection defenses for files, web pages, and tool output.
87. **P1/S** Add data retention and “delete all local data” controls.
88. **P1/M** Add signed update manifest and hash verification.
89. **P1/M** Add permission audit screen for microphone, files, and network.
90. **P2/M** Add enterprise policy profiles and audit export.

### J. Quality, operations, and ecosystem

91. **P0/S** Add unit tests for provider adapters and transcript insertion.
92. **P0/M** Add end-to-end microphone fixture tests with synthetic audio.
93. **P0/S** Add visual smoke tests for light/dark/all states.
94. **P1/M** Add latency, token, memory, and CPU telemetry with opt-in collection.
95. **P1/M** Add model evaluation set for command following, refusal, tools, and citations.
96. **P1/M** Add upgrade compatibility matrix for Electron, macOS, providers, and models.
97. **P1/S** Add release checklist and signed artifact manifest.
98. **P2/M** Add plugin SDK and versioned extension API.
99. **P2/M** Add community model/provider recipes with review status.
100. **P2/M** Add public issue templates, security policy, contribution guide, and changelog automation.

## Plan of action and gates

**Phase 0 — baseline (week 1):** freeze requirements, capture current metrics, clean Desktop launchers, add CI syntax/package smoke tests, and complete the security/license inventory. Gate: reproducible build and one known-good rollback bundle.

**Phase 1 — dependable core (weeks 2–4):** ship updater helper, provider contract, Ollama/Hugging Face discovery, local ASR fallback, transcript tests, permission UX, and keyboard/focus fixes. Gate: 20-phrase synthetic audio set ≥95% transcript insertion; no credential exposure; single-launcher test passes.

**Phase 2 — useful command center (weeks 5–8):** add streaming responses, cancellation, task graph, MCP permissions, file/RAG foundations, searchable history, and diagnostics. Gate: failure/recovery scenarios pass and all tool calls show approval state.

**Phase 3 — production surface (weeks 9–12):** add signed/notarized release, model management, memory controls, accessibility modes, asset regression, telemetry opt-in, and evaluation suite. Gate: release checklist, upgrade/rollback rehearsal, and documented residual risks.

**Phase 4 — expansion (quarter 2):** WebLLM/WebGPU, whisper.cpp streaming, TTS, multimodal RAG, plugin SDK, companion view, and optional 3D hologram. Gate each feature independently; do not let visual expansion delay voice, security, or release reliability.

## Decision log and open questions

Recommended architecture: retain Electron for the desktop shell, use a provider adapter boundary, support Ollama/Jan/llama.cpp first, add whisper.cpp for offline ASR, and evaluate Transformers.js/WebLLM for optional in-process Hugging Face inference. This balances current code reuse with local-first capability and a reversible migration path.

Open decisions: minimum macOS version; whether cloud transcription is allowed; target model sizes and disk budget; distribution channel; update signing identity; whether public branding needs legal review; and whether the app will remain single-user or gain multi-user policy controls.

## PAPM orchestration record

PAPM owns this baseline and the WBS. Master Chief routes Jarvis (architecture, provider/update/security implementation), Leonardo (visual system and asset QA), Chief UX (interaction/accessibility), Prompt Engineering (contracts/evals/injection defenses), Lieutenant Quality/Test Pilot (verification), Chief Operations/DevSecOps (release/rollback/observability), Sergeant Major Security/Staff Judge Advocate (threat and licensing review), Warrant Officer Data (RAG/data lineage), Quartermaster (model/storage/licensing), and Training Officer (operator guide). Each lane must return evidence against the numbered requirements before integration.
