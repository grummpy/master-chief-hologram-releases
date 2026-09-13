# Asset Intake and Provenance Schema

Version 1.0 · 2026-09-13 · G0 graphics foundation

Create one record per proposed runtime asset before it enters `assets/`.

| Field | Required value |
|---|---|
| Asset ID / revision | Stable name and revision number. |
| Intended state/use | Launcher, idle, listening, thinking, success, attention, or fallback. |
| Source hash | SHA-256 of the accepted source/export. |
| Creator / tool | Human creator or generation tool and version. |
| Prompt or brief | Non-sensitive creative brief/version; never credentials or private source images. |
| Rights basis | Original work, approved commission, or documented license. |
| Exclusion review | Confirmation that prohibited franchise identifiers and third-party material are absent. |
| Runtime export | Path, dimensions, format, alpha behavior, and package contribution. |
| Accessibility | Text status, non-color cue, contrast/motion review. |
| Reviewer / date | Owner or delegated reviewer and review date. |
| Fallback / rollback | Prior approved asset and behavior if new media fails. |

An asset is rejected when its rights basis, source hash, state semantics, fallback, or reviewer is missing. A 3D asset additionally needs source `.blend`/equivalent, mesh/material/texture provenance, GLB export record, performance measurement, and a 2D fallback before runtime consideration.
