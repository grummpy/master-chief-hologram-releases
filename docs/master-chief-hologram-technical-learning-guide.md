# Master Chief Hologram Technical Learning Guide
Version 1.1 · 2026-09-12 · Draft

This project is a small Electron desktop application: a Chromium renderer presents the hologram UI, a preload bridge exposes a narrow API, and the main process handles windows, tray behavior, provider calls, and microphone permission.

## Core flow

MIC click → `getUserMedia({audio:true})` permission → Web Speech recognition → interim/final transcript → command textarea → transmit → provider route → rendered response. Sensitive credentials stay in `.env` outside the packaged asset set.

## Industry practice and alternatives

Electron is widely used for cross-platform desktop products; Web Speech is convenient but runtime-dependent. Alternatives are native macOS Speech APIs for offline/control, Whisper-compatible local inference for privacy, or a hosted transcription API for consistency. The current choice satisfies the lowest integration effort; native/local transcription becomes preferable when offline reliability or privacy is a release requirement.

| Option | Capability | Ease | Cost/licensing | Offline | Migration risk |
|---|---|---|---|---|---|
| Web Speech in Electron | Fast prototype, interim text | Easy | Runtime-provided | Weak/variable | Medium |
| macOS Speech framework bridge | Native permissions and control | Medium/high | Apple SDK | Better | Medium/high |
| Local Whisper runtime | Strong transcription/privacy | Medium | Model/runtime resources | Strong | Medium |
| Hosted transcription API | Consistent models | Easy/medium | Usage-based | None | Low/medium |

## Learning path

Read `main.js` and `preload.js`, trace one command in `renderer.js`, run the microphone acceptance flow, then add one provider-independent error event and verify it does not expose credentials. Open questions are supported macOS versions, offline requirement, target distribution channels, and whether public branding needs a legal review.
