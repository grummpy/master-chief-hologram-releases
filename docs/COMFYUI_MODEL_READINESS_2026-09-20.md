# ComfyUI model readiness — 2026-09-20

This inventory separates live execution evidence from provenance and license review. The Windows worker is AMD ROCm and remained on the private LAN throughout testing.

## Promoted local workflows

### InstantID SDXL — experiment / personal non-commercial use

- Files: `ip-adapter.bin` (1,691,134,141 bytes, SHA-256 `02b3618e36d803784166660520098089a81388e61a93ef8002aa79a5b1c546e1`) and `instantid-controlnet-sdxl.safetensors` (2,502,139,136 bytes, SHA-256 `c8127be9f174101ebdafee9964d856b49b634435cf6daa396d3f593cf0bbbb05`).
- Source basis: InstantX InstantID model and cubiq native ComfyUI InstantID node.
- Runtime: ROCm with `InstantIDModelLoader`, `InstantIDFaceAnalysis`, and `ApplyInstantIDAdvanced`.
- Workflow: `sdxl-instantid-v1`; rollback: `sdxl-faceid-plus-v2`.
- Live evidence: prompt `8a265d30-404b-4a1e-ac5d-d3dd12fb53d4`; artifact SHA-256 `d9195b87e473e000c5b2b3dff815254d89327677389208122e4ab4a43e980bf4`.
- License note: code and model page identify Apache-2.0, while the upstream project warns that released checkpoints and InsightFace pretrained face models are for research/non-commercial use. Keep this route local and non-commercial unless separate rights are confirmed.
- Known limitation: upstream supports one dominant face; it is not a multi-person identity workflow.

### Canny SDXL ControlNet — adopted locally

- File: `sdxl-canny.safetensors` (5,004,167,864 bytes, SHA-256 `ea99040544a999f814fd854575a3aee069a005d026864c8d321b82576706a221`).
- Model-card basis: SDXL Canny ControlNet, OpenRAIL++.
- Runtime: core ComfyUI `Canny`, `ControlNetLoader`, and `ControlNetApplyAdvanced`; no custom preprocessor package required.
- Workflow: `sdxl-canny-control-v1`; rollback: `sdxl-revision-v1`.
- Live evidence: prompt `e64c5d7d-ef59-41cb-bd07-bb30e966f7fa`; artifact SHA-256 `4b1a3e521daf892c1cf6fcf298b3f7beda5e2b044e5c09f21b8e779a430eacde`.

### Remacri 4× — adopted as bounded 2× portrait upscale

- File: `4x_foolhardy_Remacri.pth` (67,025,055 bytes, SHA-256 `e1a73bd89c2da1ae494774746398689048b5a892bd9653e146713f9df8bca86a`).
- Runtime: `UpscaleModelLoader` plus pre-scaling; longest output edge capped at 2,048 pixels with RAM/VRAM reserve checks and post-job cache release.
- Workflow: `remacri-upscale-v1`; rollback: `lanczos-upscale-v1`.
- Live evidence: prompt `1e37535b-4db9-4843-9337-709f0e91b502`; 1,024×1,024 artifact SHA-256 `3c2dd7e692b7ebe4287a82a424dae6135df007ef9dac03a4ca4d32b91b5852ed`.
- License/source provenance still needs the exact download URL recorded before redistribution; local execution is verified.

## Installed but not promoted

- `sdxl-depth.safetensors`: model present, but no verified depth-map preprocessor is active.
- `sdxl-tile.safetensors`: model present; tile workflow and seam-quality evaluation are pending.
- `control-lora-openposeXL2-rank256.safetensors`: model present; the current full OpenPose model remains the known-good route.
- Pony Diffusion XL checkpoint: download was still in progress during inventory and therefore was not selected, tested, or promoted.
- `comfyui_controlnet_aux.disabled`: intentionally remains disabled; no package activation was performed in this batch.

## Recovery

Every new graph is registered with a checksum and rollback target. Generated fixtures are locally archived with prompt IDs and artifact hashes. Runtime cache release was verified after model-heavy tests.
