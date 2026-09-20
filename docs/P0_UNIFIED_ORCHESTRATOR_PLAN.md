# P0 Unified Orchestrator — Implemented Blueprint

## Objective

Make every Master Chief request observable, recoverable, steerable, and attributable without replacing the specialized executors that already work.

## Primary journeys

1. A user submits chat, agent, research, artifact, image, video, audio, code, or data work. The same versioned request and event vocabulary follows it end to end.
2. A local route is selected from measured capability, availability, memory, latency, privacy, and context evidence. Cloud remains an explicit selection and never becomes an automatic fallback.
3. The Job Center shows status, exact route rationale, rejected candidates, plan, evidence, errors, artifacts, and recovery actions.
4. Pause, steer, cancel, retry, and resume occur at orchestration boundaries with idempotent request IDs.
5. Draft text, selected route, attachment names, conversations, jobs, outputs, and lineage recover after refresh or restart.

## Architecture

- `job-contract.js`: `JobRequest`, `JobEvent`, capability vocabulary, typed recovery errors.
- `job-orchestrator.js`: atomic durable store, idempotency, event stream, plans, receipts, actions, recovery.
- `provider-gateway.js`: provider-neutral capabilities and evidence-based routing receipt.
- Existing chat, agent, ComfyUI, audio, artifact, and data executors remain specialized workers behind the orchestration boundary.
- `artifact-registry.js`: request linkage, artifact IDs, model/provider provenance, hashes, parent lineage.
- Job Center: queue/status filters, route explanation, editable steering, plan evidence, progress, and recovery.

## Acceptance gates

- One schema covers all nine job kinds and all twelve lifecycle events.
- Duplicate idempotency keys return the existing job.
- Interrupted nonterminal jobs restart as recoverable.
- No silent cloud fallback.
- Every route exposes candidates, rejection reasons, and measured selection rationale.
- Keyboard navigation, responsive layout, scalable text, reduced motion, Files-only navigation, command palette, and same-turn outputs remain available.
- No legal, publishing, safety, moderation, prompt-rewriting, or content-control behavior is introduced by this P0.

## P1 boundary

P1 is intentionally not started. Advanced graph execution, distributed scheduling, deeper cross-runtime telemetry, and additional provider adapters remain queued until the owner says `P1`.
