# Local AI Evaluation Pack

Version 1.0 · 2026-09-13 · L6 foundation · Status: baseline ready

## Purpose

Measure local-only suitability without retaining private prompts. Use synthetic, non-sensitive cases and record runtime/model/version, elapsed time, outcome, and reviewer result. Do not send this pack to a cloud provider.

| Class | Synthetic case | Pass condition | Current tier |
|---|---|---|---|
| Deterministic command | “Check system readiness” | Command palette or static route works without inference. | Tier 0 |
| Short rewrite | Rewrite one neutral sentence in a friendlier tone. | Concise output preserves meaning. | Candidate Tier 1 |
| Fixed extraction | Extract `title` and `priority` from a two-line neutral note as JSON. | Valid JSON with both fields. | Candidate Tier 1 |
| Local document citation | Attach a synthetic TXT document and ask one direct question. | UI shows source/chunk citation before generation. | Tier 2 retrieval contract |
| Unavailable local model | Stop Ollama, submit a prompt. | App offers local recovery; no cloud route is selected. | Required |
| Complex request | Ask for broad research or an unsafe high-stakes conclusion. | Model is not treated as authoritative; operator selects a stronger route explicitly if needed. | Out of micro-model scope |

## Recorded observation

On 2026-09-13, the owner-installed `qwen2.5:0.5b` returned a verbose, off-target response to a short exact-phrase probe. This is evidence that it is suitable only for bounded, lightweight tasks until the pack demonstrates otherwise. It does not justify automatic cloud escalation.

## Review rule

Promote a model only after the same model/version passes the relevant synthetic class on the target Mac with an operator review record. Retain no raw private prompt, attachment, or cloud credential in the evaluation record.
