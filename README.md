# Master Chief Hologram Desktop Bot

**Your personal holographic AI command center.**

A floating, always-on-top desktop holographic companion of the **Master Chief** skill bot from [bot-and-skills](https://github.com/grummpy/bot-and-skills).

He displays the original chibi navy Master Chief mascot as a glowing cyan hologram and lets you run any prompt through selected AI models:

- **Grok** (xAI) / Grok bots
- **ChatGPT** / GPT-4o / o1 (OpenAI)
- **Codex** (OpenAI code specialist)
- **GitHub Copilot** / Copilot Chat style (via GitHub Models or OpenAI-compatible)
- Easy extension for more

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
# optional for GitHub Models / Copilot style
GITHUB_TOKEN=your_github_token
```

## How it works

1. Select model from the dropdown.
2. Type your prompt (or load a Master Chief tasking prompt).
3. The bot routes it to the correct provider, streams the reply, and keeps conversation context per model.
4. Master Chief mode: prepends the full Master Chief skill system prompt so the model acts as the orchestrator from your bot-and-skills repo.

## Features

- True holographic aesthetic (CSS + video)
- Always-on-top, click-through optional, minimize to tray
- Model switcher with live status
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
- GitHub Copilot Workspace deep link

---

Built for Commander grummpy · 2026
