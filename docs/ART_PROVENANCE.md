# Master Chief Hologram art provenance

Version: 1.1

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

## Acceptance checks

- Full figure remains readable within the 280-pixel stage.
- Cyan rim light stays visible against the dark interface.
- Transparent edges render without a rectangular matte.
- Missing video automatically reveals this still.
- Missing still falls back to the SVG placeholder.

## G0 controls

The visual direction, original-IP exclusions, seven-state taxonomy, icon review criteria, and approval checklist are in [VISUAL_STYLE_BRIEF.md](VISUAL_STYLE_BRIEF.md). New asset records must use [ASSET_INTAKE_SCHEMA.md](ASSET_INTAKE_SCHEMA.md) before any runtime export replaces an approved file.

## 3D-rendered hologram prototype

File: `assets/characters/holographic-command-officer-3d-v1.png`

Origin: Generated specifically for this project with the built-in image-generation tool on 2026-09-13. It is a 1024×1536 3D-rendered original command-officer image used for the idle/ready hologram setting; it is not a mesh or GLB asset.

Generation brief: original full-body futuristic naval command AI officer, dark navy uniform, cyan hologram light, no text, logo, weapon, helmet, visor, green armor, Halo imagery, franchise character, or watermark.

The app's **3D** display toggle enables this visual prototype and **Classic** restores the existing state artwork. Interactive 3D runtime work remains subject to the plan's GLB, performance, and fallback gate.
