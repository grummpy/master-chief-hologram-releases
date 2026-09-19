# Master Chief Hologram — Midnight Command

Current local release: **1.2.0**

Midnight Command is a private macOS command interface for local and explicitly selected cloud AI routes. Commander Nova is the original in-app command operator; the navy-and-gold mascot remains the launcher seal and Master Chief orchestration identity.

## What ships

- Three-pane command deck: operator, conversation, and system telemetry.
- Local-first Ollama route plus Codex Desktop, OpenAI, Grok, and configured Hugging Face endpoints.
- Visible `LOCAL` or `CLOUD` destination badge and a per-command confirmation before any cloud route.
- Main-process enforcement for chat, microphone, attachments, and diagnostics permissions.
- Provider-specific local conversation history, model-aware clearing, command palette, and local JSON export.
- Temporary TXT/MD/JSON/CSV retrieval with automatic index cleanup after each request.
- Offline whisper.cpp detection with a Finder-safe absolute ffmpeg runtime path.
- Cancel support for ordinary provider requests and Codex child processes.
- Static or interactive Commander Nova presentation, reduced-motion support, day/night themes, and keyboard-visible focus.
- Professional and Personal Commander Nova views with a persistent local preference and unchanged provider/tool authority.
- Enter transmits a command; Shift+Enter inserts a new line, with IME composition protected.
- Atomic Desktop launcher update with tests, package inspection, and rollback.

## Run from source

```bash
npm ci
npm test
npm start
```

The Desktop launcher at `/Users/daddy/Desktop/Master Chief Hologram.app` is a packaged local build. A clean fast-forward update triggers tests and a staged rebuild; the previous bundle is retained until the new bundle is installed and opened.

### Windows ComfyUI background worker

After ComfyUI and its GPU runtime are installed, `scripts/manage-comfyui-worker.ps1`
can register the worker as a per-user Windows Scheduled Task. It starts silently at
sign-in, restarts after a failure, and writes logs under
`%USERPROFILE%\MasterChief\logs`. Supported actions are `Install`, `Start`,
`Stop`, `Restart`, `Status`, and `Uninstall`. The task does not weaken the
controller-scoped Windows Firewall rule.

## Credentials and privacy

Credentials are migrated to encrypted macOS safe storage when available. Local `.env` compatibility is retained under the app user-data directory and ignored by Git. Never place keys in source, prompts, screenshots, logs, or committed configuration.

Ollama is the only route labeled fully local. Codex Desktop and API providers may use remote services, so the app displays `CLOUD` and asks for a one-time confirmation for every command. Attachments are temporary by default and removed from the local retrieval index after the request finishes.

## Local model setup

Install and start Ollama, then install a model appropriate for the machine:

```bash
brew install ollama
ollama serve
ollama pull qwen2.5:0.5b
ollama pull dolphin3:8b
```

The app discovers local Ollama model names. `OLLAMA_BASE_URL` can target an approved private-LAN worker. No model weights are stored in this repository.

## Offline voice

Install `whisper-cpp` and `ffmpeg`, then place a compatible GGML model in:

`~/Library/Application Support/master-chief-hologram/voice/models/`

The Systems panel reports missing components and offers a deterministic self-test. Recording begins only after microphone tool permission and macOS permission are both granted. Audio never falls back to a paid provider automatically.

## Release verification

```bash
npm run release:local
npm run release:readiness
```

`release:local` runs automated tests, asset and visual contracts, production dependency audit, packaging, and package inspection. `release:readiness` checks for an Apple Developer ID certificate. The current Desktop package is an ad-hoc-signed personal build; public distribution still requires Developer ID signing, notarization, stapling, and Gatekeeper evidence.

See [release evidence](docs/RELEASE_V1.2.0.md), [connector and agent plan](docs/CONNECTOR_AGENT_PLAN.md), [local creative model guidance](docs/LOCAL_CREATIVE_MODELS.md), [system flow](docs/SYSTEM_FLOW.md), [art provenance](docs/ART_PROVENANCE.md), and [technical learning guide](docs/TECHNICAL_LEARNING_GUIDE.md).

Built for Commander grummpy · 2026
