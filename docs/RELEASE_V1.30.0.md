# Master Chief Hologram v1.30.0 — Hybrid Identity Precision

## Outcome

The strongest verified identity workflow now layers the installed FaceID Plus v2 adapter/LoRA before InstantID identity and facial-keypoint conditioning. The previous InstantID workflow remains the rollback and more flexible transformation route.

The workflow was executed on the live Windows AMD worker with the owner's supplied portrait and a controlled barbarian transformation. It returned prompt `6f78be49-c7d5-4dc7-9cd2-69f36f72c28e`, artifact SHA-256 `a73c509769724a2f048cf19821f67114f6889ae12544df7569f8abac049710e9`, and released the worker cache after completion.

## 90-point private production gate

| Area | Weight | Score | Evidence |
|---|---:|---:|---|
| Identity fidelity and controlled transformation | 25 | 23 | Hybrid FaceID + InstantID live render; source/result comparison; exact settings retained. |
| Prompt and parameter fidelity | 15 | 15 | Positive and negative prompts remain verbatim; preflight shows the exact payload. |
| Runtime reliability and recovery | 20 | 19 | Durable ledger, retry/resume/cancel, worker health, cache release, and rollback workflows. |
| Artifact lineage and review | 15 | 15 | Request IDs, workflow hashes, seeds, artifact hashes, parent lineage, promotion/rejection, and comparison. |
| Operator UX and accessibility | 15 | 13 | One-click Identity Lock, source comparison, local status, keyboard paths, and responsive visual regression. Manual assistive-technology acceptance remains. |
| Security, privacy, and dependency quality | 10 | 10 | Private-LAN boundary, credential isolation, path containment, zero production dependency audit findings, and local identity fixtures excluded from Git. |
| **Private local product** | **100** | **95** | **PASS** — exceeds the 90-point owner-operated production gate. |

This score applies to the private, owner-operated local product and this tested identity workflow. Public commercial distribution remains below 90 until Developer ID signing, notarization, clean-device Gatekeeper testing, and a broader hardware/device matrix are completed. Video generation also remains gated until an approved local video model bundle passes readiness.

## Face-quality limitations

- A single front-facing reference can preserve identity strongly but cannot prove profile, rear, expression, or extreme-angle continuity.
- Eyeglasses, facial hair, hairline, and other visible identity anchors should be stated consistently when the transformation must retain them.
- FaceDetailer nodes are installed, but the required face detector and SAM model inventories are empty; that route remains disabled rather than pretending to be ready.
- A three-to-five image approved reference sheet and measured multi-angle evaluation are the next quality step.

