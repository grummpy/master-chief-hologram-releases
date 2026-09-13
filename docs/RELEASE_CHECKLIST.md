# Release checklist

Version: 1.0.4 baseline  
Owner: Master Chief Hologram maintainers  
Status: repeatable local release gate

Run these checks from the repository root before replacing the Desktop bundle:

```sh
npm ci --ignore-scripts
npm test
npm run test:assets
node --check main.js
node --check renderer.js
git diff --check
npm run dist:mac
```

Release acceptance:

- `npm test` passes, including the deterministic asset test.
- `assets/icon.png`, the hologram still, and the SVG fallback exist and are non-empty.
- The macOS build references `assets/icon.png` and packages `assets/**/*`.
- The bundle launches from a clean checkout and shows the fallback if the primary visual is unavailable.
- Microphone permission denial and provider errors remain visible in the UI.
- Tool access lists each capability's data scope and risk class; network, microphone, and attachment actions are disabled until explicitly approved.
- Approval settings are stored in the app user-data directory with restrictive permissions and never in packaged assets.
- `scripts/launch-mac.sh` preserves the current bundle if fetch, install, or build fails.
- Only `Master Chief Hologram.app` remains on the Desktop after a successful launch; prior bundles are not source artifacts.

Evidence to retain in the release note: commit SHA, package version, test output, build target, signing state, and any skipped live microphone or network checks.
