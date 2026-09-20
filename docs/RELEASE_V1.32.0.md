# Master Chief Hologram v1.32.0

## Delivered

- Updated Windows ComfyUI to upstream commit `96be9a139d68c1d45ee9380e2aad2746ecf6bc48`.
- Added Qwen-Image 2.1 engine-capability reporting without promoting an unverified model bundle.
- Enabled pinned, CPU-fallback DWPose/OpenPose preprocessing without installing the CUDA ONNX package into the AMD/ROCm runtime.
- Added a Reference Studio **Extract pose map** action and a versioned `posemap` media contract.
- Added durable job-ledger handling, preview/download lineage, and readiness reporting for extracted pose maps.
- Corrected Windows worker Stop/Restart detection for relative `main.py` command lines and verified port release to prevent duplicate workers.

## Live evidence

- 20/20 consecutive ComfyUI jobs passed; the final revision changed and retained lineage.
- FaceID Plus v2, Canny, InstantID, Tile, and OpenPose Control-LoRA each returned an artifact.
- DWPose produced `MasterChief-PoseMap_00001_.png` from a real reference photograph.
- Windows worker reports AMD Radeon RX 9060 XT, PyTorch 2.13.0 + ROCm 10.0, and a healthy private API.

## Boundaries

- Qwen-Image 2.1 model files are not installed or promoted yet.
- DWPose extraction uses CPU ONNX. This avoids an incompatible CUDA provider and leaves GPU capacity available for SDXL generation.
- Impact Subpack still reports its independent missing `ultralytics` dependency; no workflow in this release depends on it.
