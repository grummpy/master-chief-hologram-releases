# Master Chief Hologram art provenance

Version: 1.2

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

The reference panel is an original project-generated futuristic female command-officer portrait, recorded in `assets/visual-state-manifest.json`. It appears only as a translucent panel behind the real-time scene and does not represent a third-party character, franchise armor, or celebrity likeness.

The seated companion and command chair are original low-poly primitive geometry assembled at runtime in `three-scene.js`. They are rendered locally with Three.js 0.180.0 (`assets/vendor/three.module.min.js`, MIT). This is a WebGL interaction prototype: it is not a downloaded mesh, an image-to-3D conversion, or a final GLB character. The scene has a user-controlled 2D fallback and no network asset fetches.

## Acceptance checks

- Full figure remains readable within the 280-pixel stage.
- Cyan rim light stays visible against the dark interface.
- Transparent edges render without a rectangular matte.
- Missing video automatically reveals this still.
- Missing still falls back to the SVG placeholder.

## G0 controls

The visual direction, original-IP exclusions, seven-state taxonomy, icon review criteria, and approval checklist are in [VISUAL_STYLE_BRIEF.md](VISUAL_STYLE_BRIEF.md). New asset records must use [ASSET_INTAKE_SCHEMA.md](ASSET_INTAKE_SCHEMA.md) before any runtime export replaces an approved file.
