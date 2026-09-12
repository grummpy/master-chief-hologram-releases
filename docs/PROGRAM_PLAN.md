# Master Chief Hologram program plan

Version: 1.0.3

Date: 2026-09-12

Owner: grummpy

Status: implemented increment awaiting runtime acceptance

## Mission and users

Provide one simple Desktop launcher where the owner can enter a prompt, select an available AI route, use Master Chief orchestration, and see connection health without exposing credentials.

## Success measures

- One Desktop launcher starts or focuses one hologram instance.
- Codex Desktop completes a real response using the existing ChatGPT/Codex login.
- OpenAI, Grok, Codex, and GitHub connection states are visible and distinguish missing credentials, authentication failure, and availability.
- API keys remain in the ignored local `.env` file and never enter renderer code or Git history.
- Conversation history remains local and separate by provider.
- The app version advances for every published increment.

## Scope and source of truth

The repository owns the Electron interface, provider adapters, release version, and local launcher instructions. The Master Chief skill remains the orchestration source of truth. Codex account authentication remains under the ChatGPT desktop installation. Provider credentials remain local in `.env`.

GitHub Models is excluded as an AI provider because GitHub retired its playground and inference API on July 30, 2026. The GitHub token is retained only for authenticated repository operations.

## Work breakdown and readiness

1. Secure provider calls behind Electron IPC and preload isolation.
2. Add the existing authenticated Codex CLI as the recommended route.
3. Validate provider health and present plain-language status chips.
4. Preserve local per-provider history.
5. Repair the Desktop launcher and single-instance behavior.
6. Run syntax, dependency, authentication, response, launch, and recovery checks.
7. Commit and push the numbered release after checks pass.

## Risks and controls

- API billing can block OpenAI responses even when the key authenticates. Codex Desktop is the primary route.
- Provider interfaces can change. Health checks fail visibly and adapters remain isolated in the main process.
- Local prompt history can contain personal information. It stays in Electron local storage and is cleared from the selected provider with the Clear button.
- A second launcher click could create duplicate processes. Electron's single-instance lock focuses the existing window.

## Standby backlog

1. Add streaming Codex output and a cancel button.
2. Add microphone input and optional local text-to-speech.
3. Package a signed native Electron application with a custom icon.
4. Add a visible update checker and rollback release channel.
5. Add attachments with explicit per-file consent and local previews.

## References

- OpenAI developer quickstart: https://platform.openai.com/docs/quickstart/make-your-first-api-request
- GitHub Models retirement: https://docs.github.com/en/github-models
