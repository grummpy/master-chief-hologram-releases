# Jarvis coding repository research — 2026-09-20

Jarvis reviewed ten active open-source projects spanning coding agents, repository context, debugging, repair iteration, static inspection, security analysis, connectors, and reusable skills. No upstream code was copied. The implementation adopts compatible operating patterns and preserves this application's existing owner-approved policy boundaries.

| Project | Stars observed | Applied lesson |
|---|---:|---|
| [OpenAI Codex](https://github.com/openai/codex) | 125,493 | Durable tasks, tool evidence, approvals, context discipline |
| [OpenHands](https://github.com/OpenHands/OpenHands) | 88,619 | Inspectable event/state execution |
| [Cline](https://github.com/cline/cline) | 68,869 | Human-visible plans, checkpoints, recoverable work |
| [Aider](https://github.com/Aider-AI/aider) | 49,081 | Repository maps, small diffs, lint/test feedback |
| [Continue](https://github.com/continuedev/continue) | 35,961 | Provider-neutral routing and context providers |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code) | 24,302 | Scoped roles and orchestration modes |
| [SWE-agent](https://github.com/SWE-agent/SWE-agent) | 20,370 | Issue localization and bounded repair loops |
| [Semgrep](https://github.com/semgrep/semgrep) | 16,704 | Semantic inspection and custom bug patterns |
| [CodeQL](https://github.com/github/codeql) | 10,109 | Data-flow/security inspection packs |
| [Microsoft Skills](https://github.com/microsoft/skills) | 3,039 | Selective skill/MCP loading and reusable instructions |

Counts were read from GitHub on the report date and are a discovery signal, not a quality score. Selection intentionally covers the requested functional categories instead of ranking only by stars.

## Changes adopted in this release

1. A transfer timeout after ComfyUI accepts a request is treated as recoverable remote work.
2. Artifact downloads retry bounded transient LAN read failures without submitting another generation.
3. Resume reconnects to the original ComfyUI prompt ID; Retry as new creates a lineage-linked child.
4. Regression coverage proves transfer recovery does not requeue generation.
5. The Jarvis audit loop now requires localization, failing-test reproduction, minimal repair, failure attribution, bounded iteration, and an evidence bundle.

## Deliberately not adopted

- No framework was vendored wholesale.
- No new content, moderation, legal, publishing, or safety control was introduced.
- No autonomous public deployment or broadened connector permission was added.
