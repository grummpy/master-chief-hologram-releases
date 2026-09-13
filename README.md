# Master Chief Hologram Desktop Bot

Current release: **1.0.4**

The supplied Master Chief bot artwork now drives the interactive desktop command center. Click the hologram to focus the command field; its expression changes while it listens, thinks, reports, succeeds, or needs attention. **Auto** uses local time (light from 7:00 AM through 6:59 PM), and Light/Dark overrides persist.

The Desktop launcher is now a packaged macOS app. Opening it no longer runs npm or installs dependencies. AI keys remain outside the bundle in `~/Library/Application Support/master-chief-hologram/.env`.

**Your personal holographic AI command center.**

A floating, always-on-top desktop holographic companion of the **Master Chief** skill bot from [bot-and-skills](https://github.com/grummpy/bot-and-skills).

He displays the original chibi navy Master Chief mascot as a glowing cyan hologram and lets you run any prompt through selected AI models:

- **Grok** (xAI) / Grok bots
- **ChatGPT/Codex Desktop** through the installed Codex CLI
- **Codex** (OpenAI code specialist)
- **Codex Desktop** using the existing ChatGPT/Codex login (recommended)
- **OpenAI API** using GPT-5.6 Sol when API billing is available
- **Grok** through xAI when an xAI API key is configured
- Authenticated GitHub repository access for future update workflows

## Visuals (generated for this project)

- **Holographic still**: [View](https://grok.com/imagine/post/d85c4619-6918-45ed-8326-be0bc8ab4ddd?source=agent)
- **Idle holographic video (6s loopable)**: [View](https://grok.com/imagine/post/ad3392da-ab48-4ba5-ba34-88952bb7377c?source=agent)
- **Original solid mascot (transparent)**: [View](https://grok.com/imagine/post/23655507-73ca-4af7-883b-01941dd9ad5c?source=agent)

The repository includes the supplied state artwork under `assets/states/` and uses the original mascot as its identity fallback.

## Quick Start (Electron desktop app)

```bash
git clone https://github.com/grummpy/master-chief-hologram.git
cd master-chief-hologram
npm install
# copy .env.example to .env and add your keys
npm start
```

The window is frameless, transparent, always-on-top, and shows the hologram + chat panel.

### API Keys

Create `.env`:

```
XAI_API_KEY=your_xai_key
OPENAI_API_KEY=your_openai_key
# optional for authenticated repository access and future update checks
GITHUB_TOKEN=your_github_token
```

## How it works

1. Select model from the dropdown.
2. Type your prompt (or load a Master Chief tasking prompt).
3. The bot routes it to the selected provider and keeps local conversation context per provider.
4. Master Chief mode: prepends the full Master Chief skill system prompt so the model acts as the orchestrator from your bot-and-skills repo.

## Features

- True holographic aesthetic (CSS + video)
- Always-on-top, click-through optional, minimize to tray
- Model switcher with live authentication and availability status
- Prompt templates for Master Chief / specialists
- Local history
- Voice input ready (browser SpeechRecognition) + future TTS

## Integration with bot-and-skills

This is the visual "face" of `skills/master-chief`. Use it as the desktop front-end for your skill army.

## Next upgrades (Master Chief standby)

- Full voice conversation with the hologram reacting
- Direct routing into the other skills (Jarvis, Leonardo, etc.)
- System tray + hotkey summon
- Local Ollama / LM Studio support
- Signed native packaging and automatic update rollback

## Local voice setup

The app reports local ASR readiness in the Systems panel. To enable offline
transcription, install `whisper-cli` from whisper.cpp and `ffmpeg`, then set
`WHISPER_CPP_BIN` and `WHISPER_CPP_MODEL` in the app's local `.env` file. The
model must be a downloaded GGML whisper model file. If either executable or the
model is missing, the MIC control remains usable through cloud transcription
when `OPENAI_API_KEY` is configured, and the Systems panel shows the exact
missing setup item. No model is downloaded automatically.

GitHub Models is not offered as an AI route because GitHub retired the service on July 30, 2026. A GitHub token is used only for repository authentication.

## Design and operating package

- [Program plan](docs/PROGRAM_PLAN.md)
- [System flow and UML](docs/SYSTEM_FLOW.md)
- [Technical learning guide](docs/TECHNICAL_LEARNING_GUIDE.md)
- [Visual brief](docs/visual-brief.jpg)
- [Art provenance](docs/ART_PROVENANCE.md)
- [Verified runtime appearance](docs/runtime-v1.0.3.png)

---

Built for Commander grummpy · 2026

## Reaction States (Day / Night)

See [STATES.md](STATES.md). Full art pack also on Google Drive:
https://drive.google.com/drive/folders/1PtTkpeiAhop0MU-6hWZy5O3GmW8QkQG3

Use `index-with-states.html` for the fully wired Day/Night + 12-state hologram UI, or merge `setState()` into your current `index.html`.
