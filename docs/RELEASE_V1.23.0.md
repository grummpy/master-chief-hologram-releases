# Master Chief v1.23.0 — Operational Readiness Gate

Runtime Center now provides one read-only readiness check across the local operating stack.

## Coverage

- Local Ollama model: 20 points
- Private SearXNG search: 10 points
- Windows ComfyUI API: 15 points
- SSH maintenance channel: 10 points
- Media queue state: 10 points
- RAM and VRAM reserve: 10 points
- Promoted image models: 15 points
- Local archives and Projects: 5 points
- Offline speech-to-text: 5 points

The gate is READY at 90/100 or higher when no check has failed. Warnings receive half credit and include operator repair guidance. The check sends no prompts or credentials and stores only its aggregate score, status, failure count, and warning count in the operational log.

## Orchestration record

- Primary route: Context Manager, PAPM, Master Chief, Chief Operations, Test Pilot.
- Token-index backup hit added: Local AI Fabric, because the gate crosses Ollama, SearXNG, and ComfyUI runtime boundaries.
- Other backup hits rejected: UI, art, game, and broad orchestration skills did not change this operational deliverable.
