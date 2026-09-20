# End-to-End AI Fabric Audit — 2026-09-20

## Outcome

The operator path now follows one visible flow: compose → route → resource admission → local model or bounded agent → verification → artifact/readout → durable job evidence. The default interface prioritizes the conversation, while systems, outputs, activity, and jobs open only when requested.

## Verified architecture

1. The composer preserves the operator's command and selected route.
2. The provider gateway records why a provider/model was selected.
3. The runtime resource manager leases capacity using Gaming, Balanced, or Production budgets before chat or agent work starts.
4. Ollama handles local language work; the bounded agent loop exposes only registered tools and records durable receipts.
5. ComfyUI remains the specialized image/video worker with versioned workflows and output validation.
6. Private-LAN nodes are registered in an atomic local store and accept only loopback, `.local`, or RFC1918 HTTP endpoints.
7. Job events, timings, hashes, verification state, and recovery actions are retained without storing prompt text unless project capture is explicitly enabled.

## Findings repaired

| Area | Prior condition | Repair |
|---|---|---|
| Workspace density | Three permanent columns and every action visible | Conversation-first grid, collapsible inspector, Focus mode, and a progressive More menu |
| Readability | Messages expanded across the available center width | Responsive 72-character reading measure, improved line height, asymmetric user/assistant alignment |
| Agent capacity | Resource profiles were displayed but not enforced by agent execution | Admission lease, collision control, release, circuit recovery, and last-known-good promotion |
| Chat observability | Chat used a parallel hand-written job path | Chat now uses the shared tracked-job contract and telemetry path |
| Network workers | Endpoints were fragmented across settings | Durable typed node registry with live type-specific health probes |
| Node trust boundary | No common node validation contract | Public hosts, HTTPS cloud URLs, and non-private addresses are rejected from the local-node registry |

## Residual improvements

- Node registration currently provides inventory and health evidence; automatic load-aware routing across multiple nodes should remain a later opt-in promotion after comparative evaluation.
- Resume/retry actions retain durable state, but general non-media executors still require a process-level replay coordinator to restart work automatically after a full host outage.
- Network telemetry can be extended with real host RAM/VRAM evidence once each worker exposes a stable authenticated metrics contract.
- The app should continue evaluating model quality by capability rather than assuming a larger model is better.

## Verification

- Node registry persistence and private-network validation are covered by deterministic tests.
- UI progressive disclosure, focus behavior, resource admission, telemetry, and IPC boundaries are covered by static contract tests.
- The full automated suite must pass before packaging or publishing.
- Public and private branches must point to the same reviewed commit.
