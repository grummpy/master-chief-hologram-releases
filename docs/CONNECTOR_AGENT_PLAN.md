# Connector and agent execution plan

Version: 1.0  
As of: 2026-09-19

## Mission

Let Master Chief Hologram turn a prompt into authorized work across local creative software and selected APIs without giving an LLM unrestricted access to the computer, credentials, or network.

## Recommended topology

```text
Prompt → selected planner model → typed task plan → policy/approval gate
       → connector registry → local or cloud adapter → artifact store
       → validation/provenance → preview → optional follow-on action
```

The renderer displays plans, progress, approvals, costs, and artifacts. The Electron main process owns credentials and connector execution. Models may request a named tool with JSON arguments, but they cannot run shell commands, choose arbitrary URLs, read arbitrary files, or bypass the approval gate.

## Connector lanes

| Lane | Recommended connector | Purpose | Boundary |
|---|---|---|---|
| Private image generation | ComfyUI on the Windows GPU host | Still images, character concepts, adult figure art, inpainting, upscaling | LAN allowlist; adult-only; fictional or consented adults; local output folder |
| Private video generation | ComfyUI video workflows on the Windows GPU host | Image-to-video and short clips | Queue limits, VRAM guard, explicit workflow allowlist |
| Voice and dialogue | ElevenLabs API | Narration, character voice, dialogue stems | Key in safe storage; show usage; save audio locally |
| Cloud image/video | Provider-specific adapters such as Higgsfield or Runway when an official API is available to the account | Premium cloud rendering | Per-job consent, provider content rules, cost display, expiring-URL download |
| Research and API work | Grok/xAI Responses API or another selected reasoning provider | Web research, function calling, structured plans | Bounded turns and spend; custom functions execute only in the local registry |
| Desktop/application actions | Narrow native adapters, MCP servers, or approved command wrappers | Create documents, operate supported apps, query data | One declared capability per tool; least privilege; confirmation for consequential actions |

## Local creative route

Run ComfyUI on the Windows GPU machine and bind it to a private LAN address. Export each approved workflow in API format. The Mac connector submits only a validated workflow template plus bounded prompt parameters to `/prompt`, watches completion over `/ws`, retrieves results from `/history` and `/view`, hashes the output, and copies it into a dedicated Master Chief artifact directory.

For adult material, use only models and workflows whose licenses permit the intended use. Require every person to be an unambiguously fictional or consenting adult. Block minors or age-ambiguous subjects, real-person sexual deepfakes without documented consent, coercion, and non-consensual content. Cloud services remain subject to their own policies even when Master Chief permits a local request.

## Agentic execution contract

Every connector declares:

- stable ID, version, owner, destination, and data residency;
- JSON Schema input and bounded output contract;
- credential name held outside the renderer;
- read/write/network scope and artifact roots;
- timeout, retry, cancellation, concurrency, and spend limits;
- whether approval is per session or per invocation;
- audit event fields that exclude prompts, secrets, and raw personal data;
- rollback or cleanup behavior;
- test fixture and health check.

An agent run follows `plan → display → approve → execute → validate → report`. Read-only steps may run automatically when approved in Tool Access. File writes, uploads, paid generations, messages, publishing, purchases, account changes, and destructive operations receive a just-in-time confirmation.

## Implementation sequence

1. Add a versioned connector manifest and read-only health panel.
2. Add ComfyUI health discovery and one approved image workflow with a fixture-only test.
3. Add queued job progress, cancellation, artifact hashing, and preview.
4. Add an ElevenLabs TTS adapter with usage metadata and local MP3 output.
5. Add the agent loop with typed tool calls, maximum steps, time, spend, and concurrency.
6. Add cloud video adapters only after official API access and account terms are verified.
7. Add MCP adapters individually; never import an unreviewed server with broad filesystem or credential access.

## Credentials to configure later

- `ELEVENLABS_API_KEY` and an approved `voice_id`.
- `XAI_API_KEY` for Grok tool orchestration if selected.
- Provider keys for Higgsfield or Runway only when the account exposes documented API access.
- A private-LAN ComfyUI URL, for example `http://WINDOWS-LAN-IP:8188`, stored in local settings rather than committed source.

No key belongs in Git, the renderer, chat history, screenshots, or generated artifact metadata.
