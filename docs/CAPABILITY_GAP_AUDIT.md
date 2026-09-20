# Master Chief Capability and Jarvis Code Audit

Assessed: 2026-09-20T15:18:33.061Z
Weighted capability score: **80.4/100**
Benchmark: Codex-style dependable local-first command center

This is an evidence-based engineering assessment, not a claim of model parity. The deeper code review supersedes earlier scores where integration evidence was incomplete.

## Coverage evidence

Measured module coverage: 95.98% lines, 68.12% branches, 88.89% functions.
Important limitation: Core Electron main, preload, renderer, and Reference Studio files are not present in the coverage table.

## Capability assessment

| Area | Current | Target | Remaining gap |
|---|---:|---:|---|
| Reasoning and answer quality | 82 | 100 | Render and act on response-quality results; add model-graded domain and citation-entailment benchmarks. |
| Context and durable memory | 88 | 100 | Add provenance-aware memory summaries, migration failure reporting, and retrieval regression suites. |
| Agent planning and recovery | 80 | 100 | Resume the exact interrupted tool step instead of returning the objective to the composer. |
| Tools and connectors | 79 | 100 | Finish MCP initialization, discovery, per-tool approval, invocation UI, transport support, and authentication. |
| Files and artifact production | 84 | 100 | Add live editing, preview diffs, and round-trip fidelity tests for every generated office format. |
| Research and evidence | 78 | 100 | Revalidate every redirect and resolved address, preserve source links, and verify citations against page text. |
| Image, audio, and video understanding | 76 | 100 | Use a dedicated vision permission and model selector; finish the external AMD video bundle and acceptance run. |
| Reliability and self-repair | 84 | 100 | Exercise crash-loop recovery, clear timers on shutdown, and rehearse automatic last-known-good rollback. |
| Ease of use and accessibility | 82 | 100 | Replace prompt-based setup with validated forms and add keyboard plus screen-reader end-to-end tests. |
| Release and operations | 62 | 100 | Hash the packaged app, verify signatures in CI, obtain Developer ID, notarize, and test the installed bundle. |

## Verified code findings

| Severity | Area | Evidence | Required improvement |
|---|---|---|---|
| CRITICAL | Research and evidence | main.js:1424 follows redirects after validating only the initial URL. | Disable automatic redirects; validate every Location target and resolved IP before each bounded fetch. |
| CRITICAL | Release and operations | scripts/generate-release-manifest.js hashes three source metadata files, not the packaged .app or app.asar. | Generate SHA-256 values after packaging for the app archive and app.asar; verify them before installation and in CI. |
| HIGH | Tools and connectors | renderer.js registers an MCP endpoint but never calls listMcpTools, setMcpPermission, callMcpTool, removeMcpServer. | Build a typed MCP server/tool screen with initialize handshake, discovery, approval, invocation, disable, and removal. |
| HIGH | Tools and connectors | main.js callMcp assumes every response is JSON although the Accept header includes text/event-stream. | Implement MCP Streamable HTTP/SSE framing, protocol initialization, timeouts, cancellation, and structured errors. |
| HIGH | Reasoning and answer quality | main.js attaches result.quality; renderer.js never reads result.quality. | Show quality evidence, allow review/retry, and keep low-confidence output from being presented as silently verified. |
| HIGH | Reliability and self-repair | Coverage reports 95.98% only for imported modules; main.js, preload.js, renderer.js, and reference-studio.js are absent. | Add Electron integration tests that launch the packaged app and exercise every IPC, clear/restart, attachment, agent, and media journey. |
| HIGH | Agent planning and recovery | agent-task-ledger.js resume changes status to understanding; renderer.js places the original objective back in the composer. | Persist the completed-step cursor, inputs, receipts, and compensation state; resume from the first incomplete step with the same idempotency key. |
| MEDIUM | Image, audio, and video understanding | main.js analyzeLocalImage requires files.attach_local_text and silently chooses the first vision-capable model. | Create a dedicated local-vision permission, explicit model selection, configurable analysis instruction, and image-result evaluation. |
| MEDIUM | Reliability and self-repair | Reference preview and state-load paths contain empty catch blocks that suppress actionable failures. | Record bounded diagnostics and show recoverable UI errors instead of silently dropping failed previews or migrations. |
| MEDIUM | Maintainability | main.js is 1,875 lines/152 KB and renderer.js is 108 KB with many one-line functions. | Split provider, IPC, privacy, research, media, and renderer controllers into typed modules with dependency injection. |
| MEDIUM | Verification | Overall branch coverage is 68.12%; web-evidence is 28.57%, provider-contract 36.36%, and extension-sdk 42.86%. | Raise branch coverage on network, credential, parsing, extension, and failure paths to at least 85%. |
| EXTERNAL | Release and operations | Release readiness reports no Apple Developer ID Application identity; current package is ad hoc signed. | Install the owner Developer ID certificate, notarize, staple, and verify with codesign and spctl before distribution. |

## Unified upgrade list

1. **[code-audit · critical] Research and evidence** — Disable automatic redirects; validate every Location target and resolved IP before each bounded fetch. Evidence: main.js:1424 follows redirects after validating only the initial URL.
2. **[code-audit · critical] Release and operations** — Generate SHA-256 values after packaging for the app archive and app.asar; verify them before installation and in CI. Evidence: scripts/generate-release-manifest.js hashes three source metadata files, not the packaged .app or app.asar.
3. **[code-audit · high] Tools and connectors** — Build a typed MCP server/tool screen with initialize handshake, discovery, approval, invocation, disable, and removal. Evidence: renderer.js registers an MCP endpoint but never calls listMcpTools, setMcpPermission, callMcpTool, removeMcpServer.
4. **[code-audit · high] Tools and connectors** — Implement MCP Streamable HTTP/SSE framing, protocol initialization, timeouts, cancellation, and structured errors. Evidence: main.js callMcp assumes every response is JSON although the Accept header includes text/event-stream.
5. **[code-audit · high] Reasoning and answer quality** — Show quality evidence, allow review/retry, and keep low-confidence output from being presented as silently verified. Evidence: main.js attaches result.quality; renderer.js never reads result.quality.
6. **[code-audit · high] Reliability and self-repair** — Add Electron integration tests that launch the packaged app and exercise every IPC, clear/restart, attachment, agent, and media journey. Evidence: Coverage reports 95.98% only for imported modules; main.js, preload.js, renderer.js, and reference-studio.js are absent.
7. **[code-audit · high] Agent planning and recovery** — Persist the completed-step cursor, inputs, receipts, and compensation state; resume from the first incomplete step with the same idempotency key. Evidence: agent-task-ledger.js resume changes status to understanding; renderer.js places the original objective back in the composer.
8. **[code-audit · medium] Image, audio, and video understanding** — Create a dedicated local-vision permission, explicit model selection, configurable analysis instruction, and image-result evaluation. Evidence: main.js analyzeLocalImage requires files.attach_local_text and silently chooses the first vision-capable model.
9. **[code-audit · medium] Reliability and self-repair** — Record bounded diagnostics and show recoverable UI errors instead of silently dropping failed previews or migrations. Evidence: Reference preview and state-load paths contain empty catch blocks that suppress actionable failures.
10. **[code-audit · medium] Maintainability** — Split provider, IPC, privacy, research, media, and renderer controllers into typed modules with dependency injection. Evidence: main.js is 1,875 lines/152 KB and renderer.js is 108 KB with many one-line functions.
11. **[code-audit · medium] Verification** — Raise branch coverage on network, credential, parsing, extension, and failure paths to at least 85%. Evidence: Overall branch coverage is 68.12%; web-evidence is 28.57%, provider-contract 36.36%, and extension-sdk 42.86%.
12. **[capability] Files and artifact production** — Add live editing, preview diffs, and round-trip fidelity tests for every generated office format.
13. **[capability] Context and durable memory** — Add provenance-aware memory summaries, migration failure reporting, and retrieval regression suites.
14. **[capability] Ease of use and accessibility** — Replace prompt-based setup with validated forms and add keyboard plus screen-reader end-to-end tests.
15. **[code-audit · external] Release and operations** — Install the owner Developer ID certificate, notarize, staple, and verify with codesign and spctl before distribution. Evidence: Release readiness reports no Apple Developer ID Application identity; current package is ad hoc signed.
