# Master Chief Hologram Desktop Bot

Current release: **1.0.2**

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

Download the video/image and place them in `assets/` (or the app will use a built-in placeholder).

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

GitHub Models is not offered as an AI route because GitHub retired the service on July 30, 2026. A GitHub token is used only for repository authentication.

## Design and operating package

- [Program plan](docs/PROGRAM_PLAN.md)
- [System flow and UML](docs/SYSTEM_FLOW.md)
- [Technical learning guide](docs/TECHNICAL_LEARNING_GUIDE.md)
- [Visual brief](docs/visual-brief.jpg)

---

Built for Commander grummpy · 2026
