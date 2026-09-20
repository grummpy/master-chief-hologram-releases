# ComfyUI and Reference Studio upgrade report

Date: 2026-09-20  
Application target: Master Chief Hologram 1.24.0  
Worker: `192.168.4.31:8188` on the private LAN

## Executive finding

The Windows worker is current, healthy, and substantially more capable than the application currently exposes. Live evidence reports ComfyUI 0.36.0, frontend 1.53.6, workflow templates 0.11.62, PyTorch 2.13.0 with ROCm 10, an AMD Radeon RX 9060 XT with approximately 16 GB VRAM, and an empty queue during the audit.

The largest quality problem is not prompt truncation or transport. The application sends the positive and negative prompt verbatim into the registered API workflow. The quality ceiling comes from using a text-only SDXL graph for work that needs spatial, identity, pose, masking, and staged-revision controls. The worker already has many of the necessary nodes and model files, but the app has not registered verified workflows for them.

## Live inventory

### Installed and working

- Checkpoints: Juggernaut XL v9 and SDXL Base 1.0.
- VAE: `sdxl_vae.safetensors`.
- Upscaler: `4x-UltraSharp.pth`.
- ControlNet models: OpenPose XL v2, OpenPose Control LoRA, and InstantID SDXL.
- CLIP Vision: ViT-H/14 LAION model.
- IP-Adapter FaceID Plus v2 SDXL model and matching LoRA.
- Core nodes: advanced KSampler, inpainting conditioning, ControlNet Advanced, CLIP Vision, LoRA, model upscale, regional conditioning, and partial conditioning.
- Custom IP-Adapter nodes, including FaceID, advanced weighting, composition/style modes, and InsightFace loader.
- Existing app workflows: SDXL image, revision, rebuild, external-VAE variants, Lanczos upscale, and bounded UltraSharp upscale.

### Present in ComfyUI but not yet productized in the app

- Identity-preserving FaceID/IP-Adapter workflow.
- OpenPose/ControlNet pose workflow.
- Masked inpaint/outpaint workflow.
- Regional prompt/conditioning workflow.
- LoRA selection and strength controls.
- Advanced sampler start/end controls.
- Reusable subgraph/blueprint ingestion.
- Native queue progress events rather than polling-only status.
- Workflow metadata recovery and workflow import from generated media.
- Side-by-side Compare Image experience equivalent to current ComfyUI UX.

### Readiness limitation

The worker does not expose an OpenPose preprocessor node in the current object inventory. It can consume an already prepared pose map, but a one-click “extract pose from photo” feature needs a separately verified preprocessor node/package. The prepared-map graph passed a live AMD execution test; semantic pose quality remains pending a valid pose-map fixture. The FaceID files and nodes are present, but the required InsightFace `buffalo_l` or `antelopev2` recognition model is not installed. Those missing components must be treated as model/node readiness changes, with compatibility, license, checksum, rollback, and AMD validation before enablement.

## Current upstream ComfyUI capabilities reviewed

The official ComfyUI 0.36.0 line includes current frontend/templates packages, model blueprints, reusable subgraphs, App Mode, workflow templates, partial graph execution and caching, queue/progress events, metadata-based workflow recovery, improved VRAM/offload behavior, and broader image/video model support. The app should consume these capabilities through versioned API-format workflows rather than depending on unstable UI internals.

Subgraphs are valuable for reusable identity, pose, lighting, and finishing blocks. They should not replace the app's versioned API graphs yet: current upstream issue reports identify subgraph flattening/widget-order regressions in some templates. Pin, test, and retain a non-subgraph rollback graph for each production workflow.

Official references:

- https://github.com/Comfy-Org/ComfyUI
- https://github.com/Comfy-Org/ComfyUI/releases
- https://github.com/Comfy-Org/workflow_templates
- https://github.com/Comfy-Org/rfcs/blob/main/rfcs/0005-subgraph.md
- https://docs.comfy.org/zh-CN/development/comfyui-server/comms_messages

## Prompt-fidelity test

The live test used Juggernaut XL v9, the external SDXL VAE, DPM++ 2M SDE/Karras, 32 steps, CFG 6.5, 832×1216, and a fixed seed. The exact operator prompt and negative prompt were recorded in a JSON manifest with the workflow checksum and output checksum.

Result: completed successfully in approximately 23 seconds. Artifact SHA-256: `7c07b2339345c0b6472007d13b8ef77ef3cc7b88c6090b0e2c78f2c81b1df5ff`.

### Weighted fidelity score

| Dimension | Weight | Score | Evidence |
|---|---:|---:|---|
| Subject and adult presentation | 15 | 15 | Correct adult gothic subject and styling. |
| Wardrobe/material detail | 15 | 14 | Strong corset, lace, layered black fabric, boots. |
| Environment and props | 10 | 10 | Dark luxury interior and carved velvet chaise. |
| Camera/composition | 15 | 11 | Portrait/full seated composition, but less spatially exact than requested. |
| Pose and limb geometry | 20 | 8 | Conventional crossed-leg pose replaced the requested planted/extended-leg geometry; hand control was incomplete. |
| Lighting and color | 10 | 6 | Warm low-key look succeeded; cyan rim separation was weak. |
| Face/anatomy/artifact quality | 10 | 8 | Strong face and general anatomy; hand/pose evidence is insufficient for precision work. |
| Reproducibility and provenance | 5 | 5 | Fixed seed, exact settings, workflow checksum, artifact checksum, and manifest recorded. |
| **Total** | **100** | **77** | Strong editorial image; below the 90-point production target for exact scene direction. |

The failure pattern is typical of text-only SDXL. More prose alone will not reliably solve pose, identity, or regional composition. Those requirements need dedicated conditioning workflows.

## Reference Studio versus an industry-grade studio

### Already competitive

- Project → Subject → Reference Sheet → Shot → Variant hierarchy.
- Approved/candidate/rejected views, annotations, branches, A/B, four-up comparison.
- Versioned workflow registry, model selector, queue, retry/resume/cancel, lineage, hashes, and archive.
- Separate positive and negative prompts, reference strength, denoise, pose, environment, camera, lighting, and continuity locks.
- Bounded upscaling and explicit runtime/VRAM release.

### Gaps preventing professional scene direction

- No true “no reference” contract before 1.24.0; blank selection silently fell back to an approved old image.
- No identity-only, style-only, pose-only, depth-only, or composition-only reference slots.
- No mask editor, inpaint region, outpaint canvas, or regional prompt overlay.
- No pose-map extraction/editor or ControlNet strength/start/end controls.
- No per-feature lock summary showing what will remain fixed and what will change.
- No parameter recipes tied to the requested kind of change.
- No rendered prompt/parameter review card before queue submission.
- No automated contact-sheet scoring for identity, prompt adherence, anatomy, and technical defects.
- No import/export bridge for official ComfyUI workflow/template metadata.
- Polling is used for job progress even though the server exposes granular execution events.

## Upgrade checklist

### P0 — state correctness and operator trust

- [x] Add a persisted reference mode: approved, selected, or none.
- [x] Ensure `none` never falls back to an approved or stale image.
- [x] Add **Clear active reference** without deleting saved work.
- [x] Add **New clean draft** without deleting projects, references, variants, or media.
- [x] Add an **Edit** action that reloads all shot controls.
- [x] Show the reference mode on each queued shot.
- [x] Add regression tests for clean mode and Reference Studio controls.
- [x] Add a preflight card showing the exact prompt, negative prompt, reference path/mode, model, workflow, seed, sampler, scheduler, steps, CFG, size, denoise, and strengths before queueing.
- [x] Add a stale-source check that rejects a missing or changed selected artifact.

### P0 — live capability truth

- [x] Read `/object_info` and report advanced sampler, inpaint, ControlNet, CLIP Vision, IP-Adapter, LoRA, upscale, and conditioning capabilities.
- [x] Query installed ControlNet, CLIP Vision, LoRA, VAE, checkpoint, and upscaler catalogs.
- [x] Display detected advanced reference capabilities in Reference Studio.
- [x] Report current frontend and template package versions from `/system_stats`.
- [x] Add compatibility results per registered workflow: ready, missing node, missing model, or disabled.
- [x] Add a one-click **Open ComfyUI Design Studio** action for the live worker; automatic graph/session handoff remains queued.

### P1 — scene progression for a novice operator

- [x] Add one-click guidance for new scene, new pose, camera change, relight, detail pass, and structural rebuild.
- [x] Keep the guidance visible and editable instead of silently rewriting the operator's prompt.
- [x] Add first-wave recipes for portrait, full body, turnaround sheet, and cinematic framing; two-person, product, and environment recipes remain queued.
- [x] Add **What changes / What stays locked** review before execution.
- [x] Add explainers for denoise, CFG, seed, sampler, scheduler, and reference strength beside each control.
- [x] Add four-variant exploration, automatic contact-sheet intake, and promote-winner through the existing variant review flow.

### P1 — identity and style control

- [ ] Register and checksum an SDXL FaceID/IP-Adapter API workflow using the installed FaceID model, LoRA, CLIP Vision model, and InsightFace provider.
- [ ] Validate InsightFace on AMD/ROCm and compare CPU versus ROCm reliability.
- [ ] Expose identity strength, FaceID v2 strength, start/end percentage, embed combination, and scaling mode behind a Basic/Advanced toggle.
- [ ] Separate identity reference from style/composition reference.
- [ ] Test at least ten seeds against one approved character sheet and score face similarity and clothing continuity.
- [ ] Preserve a text-only rollback workflow.

### P1 — pose and structural control

- [x] Register a ControlNet API workflow that accepts a prepared OpenPose map.
- [x] Add pose-control strength and start/end percentage.
- [ ] Verify OpenPose XL and Control LoRA independently against Juggernaut XL and SDXL Base.
- [ ] Review and explicitly approve a compatible OpenPose preprocessor package before installation.
- [ ] After approval, add **Extract pose** and an editable pose preview.
- [ ] Add depth/canny only after their model files and workflows pass the same readiness gate.

### P1 — targeted editing

- [ ] Register inpaint workflow with source image, mask, crop/padding, denoise, and feathering.
- [ ] Add brush/erase mask editor, invert, grow/shrink, blur, and “change only this area.”
- [ ] Add outpaint presets for left/right/top/bottom and common aspect ratios.
- [ ] Add regional conditioning for subject, wardrobe, background, and lighting zones.
- [ ] Reject a completed output if its artifact/prompt ID does not match the current request.

### P2 — ComfyUI platform integration

- [ ] Subscribe to native execution events: start, cached, executing, executed, progress, success, error, and interrupted.
- [ ] Surface node-level failure and progress while keeping the novice stage labels.
- [ ] Import workflow metadata from PNG/WebP outputs and offer **Reopen exact workflow**.
- [ ] Browse official workflow templates and subgraph blueprints as read-only candidates.
- [ ] Validate, pin, checksum, and register an approved template before execution.
- [ ] Add workflow rollback and compatibility migration tests.
- [ ] Keep non-subgraph fallbacks until upstream subgraph regressions are resolved and verified.

### P2 — evaluation and self-diagnosis

- [x] Add a reproducible live prompt-fidelity harness and JSON evidence manifest.
- [x] Complete the first live image test and record a 77/100 baseline.
- [ ] Add a fixed benchmark suite for portrait, full-body pose, hands, two subjects, text rendering, inpaint, identity, lighting, and upscale.
- [ ] Add image-dimension, blank/duplicate, checksum, and metadata checks automatically.
- [ ] Add optional local vision scoring for prompt adherence, anatomy, identity, and artifacts.
- [ ] Require 90/100 overall, no lost outputs, and visible revision change before a workflow becomes default.
- [ ] Run 20-job durability acceptance after each workflow-family upgrade.

## Recommended execution order

1. Finish P0 preflight and workflow compatibility reporting.
2. Productize installed FaceID/IP-Adapter with a rollback graph.
3. Productize prepared-map OpenPose ControlNet.
4. Seek explicit approval for an OpenPose preprocessor after compatibility/license review.
5. Add masked inpaint/outpaint and regional controls.
6. Move progress from polling to native server events.
7. Add official template/subgraph import, pinning, and rollback.
8. Run the full benchmark and 20-job durability gates.

## Change-control note

No content-related system instruction, classifier, routing rule, retry instruction, or model-behavior directive was changed in this batch. Any such proposed text must be shown verbatim and receive explicit owner approval before editing or deployment.
