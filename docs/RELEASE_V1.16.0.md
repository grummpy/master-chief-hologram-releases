# Master Chief Hologram v1.16.0 — Atomic Multi-file Editing

## Mission increment

Move local Ollama coding beyond isolated replacements without exposing arbitrary shell access or unrestricted filesystem writes.

## Editing contract

1. Inspect project files with the existing bounded read tools.
2. Preview one to ten exact replacements in different files as one combined receipt.
3. Verify every current file hash before writing any file.
4. Apply the complete set with atomic per-file writes; restore already-written files if a later write fails.
5. Return one durable rollback receipt for the entire set.
6. Roll back only when every file still matches its applied hash, preserving all newer work.

## Boundaries

- Master Chief source repository only.
- At most ten files, one exact replacement per file, 20,000 characters per replacement, and 512 KB per text file.
- No arbitrary command, executable, URL, binary edit, deletion, rename, or path escape.
- Tool Access approvals remain separate for preview, apply, and rollback.

## Evidence and quality gates

Automated tests cover combined preview, no-write preview behavior, successful multi-file apply, whole-set rollback, stale-file rejection before writes, path constraints, and agent tool exposure.

| Gate | Score | Decision basis |
|---|---:|---|
| Foundation plan | 91/100 | Transaction boundary, input limits, failure recovery, receipts, and approval points are explicit. |
| Final product | 93/100 | Deterministic multi-file success and stale-state rejection pass; arbitrary refactoring and general command execution remain outside scope. |

Decision: release the bounded multi-file editing increment without claiming unrestricted coding-agent parity.
