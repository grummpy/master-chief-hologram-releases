# Master Chief Hologram 1.2.0

## Outcome

This increment restores the local Ollama runtime, adds a stronger owner-steerable local creative model, and introduces separate Professional and Personal presentation modes for Commander Nova.

## Product behavior

- Professional is the safe default and retains the command-officer uniform.
- Personal is an explicit, persistent local-display preference with a glamorous adult evening design.
- Switching views changes artwork, accessible labels, copy, and the optional interactive texture only.
- Model selection, Master Chief behavior, permissions, cloud consent, and tool authority remain unchanged.
- Ollama starts as a Homebrew user service and remains bound to localhost.

## PAPM gates

Foundation plan: 92/100. The increment has an explicit user journey, separation of visual and model authority, asset provenance, fallback behavior, accessibility labels, deterministic regression checks, and a local-only provider boundary.

Final product gate: 94/100 (`LOCAL RELEASE READY`). Evidence: 34/34 automated tests, five required-asset checks, sixteen approved visual assets, zero production dependency vulnerabilities, packaged-app inspection, Desktop launch, accessible mode-state verification, and visual inspection at the real app viewport. Public distribution remains blocked until Developer ID signing and notarization are configured.

## Standby backlog

1. Add a local model-management panel with storage estimates, pull progress, cancel, and delete confirmation.
2. Benchmark local models on creative quality, latency, memory pressure, tool-call format, and hallucination rate.
3. Add signed/notarized macOS distribution once the owner supplies the required Apple identity.
4. Add an optional privacy lock for Personal view on shared machines.
