# Master Chief Hologram v1.6.0 — Media Reliability Evidence

Date: 2026-09-19

## Delivered

- Atomic, disk-backed media job ledger with request/session IDs, route, versioned workflow, checkpoint, complete generation parameters, references, timing, stages, errors, artifact hashes, and revision ancestry.
- Idempotent request IDs plus cancel, retry-as-new, duplicate-as-new, and interrupted-job resume operations.
- Main-process recovery marks work interrupted by an app/worker outage as recoverable instead of losing it.
- Queue → load → generate → save → transfer → archive stage events and progress UI.
- Exact positive/negative prompt recording with no silent creative rewriting.
- Live checkpoint catalog and operator controls for seed, sampler, scheduler, steps, CFG, dimensions, batch, and denoise.
- Versioned workflow registry for fresh image, image-to-image revision, structural rebuild, and upscale contracts.
- Stale-output rejection using the current ComfyUI prompt ID.
- Artifact preview, open, reveal, Save As, metadata, SHA-256, lineage, revision, and duplicate controls.

## Automated evidence

- Node test suite: 54/54 passed.
- Ledger acceptance: 20/20 consecutive simulated state-machine jobs persisted after reopen.
- Asset contract: passed.
- Visual contract: passed.
- Dependency production audit: zero known vulnerabilities at build time.
- macOS package inspection: passed for v1.6.0; personal build remains ad-hoc signed.

## Live Windows GPU evidence

Endpoint: private LAN ComfyUI at `192.168.4.31:8188`

- Worker: ComfyUI 0.36.0, PyTorch 2.13.0 ROCm, AMD Radeon RX 9060 XT.
- Checkpoint: `sd_xl_base_1.0.safetensors`.
- 20/20 sequential jobs queued, completed, downloaded, hashed, and recorded.
- Final job used the image-to-image revision contract.
- Revision output SHA-256 differed from its parent.
- Parent request and source-artifact lineage were present.
- Total live run: 50,697 ms.
- Outcome: PASS.

The live harness is reproducible with `npm run test:comfy-live`. It uses two-step 512×512 acceptance renders to test transport and reliability without representing them as quality benchmarks.

## Remaining external dependency

Juggernaut XL was not installed at release verification time. The live worker exposed only stock SDXL. The checkpoint selector will discover Juggernaut automatically after its separate checksum-verified Windows installation, but prompt-quality acceptance remains pending until that installation is complete.
