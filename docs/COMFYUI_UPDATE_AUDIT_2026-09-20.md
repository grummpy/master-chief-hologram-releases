# ComfyUI Update Audit — 2026-09-20

## Verified runtime

- Worker: `192.168.4.31:8188`
- ComfyUI: `3c80da7f87ee359b2d06f107cb3c0797079dfbbb`
- Python: 3.13.15
- PyTorch: 2.13.0 + ROCm 10.0
- GPU: AMD Radeon RX 9060 XT, approximately 16 GB VRAM
- Current image, identity, ControlNet, and upscale paths remain operational.

## Upstream delta reviewed

Upstream head was `96be9a139d68c1d45ee9380e2aad2746ecf6bc48`, four commits ahead of the worker:

1. Qwen-Image 2.1 core support.
2. Reduced WAN peak VRAM with Comfy Kitchen attention.
3. Embedded documentation 0.5.12.
4. Workflow templates 0.11.65.

Decision: defer the core update. It changes model internals and requirements but does not repair the current SDXL dynamic-pose gap. Preserve the verified ROCm/Juggernaut runtime until this update can be staged and rolled back independently.

## Dynamic-pose finding

The worker has OpenPose ControlNet model files and executable ControlNet workflows, but it does not expose a DWPose/OpenPose preprocessor node. A normal photograph is not a pose map. Reference Studio now reports this distinction from live `/object_info` evidence.

The disabled `comfyui_controlnet_aux` checkout is current at `59b1fc411ede8623b2997855b8018f0b3b6cf49f`. A dry-run dependency resolution would add `onnxruntime-gpu` plus 30 additional packages. Installing that unmodified into the working AMD/ROCm environment is deferred because the Windows GPU package targets a different provider path and could introduce a silent CPU fallback or dependency conflict.

## Next safe gate

1. Snapshot the working ComfyUI venv and custom-node manifest.
2. Stage the pose preprocessor in a disposable clone/venv.
3. Confirm an AMD-supported ONNX execution provider or explicitly accept measured CPU pose extraction.
4. Run `pip check`, import tests, `/object_info`, one semantic pose-map extraction, and one end-to-end OpenPose generation.
5. Promote only if the existing image, hybrid identity, revision, and upscale acceptance tests still pass.
