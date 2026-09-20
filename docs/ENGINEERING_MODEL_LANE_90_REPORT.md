# Engineering and Local-Model Lane Assessment

Mission: `MC-ARMY-90-20260920`  
Lane: Jarvis, Local Model Operations, Signals Officer, Chief Operations, Prompt Engineering, Fleet Engineer  
Assessment date: 2026-09-20  
Release/signing work: excluded

## Result

**92/100 — PASS**

| Dimension | Weight | Earned | Evidence |
|---|---:|---:|---|
| Functional completeness | 30 | 28 | Dynamic local model routing; Ollama chat/agent/vision; Hugging Face route; fixed Git diagnostics; approved MCP tools inside the agent loop; artifact tools |
| Failure handling | 15 | 13 | Compatible-model fallback, invalid tool-argument rejection, MCP discovery isolation, bounded retries, cancellation, task ledger and recovery |
| Usability/accessibility | 15 | 13 | Model controls and evaluation, direct Git command, MCP manager, visible artifact actions, accessible artifact action labels and answer steering |
| Privacy/security/legal fit | 15 | 15 | Local-first default, explicit cloud selection, encrypted HF token storage, bounded repository tools, per-tool MCP approvals, redacted audit records |
| Verification depth | 15 | 14 | 198/198 tests; P0 100/100 across 75 cases; P2 90.5; asset and visual checks; zero production vulnerabilities |
| Documentation/operability | 10 | 9 | Runtime health, model catalog, keep-alive/unload, weighted Ollama evaluation, connector diagnostics and operational recovery messages |

## Implemented in this lane

1. Replaced size-only model selection with workload and model-family classification.
2. Added explicit profiles for Qwen, Dolphin, DeepSeek, Mistral, Llama, Gemma, coder, vision, tool, thinking, embedding, reranking and instruction-tuned models.
3. Prevented embedding and reranking checkpoints from being routed as chat models.
4. Required advertised tool support for agent work and vision support for visual analysis.
5. Preserved compatible operator model selections and disclosed incompatible fallback routes.
6. Removed the unnecessary approval dead end from the fixed, repository-local `git status --short --branch` diagnostic.
7. Added approved MCP tools to the bounded Ollama agent loop with schema discovery, permission enforcement, failure isolation and secret-free audit events.
8. Normalized both object and JSON-string Ollama tool arguments and rejected malformed arguments before tool execution.
9. Made ordinary Ollama chat select from the live installed catalog instead of assuming an unverified `llama3.2` fallback.
10. Added explicit accessible labels for Word, Excel, PowerPoint and code artifact actions.

## Verification evidence

- `npm test`: **198/198 passed**
- `npm run test:p0`: **100/100, 75 cases**
- `npm run test:p2`: **90.5/100**
- `npm run test:assets`: passed
- `npm run test:visual`: passed
- `npm audit --omit=dev`: **0 vulnerabilities**
- Syntax checks: `main.js`, `renderer.js`, and `local-model-router.js` passed

## Path to 100

1. **+2 functional:** add a verified model acquisition manager with repository/revision, file checksum, license, disk/RAM/VRAM fit, download progress, cancellation and rollback for Ollama and Hugging Face assets.
2. **+2 failure handling:** add live conformance fixtures for unreachable Ollama, a model removed during a request, MCP session expiration, MCP schema drift, HF rate limits and mid-stream disconnect recovery.
3. **+2 usability:** replace raw JSON MCP argument entry with forms generated from each tool's input schema, plus per-chat tool enablement and argument preview.
4. **+1 verification:** run and archive the weighted evaluation against every installed Qwen/Dolphin production candidate and test a real approved MCP server, not only deterministic fixtures.
5. **+1 operability:** surface measured tokens/second, first-token latency, context limit, loaded RAM/VRAM, quantization, license and last evaluation result on each model card.

The unearned eight points are deliberate: this run did not claim live Windows, external MCP-server, or every-installed-model evidence that was not available to the deterministic test environment.
