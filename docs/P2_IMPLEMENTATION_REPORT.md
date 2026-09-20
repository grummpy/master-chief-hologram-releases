# P2 Experience, Evaluation, and Observability Upgrade

Implemented P2 from the local-AI action report as version 1.45.0.

## Experience

- Provider/model selection continues to display locality and cost class.
- Workspace templates cover Coding, Research, Data, Documents, Creative Studio, and System Operations.
- Reusable presets carry versions, model requirements, tools, prompt text, and acceptance tests.
- Artifact canvas contracts support HTML, React, Mermaid, Markdown, tables, charts, Office files, PDF, media, code, and diffs.
- A/B and four-up comparisons persist promote/reject decisions and reasons.
- Simple/Advanced mode keeps common actions visible while preserving exact controls.
- The reasoning/status drawer shows routes, stages, receipts, hashes, and evidence without exposing hidden chain-of-thought.
- Hardware/privacy onboarding recommends a conservative local starter model and explains data residency.
- Model filtering covers task, runtime, host fit, memory, quantization, modality, and verified benchmark.
- Network-dependent features have an explicit dependency-disclosure contract and offline state.
- One notification vocabulary covers completion, required input, recoverable failure, and worker outage.
- Project activity records prompts by hash/summary, routes, tools, files, revisions, validation, and decisions.
- Existing branching, search, edit/steer, Files mode, drag/drop, extraction state, previews, Save As, Reveal, and Open remain available.

## Evaluation and observability

- Local traces follow trace/span concepts and record models, runtimes, parameters, context size, routes, bounded tool calls, timings, retries, hashes, and verification.
- Prompts and private content are excluded by default; capture requires project-scoped opt-in.
- Golden task areas cover chat, code, tools, structured output, vision, retrieval, Office artifacts, image prompting, and recovery.
- Candidate evaluation covers quality, latency, memory, tool success, schema validity, hallucination rate, and artifact success.
- Promotion requires passing evaluations and beating the promoted baseline threshold; newness or size is never sufficient.
- The local evaluation playground hashes rather than stores the active prompt.
- Failure replay uses redacted request metadata and deterministic fixture fields.
- Canary verification automatically falls back to the promoted model.
- Readiness is shown per capability instead of as a single misleading percentage.

## Publication boundary

Public publication contains source, tests, documentation, and release metadata only. It excludes credentials, local prompts/traces, conversations, private artifacts, models, and runtime state.
