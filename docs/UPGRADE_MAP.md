# Master Chief Hologram Product Upgrade Map
Version 1.1 · 2026-09-12 · Draft baseline

## Outcome and acceptance measures

Make the launcher recognizable, microphone input dependable, controls discoverable, and the desktop companion maintainable as a production product.

| Requirement | Acceptance evidence |
|---|---|
| Artwork identifies Master Chief | Packaged launcher and in-app hero show the approved armored character at 1x and Retina sizes. |
| Voice transcribes to command box | MIC requests permission, shows Listening, inserts interim/final transcript, and recovers from denied/no-input states. |
| UI is easy to operate | Keyboard focus, visible status, disabled busy states, and accessible names pass a manual flow check. |
| Release is reproducible | `npm run dist:mac` completes and the packaged app opens from `dist/mac-arm64`. |

## Current baseline

Electron 44, vanilla HTML/CSS/JavaScript, localStorage conversation history, Codex/OpenAI/Grok routes, static day/night JPG state art, and electron-builder macOS directory packaging. The current implementation now explicitly grants media permission and primes `getUserMedia` before Web Speech recognition.

## Prioritized work breakdown

1. **P0 voice reliability:** test permission grant/deny, no microphone, recognition error, interim text, final text, cancel, and repeated sessions on macOS. Add a native transcription fallback if Chromium Web Speech is unavailable.
2. **P0 release integrity:** commit only source and approved artwork; exclude generated `dist`, duplicate filenames, and temporary exports. Add CI syntax check and package smoke test.
3. **P1 interaction polish:** add a clear recording indicator, Escape to stop listening, Enter/Command-Enter behavior documentation, and focus restoration after transmit.
4. **P1 visual system:** generate an approved icon set from one source image, validate transparent padding and Retina sizes, and use a consistent state crop so character identity survives theme changes.
5. **P1 observability:** structured local error events for microphone, provider, and renderer failures with redacted messages and a user-facing diagnostics panel.
6. **P2 production hardening:** signed/notarized distribution, automatic update strategy, crash reporting with consent, encrypted credential storage, and provider health timeouts.

## Risks and decisions

- Web Speech recognition is browser/runtime dependent and may require network access; native or hosted transcription is the fallback decision trigger.
- Artwork is an original mascot-style armored character; retain provenance in `ART_PROVENANCE.md` and review trademark/confusion risk before public distribution.
- API keys remain outside packaged assets; never put `.env` or raw provider errors in release artifacts.

## Git and release practice

Use short feature branches (`codex/voice-reliability`, `codex/ui-polish`), small commits, pull-request review, and required checks: syntax, packaging, manual microphone flow, and visual smoke test. Tag a release only after the acceptance table is satisfied; retain the previous app bundle for rollback.

## Upgrade standby

Reconsider native transcription when Web Speech fails on a supported macOS build, when offline use becomes a requirement, or when users need speaker/language controls. Reconsider the UI framework only when state complexity or accessibility defects exceed what the current DOM can safely maintain.
