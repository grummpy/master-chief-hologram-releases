# Changelog

## 1.0.5

- Stopped ordinary launcher clicks from rebuilding and replacing the running app.
- Stopped command suggestions from opening or selecting anything on an empty prompt.
- Restored the supplied Master Chief mascot as the interactive 3D identity instead of drawing a generic officer over it.
- Reduced 3D pixel density and paused rendering while hidden.

## 1.0.4

- Replaced the placeholder officer with the supplied Master Chief bot artwork.
- Added interactive command states, automatic time-of-day themes, and Light/Dark overrides.
- Added accessible controls, compact-window behavior, cancellation, and provider-specific chat history.
- Enabled renderer sandboxing and background throttling, removed perpetual idle animations, and added a packaged macOS build.

## 1.0.3 — 2026-09-12

- Added original full-body Master Chief AI hologram artwork to the repository and application.
- Added subtle idle float and pulse animation for the static hologram.
- Added asset provenance, generation prompt, runtime role, and acceptance checks.
- Preserved the SVG fallback for missing or damaged artwork.

## 1.0.2 — 2026-09-12

- Removed an accidental square preview duplicate from the release package.
- Kept the verified 16:9 PAPM visual brief as the canonical image.

## 1.0.1 — 2026-09-12

- Added Codex Desktop as the recommended working AI route using the existing ChatGPT/Codex login.
- Added provider health chips for Codex, OpenAI, Grok, and GitHub repository authentication.
- Moved credentials and provider calls out of the renderer into the Electron main process.
- Removed the retired GitHub Models inference option.
- Added local per-provider conversation history and single-instance focus behavior.
- Updated Electron and removed vulnerable dependencies; `npm audit` reports zero vulnerabilities.
- Added the PAPM program plan, system flow/UML, visual brief, and technical learning guide.
- Added a reliable macOS launcher script.
