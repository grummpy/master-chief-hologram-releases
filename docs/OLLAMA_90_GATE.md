# Ollama 90% End-to-End Gate

Version: 1.0.1  
Model evaluated: `dolphin3:8b`  
Runtime: Ollama 0.33.3 on the local Mac  
Date: 2026-09-19  
Target: 90/100

## Outcome

The corrected live synthetic gate scored **100/100 (PASS)**. The initial run scored 70/100. Review found two evaluator defects: correct analytics and missing-evidence responses were rejected by overly narrow text patterns. Those checks were corrected without changing their required outcomes. The genuine Python failure—returning `None` instead of rejecting invalid input—was corrected by strengthening the code contract and adding one automatic repair pass when required validation is absent.

| Area | Weight | Live result |
|---|---:|---:|
| Direct completion | 10 | 10 |
| Instruction and format adherence | 10 | 10 |
| Structured output | 12 | 12 |
| Data analytics reasoning | 14 | 14 |
| Python generation | 10 | 10 |
| R generation | 8 | 8 |
| Attachment grounding | 12 | 12 |
| Artifact specification | 12 | 12 |
| Evidence discipline | 6 | 6 |
| Privacy and locality | 6 | 6 |

## End-to-end artifact evidence

- Excel workbook generation completed, produced a valid ZIP/OpenXML workbook, and round-trip text extraction passed.
- PowerPoint generation completed, produced a valid ZIP/OpenXML presentation, and round-trip slide-text extraction passed.
- Python generation completed; `python3 -m py_compile` and live execution passed.
- R source generation completed with explicit `stop()` validation. Runtime execution remains unverified because R/Rscript is not installed on this Mac.
- Word generation was previously verified with a valid `.docx` container and page break.
- Unknown binary formats attach successfully as metadata-only evidence rather than being falsely described as parsed.

## Interface and routing

- The Ollama Command Center now exposes a **Run 90% check** button and shows PASS/HOLD plus failed categories.
- New deterministic routes: `/document`, `/spreadsheet`, `/presentation`, `/python`, `/r`, and `/sql`.
- Explicit natural-language artifact requests are detected automatically.
- Attach supports multiple files and drag/drop. Text, source, PDF, Office, OpenDocument, RTF, EPUB, CSV, Markdown, JSON, XML, YAML, and HTML receive local extraction when supported. Other formats retain name, type, size, and SHA-256 with a visible metadata-only label.

## Residual limits

- Passing this compact gate is evidence for the tested contracts, not proof that an 8B model is correct on every professional task.
- R execution requires an installed R runtime before it can be called end-to-end executable.
- Images, audio, video, CAD, Blender, and other unknown binaries can be attached, but the current text-only Ollama model receives metadata rather than their internal content.
- High-stakes analytical conclusions still require source review and human verification.

## Research basis

The implementation uses Ollama's documented local chat API, JSON-schema structured outputs, and tool-loop pattern. Artifact creation remains deterministic in the application instead of relying on the model to write binary Office containers.
