# Visual regression baseline

The hologram has a local regression gate that needs no browser, network service, or GPU. It protects approved launcher artwork, every image used by the day/night state map, and the UI contract that presents those states.

Run `npm run test:visual`.

The gate checks SHA-256 values and native dimensions in `assets/visual-state-manifest.json`, then verifies required hologram DOM, accessibility, theme, state-image, focus, and reduced-motion CSS contracts. This catches accidental artwork replacement, state-map loss, a broken image stage, and removal of state cues.

For intentional artwork changes, review the image at its target size, update the manifest hash and dimensions in the same commit, and record why in the release note. The manifest is an approval record, not a generated artifact.

This deterministic foundation can later be supplemented with packaged-app pixel snapshots. Keep this gate because its asset integrity and UI-state coverage are fast and stable locally.
