# Master Chief v1.20.0 — Controlled Windows Worker Operations

## Mission

Let the operator safely release the Windows GPU for gaming and recover the private AI worker without keeping PowerShell open or accepting arbitrary remote commands.

## Delivered

- **Restart worker:** fixed, allowlisted PowerShell action over the existing SSH key channel.
- **Stop for gaming:** refuses to run while ComfyUI has running or pending jobs, then verifies the worker API is down and no worker process ID remains.
- **Resume AI worker:** starts the scheduled worker and verifies API health.
- **Remote identity:** displays the bounded SSH user/host and scheduled-service evidence.
- **Endpoint history:** retains the five most recently verified private worker URLs.
- **Audit record:** stores timestamp, action, endpoint, outcome, and a bounded status label—never prompts, credentials, or raw command output.

## Authority and safety boundary

The renderer cannot supply commands, paths, users, or SSH options. It can request only `restart`, `gaming-stop`, or `gaming-resume`. The main process maps those requests to fixed actions in `manage-comfyui-worker.ps1`. Every action requires an operator confirmation, and restart/stop fail closed when queue work exists.

## Verification plan

- Unit tests for private-host enforcement, fixed SSH arguments, username rejection, and bounded PowerShell status parsing.
- Full regression, asset, visual, dependency, packaging, and installed-build gates.
- Live SSH status evidence.
- Live operator restart with post-action API and Runtime Center verification.
- Stop/resume drill with worker-process teardown and API recovery evidence.

The live restart gate identified two Windows-specific defects: a `SYSTEM` task could exit before AMD GPU initialization, and a directly scheduled batch process could receive a console termination event after remote control. The maintained worker script now runs a hidden VBS wrapper as the signed-in GPU user, preserving driver-session access and detaching the worker from the SSH/PowerShell lifecycle.

## PAPM score

| Area | Weight | Score |
| --- | ---: | ---: |
| Mission and operating scenarios | 15 | 15 |
| Authority and command containment | 25 | 25 |
| Recovery and failure handling | 20 | 19 |
| Evidence and auditability | 15 | 14 |
| Test and release rigor | 20 | 19 |
| Sustainment and rollback | 5 | 5 |
| **Foundation total** | **100** | **97 — PASS** |

## Rollback

The installed v1.19.0 application bundle is retained as a hidden Desktop backup before v1.20.0 is installed. The Windows worker task and script are unchanged by this release.

## Next standby

1. Model download manager with source, size, checksum, license, compatibility, progress, resume, and rollback evidence.
2. Disk-capacity and model-family compatibility views.
3. Workflow registry promotion and rollback controls.
4. Juggernaut transfer verification only when the operator explicitly resumes it.
