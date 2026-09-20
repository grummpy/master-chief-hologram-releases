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

Decision updated after staged validation: promoted `96be9a139d68c1d45ee9380e2aad2746ecf6bc48` with workflow templates 0.11.65 and embedded docs 0.5.12. The worker retained PyTorch 2.13.0 + ROCm 10.0, passed dependency validation, exposed Qwen-Image 2.1 core nodes, and passed the existing SDXL acceptance routes.

## Dynamic-pose finding

The worker has OpenPose ControlNet model files, executable ControlNet workflows, and a live DWPose/OpenPose preprocessor. Reference Studio reports this distinction from live `/object_info` evidence and provides an **Extract pose map** action that turns a selected reference photograph into a prepared body/hand/face map before OpenPose generation.

The `comfyui_controlnet_aux` checkout is current at `59b1fc411ede8623b2997855b8018f0b3b6cf49f`. It is enabled with pinned dependencies and the existing ONNX CPU provider; the CUDA-oriented `onnxruntime-gpu` package was deliberately excluded. A live semantic extraction produced a downloadable pose-map artifact with a recorded SHA-256 hash.

## Verification completed

1. Twenty consecutive image/revision jobs passed with no lost output; revision lineage changed visibly by hash.
2. FaceID Plus v2 returned a verified artifact.
3. Canny and InstantID returned verified artifacts.
4. Tile and OpenPose Control-LoRA returned verified artifacts.
5. DWPose extracted a prepared map through CPU ONNX and returned a verified artifact.
6. The worker manager now recognizes relative `main.py` command lines and verifies port 8188 is released during Stop, preventing duplicate-worker/database-lock starts.
