# Master Chief Capability Roster

This roster maps every non-release area in the 2026-09-20 capability audit to a primary specialist and required supporting roles. Specialists are activated only when their lane changes the deliverable.

| Audit area | Primary specialist | Support and handoff |
|---|---|---|
| Reasoning and answer quality | Prompt Engineering | Local Model Operations selects and evaluates the actual checkpoint; Lieutenant Quality owns benchmark evidence; Captain Intelligence verifies sourced claims. |
| Context and durable memory | Context Manager | Archivist owns provenance and retention; Parse/Provenance RAG owns retrieval; Warrant Officer Data verifies lineage. |
| Agent planning and recovery | Master Chief + PAPM | Jarvis implements task graphs; Chief Operations owns checkpoint/resume and recovery; Test Pilot verifies interruption journeys. |
| Tools and connectors | Signals Officer | Jarvis implements MCP/API contracts; Sergeant Major Security reviews permissions; Training Officer owns setup guidance. |
| Files and artifact production | Productivity Artifact Engineer | PowerPoint SME, Warrant Officer Data, Documents, Spreadsheets, and Lieutenant Quality provide format-specific production and validation. |
| Research and evidence | Captain Intelligence | Research Ops, Public Affairs Journalist, and Archivist provide source discovery, synthesis, citation, and preservation. |
| Image, audio, and video | ComfyUI Command Stack | Workflow Engineer, Model Readiness, Runtime Operator, Chief Image Production, Captain Motion, Warrant Officer Sound, and Local Model Operations. |
| Reliability and self-repair | Chief Operations | Jarvis, Fleet Engineer, DevSecOps Officer, and Test Pilot own observability, capacity, rollback, and recovery exercises. |
| Ease of use and accessibility | Chief UX | Leonardo owns visual hierarchy; Sergeant Visual Standards and Test Pilot verify responsive, keyboard, contrast, and assistive-technology behavior. |

## New specialists added

- **Local Model Operations** — Hugging Face storage and inference routes; Ollama runtime operation; Qwen and Dolphin checkpoint selection; GGUF/quantization; licensing; RAM/VRAM fit; prompt templates; tool/vision capability; evaluation; unload and rollback.
- **Productivity Artifact Engineer** — verified Word, Excel, PowerPoint, PDF, Python, R, and SQL creation; artifact visibility; Open/Reveal/Save As/Project delivery; revision steering; format-specific quality and round-trip checks.

## Activation examples

- `@local-model-operations compare the installed Qwen and Dolphin models for agent tools`
- `@productivity-artifact-engineer make an Excel workbook from the attached statements`
- `@chief-ux audit the command buttons and narrow-window layout`
- `@signals-officer diagnose Git, MCP, or connector failures`

Release/signing work is intentionally excluded from this iteration at the user’s direction.
