# Creative Agent Mission v1

Mission run: `MC-CREATIVE-AGENT-20260919-02`  
Context packet: `MC-CAM-v1`  
Status: foundation implemented; live GPU acceptance blocked by Windows inventory

## Mission and acceptance

One prompt surface routes private image/video work to a local Windows ComfyUI
worker and bounded tool work to an agent runner. Success means the destination
is visible, prompts cannot select arbitrary URLs or workflows, protected actions
require main-process approval, outputs are hashed, failures are explicit, and a
worker outage never triggers a silent cloud fallback.

## Use cases

1. `/image <prompt>` queues an approved image graph, saves the result locally,
   and displays its SHA-256.
2. `/video <prompt>` does the same for an approved video graph.
3. A typed agent plan runs at most eight allowlisted steps with both agent-level
   and underlying tool approval.
4. Missing worker, workflow, model, approval, or artifact is reported without
   changing providers.

## Architecture diagram (Archify-equivalent)

```text
Renderer / one prompt
        |
        v IPC (typed payload)
Electron main process ---- approvals/audit ---- local app data
        |
        +-- connector registry
        |       |
        |       +-- ComfyUI adapter -- private LAN --> Windows GPU
        |                                      |       approved workflow
        |                                      +-----> image/video artifact
        |
        +-- bounded agent runner --> allowlisted tool adapter(s)
                              max 8 steps / 2 minutes / no shell or arbitrary URL
```

## Source-of-truth and interfaces

- `connector-registry.js`: connector identities and capabilities.
- `comfyui-client.js`: private URL validation, queue/poll/download, hashing.
- `workflows/*-api.json`: reviewed execution graphs; absent until exported from
  the actual worker so no model or node is guessed.
- `agent-runner.js`: step/time/tool limits; it never interprets shell text.
- Electron main process: sole credential, network, filesystem, and approval
  authority. The renderer has no Node access.

## PAPM orchestration record

Primary route: Context Manager, PAPM, Systems Architect, Jarvis, Prompt
Engineering, Sergeant Major Security, Chief Image Production, Colonel
Videographer, Captain Motion Production, Chief UX, DevSecOps Officer, Test
Pilot, Lieutenant Quality, Chief Operations, Staff Judge Advocate.

Backup hits added: Warrant Officer Vocals (ElevenLabs contract and voice rights),
AI Governance (agent authority/audit), Quartermaster (model license and storage
inventory). Rejected: game-production and satire lanes because they do not alter
this increment.

Archify was not installed in the local skill stack. The component and state
diagram above satisfies the blueprint evidence need without claiming that skill
ran. MapReduce is not applicable because fewer than ten source artifacts were
reviewed.

## Foundation gate

Score: **88/100 — PASS FOR FOUNDATION IMPLEMENTATION**. Strengths are bounded
interfaces, private routing, explicit failure states, test seams, and rollback.
The missing Windows hostname/IP/GPU/VRAM/storage prevents live model selection
and GPU acceptance.

## Installation and live acceptance

On the Windows GPU host, copy and run `scripts/setup-comfyui-windows.ps1`. It
installs the official framework but deliberately downloads no model weights.
After inventory and license review, export one known-good API workflow to
`workflows/image-api.json` and one to `workflows/video-api.json`. Configure:

```dotenv
COMFYUI_BASE_URL=http://PRIVATE-WINDOWS-IP:8188
```

Restrict Windows Firewall port 8188 to the controller IP. Then enable **Generate
local image or video** in Tool access and run a non-sensitive fixture prompt.

## Research decisions

- ComfyUI was selected because its official project provides local Windows
  support, reusable workflows, asynchronous queueing, VRAM management, and API
  endpoints.
- Native `/prompt`, `/history/{id}`, and `/view` compatibility is implemented
  first. Comfy API v2 is a future upgrade because its durable, poll-first jobs
  and content-addressed assets are valuable after the basic worker is proven.
- LTX and Wan remain candidates, not installed defaults. Their practical model
  choice depends on the unknown GPU/VRAM and license review.

## Boundaries

Owner-controlled local generation may support lawful adult fictional or
consenting-adult creative work. The product does not support minors or
age-ambiguous sexual material, non-consensual content, or unauthorized sexual
deepfakes. Cloud providers always retain their own terms and controls.

## Standby backlog

1. Capture Windows GPU inventory and execute a real image/video fixture.
2. Add cancellable job state and progress events.
3. Adopt Comfy API v2 proxy after compatibility validation.
4. Add ElevenLabs TTS with explicit cloud consent and character-cost metadata.
5. Add model-generated JSON plans only after schema-conformance and adversarial
   prompt-injection tests pass.
