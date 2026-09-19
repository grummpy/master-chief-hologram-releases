# Local creative models

Version: 1.2.0  
As of: 2026-09-19

## Verified local state

- Runtime: Ollama 0.33.3, managed as a Homebrew user service on `127.0.0.1:11434`.
- Installed utility model: `qwen2.5:0.5b` (Q4_K_M, approximately 397 MB on disk).
- Creative-freedom model: `dolphin3:8b` (Ollama distribution, approximately 4.9 GB) selected for local installation.

`qwen2.5:0.5b` is appropriate for short rewrites, simple extraction, and basic local assistance. It is too small to serve as the primary high-quality creative model. Dolphin 3 is the preferred local creative conversation model for this 16 GB Apple Silicon host because its 8B parameter class remains practical while providing a substantially broader general-purpose and creative capability.

## Authority boundary

“Uncensored” and “abliterated” are model-alignment descriptions, not security properties. Every local model remains untrusted text generation. Master Chief Hologram enforces file access, tool approvals, provider routing, secrets handling, cloud consent, and process authority outside the model. Personal view is a visual preference and does not change these controls.

Models are not bundled with the application. The owner installs them through Ollama, and redistribution requires a separate license review. The model catalog exposes only models confirmed by the local Ollama API.

## Considered alternatives

- `dolphin3:8b`: selected local creative model; current general-purpose Dolphin generation with coding, math, agentic, and function-calling positioning.
- `dolphin-mistral:7b`: smaller established fallback; older model generation and weaker default choice for a new install.
- `huihui-ai/Meta-Llama-3.1-8B-Instruct-abliterated`: viable experimentation candidate, but its Llama 3.1 license and separate quantization/runtime packaging add more provenance and redistribution work than the direct Ollama path.

## Acceptance checks

1. `curl http://127.0.0.1:11434/api/tags` returns the installed model.
2. The app lists the exact model in its model selector and labels the route LOCAL.
3. A local prompt succeeds without cloud consent or external network routing.
4. Tool approvals remain unchanged when switching models or Professional/Personal views.
5. No model weights, prompts, or generated histories are committed to Git.
