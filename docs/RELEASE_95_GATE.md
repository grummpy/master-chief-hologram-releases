# Commercial release 95-point gate

Baseline: revision `2b0f153` · 2026-09-20 · PAPM / Lieutenant Quality

The release threshold is **95/100**, with no failed blocker. Scores are earned only from retained, reproducible evidence. Package integrity and commercial signing are non-compensable blockers; an ad hoc signature, missing notarization, or unavailable external credential remains `HOLD` regardless of the numeric score.

| Gate | Weight | Acceptance evidence |
|---|---:|---|
| Electron integration | 15 | Packaged-app smoke exercises startup, preload API, every privileged IPC family, clear/restart, attachment, agent, and media recovery. |
| Exact agent resume | 15 | Restart resumes the first incomplete step, preserves receipts and inputs, and reuses the same per-step idempotency key without repeating completed mutation. |
| Crash recovery | 10 | Three unclean starts trigger a deterministic last-known-good rollback recommendation or safe mode; clean exit clears the loop. |
| Package integrity **BLOCKER** | 15 | Post-package manifest hashes `app.asar` and the complete bundle tree; verification rejects a one-byte mutation before installation. |
| Security | 10 | IPC sender, permission, redirect/IP, capability approval, and input-boundary tests pass. |
| Privacy | 5 | Local retention, deletion, export, credential redaction, and external-route consent tests pass. |
| Accessibility | 5 | Keyboard-only and screen-reader journeys pass in the packaged app. |
| Functional regression | 10 | Unit/assets/visual tests and ≥85% branch coverage in designated risk modules pass. |
| Operations | 5 | Failed update preserves known-good bundle; timers stop on shutdown; recovery drill evidence is retained. |
| Commercial signing **BLOCKER** | 10 | Developer ID signature, hardened runtime, notarization, stapling, `codesign --verify --deep --strict`, and `spctl` evidence pass on the final artifact. |

Current safe increment adds deterministic evidence for exact runner resume, ledger persistence, crash-loop decisions, packaged checksums, tamper rejection, and immutable scoring. It does **not** award Electron end-to-end, accessibility, redirect hardening, or external signing points without their required evidence.

Release sequence: unit and branch gates → package into an isolated directory → generate manifest → verify manifest → sign/notarize/staple externally → strict signature and Gatekeeper verification → installed-bundle integration run → score. Any post-manifest mutation invalidates the package-integrity evidence and requires a new manifest and downstream rerun.
