# Master Chief Capability and Jarvis Code Audit

Assessed: 2026-09-20T16:00:41.486Z
Weighted capability score: **90.5/100**
Benchmark: Codex-style dependable local-first command center

This is an evidence-based engineering assessment, not a claim of model parity. The deeper code review supersedes earlier scores where integration evidence was incomplete.

## Coverage evidence

Measured module coverage: 95.94% lines, 67.52% branches, 89.65% functions.
Important limitation: Core Electron main, preload, renderer, and Reference Studio files are not present in the module coverage table.

## Capability assessment

| Area | Current | Target | Remaining gap |
|---|---:|---:|---|
| Reasoning and answer quality | 88 | 95 | Add a versioned domain evaluation set, citation-entailment checks, and answer comparison in the primary chat. |
| Context and durable memory | 90 | 95 | Add reusable knowledge collections with chunk/source inspection, reindex controls, and migration-failure reporting. |
| Agent planning and recovery | 96 | 95 | Add packaged Electron restart journeys for exact-step resume and mutation receipt review. |
| Tools and connectors | 93 | 95 | Add OAuth and stdio MCP transports, per-chat tool enablement, argument preview, and provider-loop tool routing. |
| Files and artifact production | 86 | 95 | Add live editing, preview diffs, and round-trip fidelity tests for every generated office format. |
| Research and evidence | 94 | 95 | Add citation-to-source entailment verification and a reproducible multi-source research evaluation. |
| Image, audio, and video understanding | 88 | 95 | Complete the external AMD video bundle, live acceptance run, and image-understanding evaluation. |
| Reliability and self-repair | 96 | 95 | Exercise last-known-good rollback from the installed app in an automated Electron journey. |
| Ease of use and accessibility | 92 | 95 | Add screen-reader Electron journeys, narrow-window drawer behavior, and complete keyboard navigation. |
| Release and operations | 75 | 95 | Obtain Developer ID, notarize, staple, and verify the installed bundle on a clean Mac. |

## Verified code findings

| Severity | Area | Evidence | Required improvement |
|---|---|---|---|
| HIGH | Reliability and self-repair | Coverage reports 95.98% only for imported modules; main.js, preload.js, renderer.js, and reference-studio.js are absent. | Add Electron integration tests that launch the packaged app and exercise every IPC, clear/restart, attachment, agent, and media journey. |
| MEDIUM | Reliability and self-repair | Reference preview and state-load paths contain empty catch blocks that suppress actionable failures. | Record bounded diagnostics and show recoverable UI errors instead of silently dropping failed previews or migrations. |
| MEDIUM | Maintainability | main.js is 1,875 lines/152 KB and renderer.js is 108 KB with many one-line functions. | Split provider, IPC, privacy, research, media, and renderer controllers into typed modules with dependency injection. |
| MEDIUM | Verification | Overall branch coverage is 67.52%; core high-risk modules and the Electron renderer still lack the required 85% branch evidence. | Raise branch coverage on network, credential, parsing, extension, and failure paths to at least 85%, including Electron journeys. |
| EXTERNAL | Release and operations | Release readiness reports no Apple Developer ID Application identity; current package is ad hoc signed. | Install the owner Developer ID certificate, notarize, staple, and verify with codesign and spctl before distribution. |

## Unified upgrade list

1. **[code-audit · high] Reliability and self-repair** — Add Electron integration tests that launch the packaged app and exercise every IPC, clear/restart, attachment, agent, and media journey. Evidence: Coverage reports 95.98% only for imported modules; main.js, preload.js, renderer.js, and reference-studio.js are absent.
2. **[code-audit · medium] Reliability and self-repair** — Record bounded diagnostics and show recoverable UI errors instead of silently dropping failed previews or migrations. Evidence: Reference preview and state-load paths contain empty catch blocks that suppress actionable failures.
3. **[code-audit · medium] Maintainability** — Split provider, IPC, privacy, research, media, and renderer controllers into typed modules with dependency injection. Evidence: main.js is 1,875 lines/152 KB and renderer.js is 108 KB with many one-line functions.
4. **[code-audit · medium] Verification** — Raise branch coverage on network, credential, parsing, extension, and failure paths to at least 85%, including Electron journeys. Evidence: Overall branch coverage is 67.52%; core high-risk modules and the Electron renderer still lack the required 85% branch evidence.
5. **[code-audit · external] Release and operations** — Install the owner Developer ID certificate, notarize, staple, and verify with codesign and spctl before distribution. Evidence: Release readiness reports no Apple Developer ID Application identity; current package is ad hoc signed.
6. **[capability] Reasoning and answer quality** — Add a versioned domain evaluation set, citation-entailment checks, and answer comparison in the primary chat.
7. **[capability] Files and artifact production** — Add live editing, preview diffs, and round-trip fidelity tests for every generated office format.
8. **[capability] Image, audio, and video understanding** — Complete the external AMD video bundle, live acceptance run, and image-understanding evaluation.
9. **[capability] Context and durable memory** — Add reusable knowledge collections with chunk/source inspection, reindex controls, and migration-failure reporting.
10. **[capability] Tools and connectors** — Add OAuth and stdio MCP transports, per-chat tool enablement, argument preview, and provider-loop tool routing.
11. **[capability] Ease of use and accessibility** — Add screen-reader Electron journeys, narrow-window drawer behavior, and complete keyboard navigation.
12. **[capability] Research and evidence** — Add citation-to-source entailment verification and a reproducible multi-source research evaluation.
