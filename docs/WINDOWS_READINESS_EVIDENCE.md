# Windows Worker Readiness Evidence

Checked from the Mac controller on 2026-09-19 (America/New_York).

## Verified ready

- ComfyUI API: `http://192.168.4.31:8188/system_stats` returned successfully.
- ComfyUI: 0.36.0 on Windows.
- Runtime: Python 3.13.15 and PyTorch 2.13.0+rocm10.0.0.
- GPU: AMD Radeon RX 9060 XT, approximately 16 GB VRAM.
- Launch contract: `main.py --listen 0.0.0.0 --port 8188`.
- Upscale node: `ImageScaleBy` is installed. The live node definition supports nearest-exact, bilinear, area, bicubic, and Lanczos with a scale range of 0.01–8.0. The app contract deliberately limits user jobs to 1×–4× and defaults to 2× Lanczos.

## Not ready

- Remote SSH administration: TCP port 22 timed out from the Mac.
- Because the transport is unavailable, passwordless-key authentication and the Windows scheduled-task readiness script could not be verified remotely.

## Windows recovery command

Run the existing setup script once in an elevated PowerShell window, then rerun the readiness gate:

```powershell
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\setup-master-chief-ssh.ps1"
PowerShell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\test-master-chief-windows-readiness.ps1" -Gate All
```

After Windows reports success, verify from the Mac:

```bash
ssh -i /Users/daddy/.ssh/master-chief-windows_ed25519 decke@192.168.4.31 hostname
```
