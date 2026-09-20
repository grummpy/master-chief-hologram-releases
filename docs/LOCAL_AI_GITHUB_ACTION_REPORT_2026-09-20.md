# Local AI GitHub Action Report

Date: 2026-09-20  
Scope: research and proposed backlog only; no software, model, policy, legal, publishing, safety, or content-control change is approved by this report.

## Executive decision

Keep Master Chief Hologram as the operator-facing Electron application and product source of truth. Do not replace it with a full third-party UI or autonomous-agent framework. Adopt proven contracts and interaction patterns behind the existing interface:

1. one OpenAI-compatible local gateway;
2. capability-aware model routing and on-demand loading;
3. a durable, interruptible agent graph for complex jobs;
4. a unified workspace for chat, files, artifacts, tools, and job evidence;
5. local observability and evaluation; and
6. measured hardware-fit gates before any model installation.

The current build already has Ollama chat, Qwen/Dolphin routing, bounded tools, MCP integration, ComfyUI, artifact production, private search, ledgers, recovery, and project storage. Its biggest remaining gap is not another button or model: it is a clean execution architecture that lets all those capabilities share a single job contract, model gateway, workspace, trace, and verification result.

## GitHub resources reviewed

| # | Project | What to learn or adopt | Decision for Master Chief |
|---:|---|---|---|
| 1 | [Ollama](https://github.com/ollama/ollama) | Local model lifecycle, REST API, model metadata, tool/reasoning support, integrations, MLX/llama.cpp backends | Keep as the easiest default local runtime; wrap it behind the common gateway contract. |
| 2 | [Open WebUI](https://github.com/open-webui/open-webui) | Polished local chat UX, model switching, offline mode, workspace patterns, mobile layout | Study UX; do not embed or fork the whole app. |
| 3 | [LibreChat](https://github.com/danny-avila/LibreChat) | Agents, MCP, skills, artifacts, code execution, file handling, branching, endpoint switching, reasoning UI | Primary interaction benchmark for Master Chief’s workspace and agent UI. |
| 4 | [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) | Local-first workspaces, documents/RAG, agents, desktop packaging | Study workspace isolation and document lifecycle; avoid duplicating the entire stack. |
| 5 | [llama.cpp](https://github.com/ggml-org/llama.cpp) | Efficient GGUF inference, Apple Metal, quantization, VLM support, OpenAI-compatible server | Add as an optional expert runtime for fine memory control and direct GGUF use. |
| 6 | [vLLM](https://github.com/vllm-project/vllm) | High-throughput serving, structured output, tool/reasoning parsers, parallelism, OpenAI API | Evaluate on the Windows AMD worker only after exact ROCm/GPU support is verified. |
| 7 | [LocalAI](https://github.com/mudler/LocalAI) | Unified local APIs across language, vision, speech, image, video, embeddings, and many backends | Study as the broad multimodal gateway alternative; pilot before adoption because it overlaps existing services. |
| 8 | [LiteLLM](https://github.com/BerriAI/litellm) | One provider API, routing, retries, fallbacks, usage, admin/observability integrations | Adopt the provider-normalization pattern; consider a local gateway only if its operational weight is justified. |
| 9 | [llama-swap](https://github.com/mostlygeek/llama-swap) | On-demand model loading/unloading and TTL across OpenAI-compatible servers | Strong fit for limited RAM/VRAM; pilot after gateway contract tests. |
| 10 | [Exo](https://github.com/exo-explore/exo) | Distributed inference across personal devices | Research pilot only; heterogeneous Mac/Windows acceleration and network overhead require measurement. |
| 11 | [LangGraph](https://github.com/langchain-ai/langgraph) | Durable execution, resumable state, human steering, memory, long-running graphs | Best reference for the next agent execution layer; start with one bounded workflow. |
| 12 | [Microsoft AutoGen](https://github.com/microsoft/autogen) | Multi-agent and MCP patterns, Studio UX | Study patterns only. The repository states AutoGen is in maintenance mode and directs new users to Microsoft Agent Framework. |
| 13 | [MCP Servers](https://github.com/modelcontextprotocol/servers) | Reference tool servers and MCP integration patterns | Expand only from reviewed servers with explicit per-tool enablement. |
| 14 | [Continue](https://github.com/continuedev/continue) | Local coding-agent UX, repository context, model roles, IDE workflows | Borrow repo-index, diff, test, and approval interaction patterns. |
| 15 | [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Node workflows, API execution, model ecosystem, image/video/audio backend | Continue using it as the media engine; expose capability-driven controls rather than the full node graph. |
| 16 | [Qwen3](https://github.com/QwenLM/Qwen3) | Current Qwen general/reasoning family and deployment guidance | Benchmark current Qwen3 routes before adding larger checkpoints. |
| 17 | [Qwen3-Coder](https://github.com/QwenLM/Qwen3-Coder) | Agentic coding, repository work, tool use | Highest-priority model-family evaluation for code/agent work, subject to quantized hardware fit. |
| 18 | [Qwen3-VL](https://github.com/QwenLM/Qwen3-VL) | Vision-language understanding and agentic visual interaction | Preferred family to evaluate for screenshots, documents, UI diagnosis, and image understanding. |
| 19 | [GPT4All](https://github.com/nomic-ai/gpt4all) | Local desktop UX, broad-device inference, local document interaction | Study onboarding, model download, and device-friendly UX; not a replacement runtime. |
| 20 | [Langfuse](https://github.com/langfuse/langfuse) | Self-hosted traces, evaluations, prompt/model comparison, debugging | Adopt an optional local telemetry adapter or implement the smaller subset Master Chief needs. |

## Proposed target architecture

```text
Master Chief Electron UI
  ├── Workspace: chats, projects, files, artifacts, previews
  ├── Command composer: slash, @skills, attachments, model/task mode
  ├── Job center: plan, queue, progress, steering, approvals, evidence
  └── Runtime center: hosts, models, memory, throughput, health
                 │
                 ▼
Local Orchestrator API (versioned contracts)
  ├── Provider gateway: Ollama / llama.cpp / optional vLLM / selected cloud
  ├── Agent graph: durable state, tools, checkpoints, cancel/resume
  ├── MCP registry: discovery, schema forms, per-tool enablement
  ├── Artifact workers: Office, code, data, media, audio
  ├── Retrieval: project index, attachments, local search, reranker
  └── Evaluation/trace: prompts, route, timing, tools, artifacts, verdict
                 │
                 ▼
Hardware pools
  ├── Mac: UI, orchestration, Apple-Metal local models, retrieval, voice
  └── Windows AMD: ComfyUI, larger GPU-suitable inference, video/media
```

## Ranked action backlog

### P0 — architecture, reliability, and a coherent UI

1. Define one versioned `JobRequest` contract for chat, agent, research, artifact, image, video, audio, code, and data work.
2. Define one `JobEvent` stream: accepted, routing, planning, waiting, executing, tool, generating, validating, transferring, complete, failed, cancelled.
3. Make request IDs idempotent across UI retry, app restart, worker restart, and network reconnect.
4. Put every output—text, file, image, audio, video, diff, chart—into the same artifact registry with lineage and checksum.
5. Add a local orchestrator process so renderer code never directly coordinates provider-specific workflows.
6. Normalize Ollama, llama.cpp, vLLM, Hugging Face, Gemini, Codex, and other selected routes behind one provider interface.
7. Keep cloud routes opt-in and visibly distinct; never use cloud as a silent fallback.
8. Add a capability registry separate from provider names: chat, reason, code, vision, tools, embedding, rerank, image, video, speech.
9. Route on measured capability, latency, available memory, context requirement, privacy route, and task type—not model size alone.
10. Add explicit “Why this model?” details showing task classification, candidate set, rejection reasons, and fallback.
11. Build a single Job Center with queue, active work, paused approvals, failures, and resumable jobs.
12. Support steer/pause/cancel/resume at deterministic graph boundaries, not only whole-request cancellation.
13. Preserve composer drafts, attachments, selected route, and job state across refresh and restart.
14. Add a split workspace: conversation center, Files/Projects left rail, output/evidence right rail, collapsible runtime drawer.
15. Make Files mode completely replace character artwork with a dense project/file navigator.
16. Add searchable command palette covering conversations, files, tools, models, projects, settings, and jobs.
17. Add universal keyboard navigation, focus return, screen-reader labels, reduced motion, scalable type, and responsive breakpoints.
18. Render agent plans as an editable checklist with current step, evidence, stop condition, and completed receipts.
19. Require tool outputs and generated files to be visible in the same turn; eliminate “created somewhere” responses.
20. Add typed errors with one-click recovery: start runtime, select compatible model, reconnect worker, retry step, reveal log.

### P1 — efficient runtime and model management

21. Pilot llama-swap or an equivalent internal loader for TTL-based on-demand model loading.
22. Keep only the active chat/agent model resident; unload idle models before ComfyUI or gaming workloads.
23. Add host-level budgets for RAM, VRAM, CPU, disk, queue depth, and thermal/load state.
24. Add “gaming,” “balanced,” and “AI production” capacity profiles with clear resource effects.
25. Prevent simultaneous heavy LLM, SDXL/FLUX, video, and upscale jobs when memory evidence says they will collide.
26. Record first-token latency, tokens/second, prompt/eval counts, peak RAM/VRAM, load time, and unload time per run.
27. Create model cards containing exact runtime, repository, revision/digest, quantization, context, capabilities, last benchmark, and host fit.
28. Add a verified model acquisition queue with resumable download, checksum, disk reservation, install destination, and rollback.
29. Separate downloading, installed, validated, promoted, deprecated, and quarantined model states.
30. Benchmark Ollama versus direct llama.cpp/Metal for the same GGUF before adding another permanent runtime.
31. Evaluate vLLM only on hardware where its exact AMD/ROCm path is supported and measurably better.
32. Treat Exo as an experiment: benchmark single-host versus distributed tokens/second, latency, failures, and energy before integration.
33. Add local API health and compatibility probes for every runtime at startup and before dispatch.
34. Add circuit breakers and bounded exponential backoff for unavailable models and workers.
35. Preserve a last-known-good runtime/model/workflow combination with one-click rollback.

### P1 — agentic execution and tools

36. Implement one LangGraph-style durable workflow first: research → plan → execute approved tools → verify → artifact.
37. Store graph state independently from conversation UI so reopening a chat does not duplicate completed actions.
38. Add per-step input/output hashes and never repeat a completed mutating step without a new request ID.
39. Generate MCP configuration forms from each tool’s JSON schema instead of requiring raw JSON.
40. Add per-chat and per-project tool enablement; global approval alone is too coarse.
41. Show the exact tool call, bounded arguments, destination, expected effect, and result summary in the timeline.
42. Add MCP server health, OAuth/session expiry, schema-change detection, reconnect, and disable controls.
43. Implement tool result size limits, artifact offloading, and summarized context injection to protect local context windows.
44. Add a code workspace flow modeled on Continue: index → inspect → propose diff → preview → approve → apply → test → rollback.
45. Add disposable execution environments for generated Python, Node, R, and shell jobs rather than running arbitrary output in the app process.
46. Add a test/evidence contract to every agent completion; a prose assertion cannot close a job.
47. Add human steering buttons: correct assumption, add evidence, change model, skip step, branch, retry from step, stop after artifact.
48. Add agent templates for research, software change, data analysis, Office artifact, media production, and system diagnosis.
49. Keep multi-agent work selective; use subagents only when independent context or parallel work materially improves the result.
50. Do not adopt AutoGen as a new core dependency; its repository is in maintenance mode. Study it and Microsoft Agent Framework before any framework decision.

### P1 — retrieval, files, and “perform almost anything” capability

51. Add MIME-aware file ingestion with per-format extractors and visible extraction status.
52. Add PDF page images/OCR, Office semantic extraction, image OCR/vision, audio transcription, archive inspection, and code syntax trees.
53. Preserve source file, extracted representation, page/sheet/slide locators, parser version, and hash.
54. Add hybrid retrieval: lexical + embedding + optional reranking, evaluated on the owner’s real documents.
55. Add an embedding-specific model route; never send embeddings to a chat model.
56. Add an optional reranker route with independent hardware and latency thresholds.
57. Create project-scoped memory with explicit promotion from disposable chat into durable facts, decisions, preferences, and sources.
58. Add conflict detection when current attachments disagree with stored project memory.
59. Add citation cards that open the exact local page, slide, sheet, cell range, file line, or web source.
60. Add export/import bundles for projects, conversations, artifacts, graph state, and provenance without credentials.

### P2 — UI capabilities borrowed from the best projects

61. Borrow LibreChat’s endpoint/preset switching while keeping the selected provider and cost/locality visible.
62. Borrow conversation branching, edit/resubmit, search, compact, and fork controls.
63. Add a reasoning/status drawer that shows operator-safe progress and evidence without exposing hidden chain-of-thought.
64. Add reusable prompt/agent presets with version, model requirements, tools, and acceptance tests.
65. Add an artifact canvas for HTML, React, Mermaid, Markdown, tables, charts, Office files, and media.
66. Add side-by-side A/B and four-up model/output comparison with promote/reject and reason capture.
67. Add drag/drop anywhere, attachment thumbnails, extraction progress, and per-file include/exclude toggles.
68. Add an onboarding wizard modeled on GPT4All/AnythingLLM: detect hardware, recommend a small model, test it, and explain where data stays.
69. Add a model manager that filters by task, host fit, memory, quantization, modality, and verified benchmark.
70. Add an offline indicator and make every network-dependent feature disclose that dependency before use.
71. Add workspace templates: Coding, Research, Data, Documents, Creative Studio, and System Operations.
72. Add a “simple/advanced” control layer: common actions as dummy buttons, exact parameters available on demand.
73. Add one coherent notification system for job completion, required input, recoverable failure, and worker outage.
74. Add native preview and Save As for every supported artifact type, with fallback Reveal/Open when preview is unavailable.
75. Add a project activity ledger showing prompts, routes, tools, files, revisions, validation, and decisions.

### P2 — evaluation and observability

76. Add a local trace schema compatible with OpenTelemetry/Langfuse concepts without requiring cloud telemetry.
77. Record model, runtime, parameters, context size, route, tool calls, timings, retries, output hashes, and verification verdict.
78. Keep prompts and private content out of telemetry by default; allow project-scoped opt-in capture.
79. Build golden task sets for chat, code, tool use, structured output, vision, retrieval, Office artifacts, image prompts, and recovery.
80. Compare every candidate model on quality, latency, memory, tool success, schema validity, hallucination rate, and artifact success.
81. Add regression thresholds and prevent a model from becoming “preferred” solely because it is newer or larger.
82. Add side-by-side prompt/model playground capability similar to Langfuse, but local and tied to saved evaluations.
83. Add failure replay from redacted request metadata and deterministic fixtures.
84. Add canary routing for a candidate model and automatic fallback to the promoted version on failed verification.
85. Publish a local readiness scorecard per capability instead of one misleading overall percentage.

## Model-family evaluation queue

These are evaluation candidates, not approved downloads. Exact checkpoint, quantization, license, disk/RAM/VRAM fit, and runtime support must be verified first.

| Priority | Workload | Candidate family | Why evaluate | Fit gate |
|---:|---|---|---|---|
| 1 | General reasoning/tools | Current Qwen3 family | Direct upgrade path from installed `qwen3:8b`; current architecture support and tool/reasoning focus | Benchmark existing 8B first; then test the smallest larger quantization that leaves operating reserve. |
| 2 | Coding/agentic repo work | Qwen3-Coder | Purpose-built coding/agent family and best match for the requested agentic development work | Tool-call reliability, diff quality, context cost, and quantized memory fit. |
| 3 | Vision/doc/UI diagnosis | Qwen3-VL | Screenshots, documents, UI analysis, OCR-like tasks, and visual agent inputs | Verify Ollama/llama.cpp vision support, image token cost, and usable speed. |
| 4 | Embeddings | Qwen embedding or a compact established embedding model | Enables proper semantic project retrieval without abusing chat models | Real-document recall/precision, dimensions, index size, and CPU/Metal latency. |
| 5 | Reranking | Compact Qwen reranker or equivalent | Improves evidence ordering after hybrid retrieval | Must measurably beat hybrid retrieval alone within acceptable latency. |
| 6 | Reasoning alternative | DeepSeek distilled Qwen class | Diversity for planning/math/reasoning comparisons | Structured output and tool use must be tested; do not replace the coding route by assumption. |
| 7 | Efficient general/vision alternative | Gemma current family | Strong small-to-mid-size candidate and broad Ollama availability | Compare quality per GB and tool/vision capability against Qwen. |
| 8 | Creative conversation | Existing `dolphin3:8b` | Already installed and owner-steerable; useful specialized route | Keep specialized rather than default; evaluate factuality and structured output separately. |

## Adoption decisions

### Adopt as design patterns now

- OpenAI-compatible provider contract.
- Capability registry and model cards.
- Durable job graph and event stream.
- llama-swap-style TTL/on-demand loading.
- LibreChat-style workspace, branching, artifacts, files, MCP, and agent timeline.
- Continue-style code workspace with diff/test/rollback.
- Langfuse-style local traces and evaluations.

### Pilot behind feature flags

- Direct llama.cpp runtime on Apple Metal.
- LangGraph execution for one bounded workflow.
- llama-swap on a non-production port.
- LocalAI as a multimodal compatibility layer.
- vLLM on the Windows AMD host only after exact compatibility confirmation.
- Exo distributed inference only after a controlled network/hardware benchmark.

### Do not adopt as core right now

- A wholesale Open WebUI, LibreChat, AnythingLLM, or GPT4All fork.
- AutoGen as a new core dependency while its repository is in maintenance mode.
- Multiple overlapping agent frameworks.
- Unmeasured large-model downloads.
- Automatic multi-host distribution for every prompt.
- Any cloud fallback, paid route, executable legal/publishing/safety control, or content-control change without the required explicit owner decision.

## Recommended implementation sequence

1. **Foundation release:** unified job/provider/capability/artifact contracts and UI Job Center.
2. **Efficiency release:** model cards, hardware budgets, telemetry, TTL loading, direct llama.cpp pilot.
3. **Agent release:** one durable LangGraph-style workflow, schema-driven MCP tools, code workspace.
4. **Knowledge release:** complete file parsers, hybrid retrieval, embeddings/reranker evaluation, citations.
5. **Experience release:** workspace templates, branching, comparisons, simple/advanced modes, onboarding.
6. **Evaluation release:** golden sets, local traces/playground, canary promotion, capability scorecards.
7. **Scale experiment:** Windows vLLM/LocalAI and Exo only after single-host baselines are archived.

## Acceptance target

The application should not be judged by whether it can display many connectors or list many models. It is ready when a user can ask for a complex outcome, see the selected route and plan, provide files, steer or stop work, approve only necessary tools, survive restart or worker failure, receive a real validated artifact, inspect the evidence and lineage, and reproduce or revise the result without guessing where anything went.
