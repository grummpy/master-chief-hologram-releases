# Master Chief v1.22.0 — GPU-Safe UltraSharp

UltraSharp now runs through a bounded profile instead of sending the source directly into a full 4× model pass.

## Safety envelope

- Normal target: 2× output.
- Hard output ceiling: 2048 pixels on the longest edge.
- Queue gate: no other running or pending ComfyUI job.
- Preflight reserve: at least 1.5 GB free system RAM and 4 GB free VRAM.
- Recovery: unload models and clear cache once, recheck, then stop without queueing if reserve is still insufficient.
- Cleanup: unload models and clear GPU cache after completion, cancellation, or failure.

The original deterministic Lanczos 2× option remains available as the lowest-load fallback. Every safe-upscale job records its input dimensions, pre-scale, predicted output dimensions, workflow version, and artifact lineage.
