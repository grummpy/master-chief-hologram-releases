# Technical learning guide: Master Chief Hologram

Version: 1.0.2

Date: 2026-09-12

## What the system does

Electron combines a Chromium user interface with a Node.js main process. The renderer draws the hologram, model selector, status chips, conversation, and prompt controls. A narrow preload bridge sends approved requests to the main process. The main process holds credentials and calls the selected provider.

Master Chief mode adds an orchestration instruction before the conversation. It tells the model to preserve context, define the program through PAPM, select only useful specialists, verify work, and maintain an upgrade backlog. It does not grant the model extra account or computer permissions.

## Provider routes

| Route | Authentication | Strength | Limitation | Project choice |
|---|---|---|---|---|
| Codex Desktop | Existing ChatGPT/Codex login | Works like the installed Codex environment and requires no separate API key | Each hologram request starts an ephemeral read-only Codex task | Primary route |
| OpenAI API | Local API key and API billing | Direct application API with modern Responses models | Separate billing and usage limits apply | Optional route |
| Grok API | Local xAI API key | Independent model provider | Requires an xAI key and account access | Optional route |
| GitHub token | Local personal access token | Repository authentication and future update workflows | GitHub Models inference was retired; the token is not an AI provider | Repository access only |

## Industry pattern

Desktop AI clients commonly separate the visible renderer from privileged credentials and provider calls. A preload bridge exposes a small interface instead of giving webpage code full Node.js access. Health checks show whether a route is installed, authenticated, missing, or failing. A local history store supports continuity without automatically sending one provider's conversation to another.

## How to operate it

1. Double-click the Master Chief launcher.
2. Confirm the Codex status chip is green.
3. Keep Codex Desktop selected for prompts using the ChatGPT desktop login.
4. Select OpenAI only after adding API credits; select Grok only after adding a valid xAI key.
5. Keep MC Mode enabled for program planning and specialist routing.
6. Use Clear to remove the selected provider's local conversation history.

## Learning path

Practice provider selection, connection-state interpretation, local-versus-remote credential boundaries, and the difference between authentication and paid inference availability. Next, learn Electron's main/renderer separation, IPC allowlists, and release signing.
