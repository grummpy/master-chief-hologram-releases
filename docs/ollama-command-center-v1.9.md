# Ollama Command Center v1.9

## Mission and acceptance baseline

Improve local prompting, response quality, visibility, and bounded agent work without sending prompts off-device or replacing the existing ComfyUI media worker. The increment is accepted when native Ollama chat streams one visible answer, exposes generation settings and runtime evidence, preserves the selected model/settings, and can let a tool-capable installed model choose only approved local tools.

Out of scope for this increment: silently downloading models, arbitrary shell access, replacing ComfyUI for image/video generation, distributed EXO inference, and unreviewed third-party plugins.

## Research decisions

- FACT (Ollama API, accessed 2026-09-19): native chat supports streaming, tools, JSON/schema output, thinking, keep-alive, runtime options, and token/timing metadata.
- FACT (live runtime, 2026-09-19): Ollama 0.33.3 is healthy on the Apple M1 iMac with 16 GB RAM. `dolphin3:8b` advertises completion; `qwen2.5:0.5b` advertises completion and tools.
- FACT (live smoke test, 2026-09-19): Dolphin returned the exact health response and native timing/token counters; Qwen emitted a valid `diagnostics_local_runtime` tool call.
- DECISION: use Dolphin for stronger general responses and automatically fall back to an installed tool-capable model only for `/agent`.
- DECISION: keep ComfyUI as the media engine. Ollama plans and chats; it does not masquerade as an image/video generator.
- DEFER: vision input and Ollama embeddings until a compatible vision/embedding model is installed and benchmarked.

## Technical flow

```mermaid
flowchart LR
  UI[Command Center] --> Profile[Prompt profile + bounded options]
  Profile --> Native[Ollama native /api/chat]
  Native --> Stream[Thinking + answer stream]
  Stream --> Metrics[Tokens, cache, speed, timing]
  UI --> Agent[/agent objective]
  Agent --> ToolModel[Installed tool-capable model]
  ToolModel --> Gate[Existing approvals + allowlist]
  Gate --> Tools[Fixed local diagnostic tools]
  Tools --> ToolModel
  UI --> Runtime[/api/tags + /api/ps]
  Runtime --> Lifecycle[Refresh + unload]
```

## Operator guide

- Balanced is the default everyday mode.
- Precise lowers randomness for factual analysis and extraction.
- Creative raises variation for ideation and writing.
- Coding lowers randomness and strengthens inspect/change/test instructions.
- Agentic sends ordinary text through the bounded local tool loop; `/agent objective` does the same explicitly.
- Structured JSON asks Ollama for JSON output. Validate the result before treating it as authoritative data.
- Context controls input capacity; larger values consume more memory and can reduce speed.
- Keep loaded trades memory for faster follow-up prompts. Unload selected releases the selected model without deleting it.

## Verification and risks

Automated tests cover option bounds, prompt profiles, capability merging, tool mapping, UI controls, security contracts, assets, and packaging. Live smoke tests cover general completion and native tool-call generation. The 0.5B tool model is suitable for simple selection but not complex planning; a future 4B-8B tool-capable model should be benchmarked on this 16 GB machine before promotion.

## Standby backlog

1. Benchmark a stronger tool-capable 4B-8B model for agent planning and coding.
2. Add image attachment support after installing a vision-capable Ollama model.
3. Add Ollama embedding-backed RAG after selecting and benchmarking an embedding model.
4. Add resumable model pulls with disk estimates, progress, checksum, and explicit operator approval.
5. Compare single-node Ollama against EXO only after network and memory baselines are recorded.
