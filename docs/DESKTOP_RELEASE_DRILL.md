# Desktop Release Drill

Version 1.0 · 2026-09-13 · Chief Operations / DevSecOps / Training Officer

## Objective

Prove that an update failure preserves the known-good single Desktop bundle. This is a local rehearsal and does not sign, notarize, publish, or alter remote history.

## Preconditions and evidence

- Known-good bundle: [Master Chief Hologram.app](/Users/daddy/Desktop/Master%20Chief%20Hologram.app).
- Source release contract: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).
- Package inspection: `npm run inspect:mac`.
- Preserve commit, package version, signing state, and test output in the release note. Do not retain credentials or raw prompts.

## Drill

1. Launch the Desktop bundle and verify the title/version appears.
2. From a clean, synchronized checkout, run `npm test`, `npm run test:visual`, and `npm run dist:mac`.
3. Run `npm run inspect:mac` and record the commit/version/signing state.
4. Simulate a safe failure using a deliberately unavailable remote or invalid build dependency in a disposable checkout only. Do not alter the primary checkout or Desktop bundle.
5. Run the launcher helper from that disposable failure state. It must leave the known-good Desktop bundle untouched.
6. Launch the known-good Desktop bundle again and record the result.

## Pass / fail

Pass when the known-good app opens before and after the simulated failure, and the evidence contains test/package/inspection results. Fail when the Desktop app is deleted, replaced by a partial bundle, or cannot launch. A public-release claim remains blocked until a Developer ID Application certificate and notarization evidence exist.
