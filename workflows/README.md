# Approved ComfyUI workflows

Export workflows from ComfyUI with **Export (API)** and save them here as
`image-api.json` and `video-api.json`. The connector replaces only these
bounded string tokens:

- `{{PROMPT}}`
- `{{NEGATIVE_PROMPT}}`
- `{{SEED}}`
- `{{SOURCE_IMAGE}}`
- `{{DENOISE}}`
- `{{SCALE_BY}}`

`image-upscale-api.json` is a built-in, model-free Lanczos workflow using the
live-verified core `ImageScaleBy` node. The app bounds scale requests to 1×–4×
and defaults the operator button to 2×.

Workflow files are code-like execution graphs. Review custom nodes and model
licenses before approving them. Do not place model weights in this repository.
