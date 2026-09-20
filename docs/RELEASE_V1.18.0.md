# Master Chief Hologram v1.18.0 — ComfyUI Endpoint Recovery

## Mission

Make a changing Windows LAN address recoverable from the Master Chief interface without editing files, opening Terminal, or restarting the application.

## Operator flow

1. Open **Systems** or **Creative connectors**.
2. Select **ComfyUI private worker**.
3. Enter the private HTTP endpoint, such as `http://192.168.4.31:8188`.
4. Select **Save and verify**.
5. Master Chief validates the private-network boundary, checks the live ComfyUI API, saves the endpoint, switches the active client, and refreshes health.

Public HTTPS services, loopback confusion, malformed URLs, and unreachable workers are rejected by the existing ComfyUI client boundary. A failed verification does not replace the current working route.

## PAPM gates

Foundation Plan Gate: **91/100 — PASS**. The increment is bounded to the observed endpoint-drift failure, preserves the last working runtime on failure, reuses the existing private-network validation, and has an explicit live acceptance test.

Final Product Gate target: **90/100**. Required evidence is syntax validation, the full automated suite, asset and visual checks, a packaged-build inspection, a live save-and-verify against the Windows worker, and UI confirmation that ComfyUI exposes no credential field.

## Rollback

Restore the retained v1.17.0 application bundle. Connector settings are backward compatible; v1.17.0 continues reading the saved `comfyuiBaseUrl` value.

## Standby

1. Add a full Runtime Center with node identity, endpoint history, disk/VRAM, queue depth, and gaming handoff.
2. Add optional discovery for approved private subnets without broad network scanning.
3. Complete the checksum-verified Juggernaut installation and controlled comparison.
4. Add a monitored, resumable model-download manager with disk-space and checksum evidence.
