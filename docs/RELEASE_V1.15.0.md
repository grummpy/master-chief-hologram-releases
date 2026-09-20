# Master Chief Hologram v1.15.0 — Quiet Runtime Monitoring

## Mission increment

Extend the durable scheduler with useful conditional monitoring while preserving local-first behavior. This release watches only the local Ollama service and the explicitly configured private-LAN ComfyUI worker.

## Operator behavior

- Open **Files → Scheduled**, select **+**, and choose **Runtime health monitor**.
- Select Ollama or ComfyUI and a 1-, 5-, 15-, or 60-minute interval.
- The first check establishes a baseline silently.
- Unchanged checks remain silent; a native notification and Activity event appear only when the state or health label changes.
- Pause, resume, and cancel are available in the Scheduled workspace.
- Approved Ollama agent mode can list, create, and manage the same monitors.

## Boundaries

- No prompts, conversations, files, or personal data are transmitted by a monitor.
- Ollama checks localhost. ComfyUI checks only the configured private worker contract.
- Generic URLs and cloud/account connectors are intentionally excluded until each has a typed read-only contract and explicit operator selection.
- Master Chief must be running to perform checks.

## Evidence and quality gates

Automated coverage verifies persistence, baseline silence, unchanged silence, state-change detection, scheduling, pause/resume/cancel, typed agent exposure, IPC, and UI controls.

| Gate | Score | Decision basis |
|---|---:|---|
| Foundation plan | 92/100 | Targets, network boundary, notification semantics, persistence, and stop controls are explicit. |
| Final product | 93/100 | Deterministic state transitions and UI contracts pass; real outage notifications still depend on macOS notification settings and a live runtime transition. |

Decision: release the bounded local-runtime monitoring increment. Do not claim cloud or arbitrary website monitoring.
