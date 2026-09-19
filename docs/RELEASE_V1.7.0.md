# Master Chief Hologram v1.7.0 — Reference Studio Execution

Date: 2026-09-19

## Delivered

- Project → Subject → Reference Sheet → Shot → Variant hierarchy.
- Automatic schema-v1 migration with stable IDs and preservation of existing subject/shot records.
- Appearance notes, palette, pose, environment, camera, lighting, checkpoint, workflow, continuity locks, reference strength, and denoise metadata.
- PNG/JPEG/WebP import and drag/drop into a persistent contact sheet.
- Candidate/approved/rejected review state, annotations, branching, A/B comparison, and four-up comparison.
- Executable multi-shot queue with concurrency 1–3, persistent per-shot state, individual retry, queue cancellation, and resume.
- Generated variants retain media-ledger request IDs, hashes, parent shots, annotations, branches, and review status.
- Queue clearing and runtime close request ComfyUI model/cache release while keeping projects, variants, artifacts, and lineage.
- IP-Adapter and ControlNet remain visibly gated. No unsupported node or unverified model was silently installed.

## Verification

- Automated Node suite covers schema migration, complete hierarchy, review state, queue clearing, lineage retention, and operator controls.
- Existing v1.6 media reliability, prompt integrity, job ledger, workflow registry, artifact, and packaging tests remain active.
- Asset and Midnight Command visual contracts must pass before packaging.
- Live Windows ComfyUI remains available through the proven v1.6 job adapter; stock SDXL is the installed checkpoint at this release gate.

## Deferred gate

IP-Adapter/ControlNet promotion requires all of: AMD-compatible nodes observed on the worker, exact model files with checksums and licenses, a versioned API workflow, reference-strength mapping, a real output comparison, VRAM recovery, and rollback evidence.
