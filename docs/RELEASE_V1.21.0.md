# Master Chief v1.21.0 — UltraSharp and External SDXL VAE

## Mission

Turn the newly installed Windows models into explicit, recoverable Master Chief workflows rather than merely listing their filenames.

## Delivered

- Live `vae` and `upscale_models` discovery from ComfyUI.
- **VAE selector:** checkpoint default or installed `sdxl_vae.safetensors`.
- Dedicated API-format external-VAE graphs for fresh image, revision, and structural rebuild jobs.
- **UltraSharp 4×:** a separate artifact action using `4x-UltraSharp.pth`.
- **Lanczos 2× retained:** deterministic, model-free rollback remains beside UltraSharp.
- Exact model-name checks before queue submission.
- Transient history-poll recovery during bounded AMD model-load stalls.

## Installed model evidence

| Asset | Destination | SHA-256 |
| --- | --- | --- |
| Juggernaut XL v9 | `models/checkpoints/Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors` | `c9e3e68f89b8e38689e1097d4be4573cf308de4e3fd044c64ca697bdb4aa8bca` |
| SDXL VAE | `models/vae/sdxl_vae.safetensors` | `63aeecb90ff7bc1c115395962d3e803571385b61938377bc7089b36e81e92e2e` |
| 4x UltraSharp | `models/upscale_models/4x-UltraSharp.pth` | `a5812231fc936b42af08a5edba784195495d303d5b3248c24489ef0c4021fe01` |

## Live acceptance evidence

- Worker `/object_info` confirmed `VAELoader`, `UpscaleModelLoader`, and `ImageUpscaleWithModel` with the exact installed filenames.
- Juggernaut plus the external SDXL VAE completed a fresh image job.
- UltraSharp consumed that returned image and completed a distinct 4× artifact.
- Input SHA-256: `410cd34a72f774a53c3ae743551ebef6672b455a8e02ef1dd32c3d7b18a85294`.
- Output SHA-256: `340228085eefc6bbaf98c00e8391c6598614a616b1a71dbcba523c11bb2b2a2b`.
- The first large cold-start fixture saturated the Windows host. Recovery testing led to bounded transient polling and a successful reduced fixture after restart. Normal jobs retain cancel, timeout, gaming handoff, and Lanczos rollback paths.

## PAPM final gate

| Area | Weight | Score |
| --- | ---: | ---: |
| Workflow correctness and model binding | 25 | 25 |
| Operator control and rollback | 20 | 19 |
| Live evidence and provenance | 20 | 20 |
| Failure recovery and resource behavior | 20 | 18 |
| Automated release verification | 15 | 15 |
| **Total** | **100** | **97 — PASS** |

## Rollback

- Choose **Checkpoint default** to bypass the external VAE.
- Use **Upscale 2×** for deterministic Lanczos instead of UltraSharp.
- The prior installed v1.20.0 application bundle is preserved before v1.21.0 installation.

## Next standby

1. Add output-dimension prediction and a high-resolution resource warning before 4× upscale.
2. Record peak VRAM, elapsed time, and output dimensions in artifact metadata.
3. Add a tiled high-resolution upscale profile if larger real-world inputs exceed the current stable envelope.
