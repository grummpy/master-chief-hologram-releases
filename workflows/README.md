# Approved ComfyUI workflows

Export workflows from ComfyUI with **Export (API)** and save them here as
`image-api.json` and `video-api.json`. The connector replaces only these
bounded string tokens:

- `{{PROMPT}}`
- `{{NEGATIVE_PROMPT}}`
- `{{SEED}}`

Workflow files are code-like execution graphs. Review custom nodes and model
licenses before approving them. Do not place model weights in this repository.
