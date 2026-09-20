# PAPM 95% Readiness Mission

Mission run: `MC-APP-95-20260920`

## Outcome

Raise every code-controlled Master Chief Hologram capability area to at least 95/100 through evidence-backed audit, implementation, regression testing, packaging, and independent review. External dependencies—Apple Developer ID/notarization and unavailable Windows model bundles—remain explicit blockers and may not be scored as complete without real evidence.

## Users and decisive journeys

1. The operator sends a local prompt, sees progress, can cancel it, receives a complete response, and can review quality evidence.
2. The operator attaches or analyzes a file without hidden persistence and can inspect or clear retained data.
3. The operator registers a local or approved remote MCP server, discovers tools, grants each permission, invokes a tool, and removes the server.
4. An agent task survives restart and resumes from its first incomplete step without repeating completed mutations.
5. Research retrieves only approved public destinations, preserves citations, and rejects unsafe redirects or address resolution.
6. Image, audio, and video jobs expose readiness, lineage, retry, cancellation, output verification, and recovery.
7. The installed macOS build is traceable to source and a packaged-artifact checksum; public distribution additionally requires Developer ID notarization evidence.

## Frozen acceptance model

- Every capability area must score at least 95; no averaging can hide a lower area.
- All unit and integration tests pass with zero known production dependency vulnerabilities.
- Branch coverage is at least 85% for network, authorization, parsing, recovery, and connector modules.
- Electron smoke tests exercise IPC exposure, startup, clear/restart, research, MCP, agent resume, artifacts, and accessibility.
- Critical and high code-audit findings are closed with tests.
- The packaged artifact—not only source metadata—is checksummed and inspected.
- External prerequisites are never simulated or credited as complete.

## Work packages and owners

| Package | Lead | Exit evidence |
|---|---|---|
| Secure research and evidence | Jarvis + Captain Intelligence | Redirect/DNS tests, citation preservation, bounded fetch evidence |
| Agent recovery | Jarvis + Chief Operations | Exact-step checkpoint/resume and idempotency tests |
| MCP/connectors | Signals Officer + Jarvis | Initialize, discovery, approval, invoke, disable/remove tests |
| Answer quality | Prompt Engineering + Lieutenant Quality | Visible quality result, retry path, evaluation set |
| Multimodal | ComfyUI Command Stack | Dedicated permissions, explicit routing, live readiness gates |
| UX/accessibility | Chief UX + Test Pilot | Keyboard and accessibility journeys, validated setup forms |
| Release integrity | DevSecOps Officer | Packaged hashes, CI verification, rollback evidence |
| Independent scoring | PAPM + Warrant Officer Data | Frozen rubric, evidence references, no unsupported credit |

## Iteration policy

Execute critical security and integrity fixes first, then high integration gaps, followed by coverage and usability. After every batch: run syntax checks, targeted behavioral tests, the complete suite, P0/P2 gates, asset/visual checks, dependency audit, package inspection, and an independent score. Stop only when every area is 95 or higher or a real external blocker prevents the threshold; in that case issue `HOLD—BLOCKED` with the exact evidence and shortest owner action.

## Risks

- Static-string tests can pass while UI behavior is broken; require launched Electron journeys.
- Local model quality varies independently of application quality; record model and settings for evaluations.
- MCP implementations vary by transport and authentication; use protocol fixtures plus at least one live local server.
- Signing and notarization require owner credentials and Apple services.
- Windows video readiness depends on installed compatible models, nodes, licenses, and available hardware capacity.

## Sustainment

Keep the unified backlog in `docs/CAPABILITY_GAP_AUDIT.md`, retain each scored audit in `evaluation/history`, and require newly introduced IPC, tools, providers, and workflows to add behavioral tests and rollback evidence before release.
