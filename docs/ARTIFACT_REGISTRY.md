# Local Artifact Registry

Version 1.0 · 2026-09-13 · Archivist / Signals Officer / Training Officer

## Repository tree

The Desktop repository is the durable local root: `/Users/daddy/Desktop/master-chief-hologram`.

| Root | Content | Link syntax in the app | Retention |
|---|---|---|---|
| `docs/` | Plans, runbooks, status, learning artifacts | `[label](artifact:docs/file.md)` | Git tracked. |
| `artifacts/` | Generated deliverables requiring durable local review | `[label](artifact:artifacts/file.ext)` | Git track only non-sensitive, reviewable artifacts. |
| `exports/` | User-requested generated exports | `[label](artifact:exports/file.ext)` | Review before tracking; delete when no longer needed. |

## Required record

Every durable artifact records title, version/date, owner, source task or requirement, validation performed, and sensitive-data classification. Never place credentials, API responses containing secrets, raw private speech, or unreviewed sensitive prompts in the registry.

## Lifecycle

1. Create an artifact only under an approved root.
2. Add a relative `artifact:` link from the producing response or a catalog document.
3. Validate that the link resolves locally and the file is reviewable.
4. Retain only the approved version; record replacement or removal in Git history for tracked files.
5. Remove generated private exports from the local root when they are no longer needed.

The app rejects traversal and links outside these approved roots. Existing repository artifacts are opened through its IPC boundary; the renderer never receives arbitrary filesystem paths.
