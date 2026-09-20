# Master Chief Hologram 1.34.0 — image-control hardening

Date: 2026-09-20

## Completed without loading the Windows GPU

- Corrected major revision precedence: **Rebuild from request** now forces its 0.98 redraw setting instead of being overwritten by the ordinary media-panel denoise value.
- Major rebuild starts with a random seed while retaining the source as lineage evidence.
- Revisions and rebuilds now reject an artifact whose SHA-256 is identical to the source.
- Every returned image is checked for existence, nonzero content, checksum agreement, minimum dimensions, and duplicate results within the same job.
- Reference Studio now stores dedicated identity, style, pose, composition, depth, and lighting reference roles and selects the appropriate role for identity/pose/structure workflows.
- Added a versioned 12-case image benchmark covering prompt adherence, identity, composition, anatomy, lighting, technical quality, lineage, operator recovery, pose, two subjects, inpaint, depth, and upscale.
- Frozen promotion gate: 90/100 weighted quality, 20-job durability, visible revision change, and zero lost outputs.

## Intentionally deferred while Minecraft is open

No ComfyUI workflow was submitted, no model was loaded, and no Windows GPU/RAM benchmark was run in this increment. Live validation remains required for pose extraction, identity seeds, inpaint/outpaint, depth, multi-person identity, model comparisons, vision scoring, and the 20-job acceptance gate.

## Evidence

- 145 automated tests pass.
- Asset validation passes.
- Visual regression passes.
- JavaScript syntax and Git whitespace checks pass.
