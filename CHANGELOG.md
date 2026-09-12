# Changelog

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
