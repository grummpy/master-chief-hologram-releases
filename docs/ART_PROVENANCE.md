# Master Chief Hologram art provenance

Version: 1.3

Date: 2026-09-12

## Primary character asset

File: `assets/master-chief-hologram-v1.png`

Dimensions: 1024×1536 pixels

Format: RGBA PNG with transparency

Origin: Generated specifically for this project with OpenAI's built-in image-generation tool. It is an original futuristic naval command AI and is not the Halo character or a copy of franchise armor.

## Generation prompt

> Create an original futuristic naval command AI avatar named Master Chief, represented as a confident full-body holographic officer standing at attention and ready to receive orders. This is an original character, not the Halo character and not based on any existing franchise armor. Use a polished high-end 3D character illustration with slightly stylized proportions, a modern dark navy command uniform, subtle technical panels, a luminous cyan hologram projection, restrained scanlines and particles, and a transparent background. Keep the full body centered and readable at 280-pixel display height. No text, logo, watermark, weapon, helmet, green sci-fi armor, Halo imagery, or celebrity likeness.

## Runtime use

The image is the video poster and static fallback in the hologram stage. CSS supplies a slow float and pulse until a reviewed idle video is added. The SVG placeholder remains available as a recovery asset.

## Interactive command companion

Reference panel: `assets/characters/command-officer-reference-v1.png`

Runtime scene: `three-scene.js`

The reference panel is an original project-generated adult futuristic female command-officer portrait, recorded in `assets/visual-state-manifest.json`. In v1.1.0 it is the primary in-app Commander Nova portrait and the texture used by the optional interactive scene. It does not represent a third-party character, franchise armor, or celebrity likeness.

Personal view: `assets/characters/commander-nova-personal-v1.png`

The v1.2.0 Personal view is an AI-generated, identity-preserving variation created with the built-in image-generation service from the approved reference panel. It depicts the same fictional adult Commander Nova, age 28+, in a fully opaque, off-the-shoulder futuristic evening bodysuit, thigh-high boots, and cyan holographic wrap. The production prompt required complete intimate coverage, no nudity, no sexual act, no fetish equipment, no weapons, no logos, no celebrity likeness, and no franchise elements. SHA-256 and native dimensions are recorded in `assets/visual-state-manifest.json`.

The Personal artwork changes presentation only. It does not change the active model, system prompt, tool permissions, cloud-consent flow, or Master Chief/Gov Army operating boundaries.

The interactive companion is a local WebGL plane using the approved Commander Nova portrait, rendered with Three.js 0.180.0 (`assets/vendor/three.module.min.js`, MIT). It is intentionally labeled Interactive/Static rather than 3D. It is not a downloaded mesh or final GLB character. The scene has a user-controlled static fallback, honors reduced-motion preferences, and performs no network asset fetches.

## Acceptance checks

- Full figure remains readable within the 280-pixel stage.
- Cyan rim light stays visible against the dark interface.
- Transparent edges render without a rectangular matte.
- Missing video automatically reveals this still.
- Missing still falls back to the SVG placeholder.

## G0 controls

The visual direction, original-IP exclusions, seven-state taxonomy, icon review criteria, and approval checklist are in [VISUAL_STYLE_BRIEF.md](VISUAL_STYLE_BRIEF.md). New asset records must use [ASSET_INTAKE_SCHEMA.md](ASSET_INTAKE_SCHEMA.md) before any runtime export replaces an approved file.
