# Codex-to-Master-Chief Capability Parity

Master Chief uses Ollama as its local reasoning engine. Ollama alone is not equivalent to Codex: reliable parity requires a capable model **plus** typed tools, permissions, execution, evidence, and artifact handling. This matrix prevents the interface from claiming work it cannot execute.

| Capability | Master Chief status | Evidence / boundary |
|---|---|---|
| Local conversational reasoning | Available | Ollama chat, streaming, generation controls, model discovery, load/unload |
| File attachment and local extraction | Available | 25 MB per file; supported Office/PDF/text extraction; unknown formats remain metadata-only |
| Word, Excel, PowerPoint, Python, R, and SQL artifacts | Available | Deterministic generators with saved downloadable artifacts; R execution needs an R runtime |
| Local image generation and revision | Available when ComfyUI is healthy | Versioned workflows, job ledger, lineage, preview, save, download, and hashes |
| Video generation | Conditional | Requires an enabled compatible workflow, model bundle, and healthy worker |
| Repository inspection | Partial | Ollama can list project files, read bounded project text, and inspect Git status; it cannot yet edit or execute arbitrary commands |
| Generated-artifact discovery | Available | Ollama can list generated document and media metadata |
| Web research | Partial, no-key public connector | Ollama can search DuckDuckGo Instant Answer and English Wikipedia with linked results after network approval. This is narrower than a commercial search index and never falls back to a paid AI provider. |
| General code editing and command execution | Not yet available to local Ollama | Requires workspace-scoped patch and process tools, review, timeouts, and rollback |
| Browser and native application control | Not yet available | Requires a computer-use connector and explicit per-action authorization |
| External app connectors | Partial | Ollama, Codex, Hugging Face, OpenAI, xAI, GitHub, ComfyUI, and ElevenLabs are cataloged with live setup state and cost class. Cloud providers run only when explicitly selected. |
| Scheduled reminders and monitoring | Not yet available | Requires a durable scheduler and notification service |
| Multi-agent / task orchestration | Partial | Bounded sequential plans exist; there is no independent worker/task runtime yet |
| Security and audit evidence | Available for registered tools | Main-process enforcement, explicit approvals, bounded inputs, and audit events |

## Parity rule

A capability is reported as available only when an end-to-end test proves that Master Chief can select the tool, execute it, return evidence, preserve the result, and recover from failure. A fluent model response is not execution evidence.

## Next implementation gates

1. Workspace-scoped patch/read/test tools with diffs, rollback, and approval.
2. Expand the no-provider-charge web path with a local SearXNG instance when a supported container runtime is available; retain citations, fixed destinations, and provenance.
3. Broaden artifact creation acceptance tests inside the Ollama tool loop.
4. Scheduler/notification jobs with pause, cancel, history, and restart recovery.
5. Connector SDK for browser/app services, each with a typed contract, visible cost class, explicit route selection, and least-privilege credentials.
6. A stronger tool-calling local model, validated by live multi-step acceptance tests.
