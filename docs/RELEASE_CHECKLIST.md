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
npm run inspect:mac
```

Release acceptance:

- `npm test` passes, including the deterministic asset test.
- `assets/icon.png`, the hologram still, and the SVG fallback exist and are non-empty.
- The macOS build references `assets/icon.png` and packages `assets/**/*`.
- `build-info.json` is generated for the build and its version matches `package.json` and the macOS bundle.
- The package inspector confirms required runtime modules and app assets are present in `app.asar`.
- The bundle launches from a clean checkout and shows the fallback if the primary visual is unavailable.
- Microphone permission denial and provider errors remain visible in the UI.
- Tool access lists each capability's data scope and risk class; network, microphone, and attachment actions are disabled until explicitly approved.
- Approval settings are stored in the app user-data directory with restrictive permissions and never in packaged assets.
- `scripts/launch-mac.sh` preserves the current bundle if fetch, install, or build fails.
- Only `Master Chief Hologram.app` remains on the Desktop after a successful launch; prior bundles are not source artifacts.

Evidence to retain in the release note: commit SHA, package version, test output, build target, signing state, and any skipped live microphone or network checks.

## Signing and notarization readiness

The current local build uses an ad hoc signature and is for local use only. Do not set an identity in source control and do not sign with an unverified certificate. Before a public macOS release, run:

```sh
npm run release:readiness
```

The check reports whether a **Developer ID Application** certificate is installed and changes nothing. A public release needs a separate CI or release-machine workflow that signs the final artifact, submits it for Apple notarization using credentials stored in the keychain or CI secrets, staples the ticket, and re-runs `npm run inspect:mac`. Record the certificate team ID and notarization result in the release note; never record credentials.
