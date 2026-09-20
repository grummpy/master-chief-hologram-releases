# Jarvis code audit — v1.46.0

Assessed 2026-09-20 against the installed v1.45.0 baseline and the `read ETIMEDOUT` revision failure `7e956011`.

## Outcome

The observed revision was accepted by ComfyUI and advanced to the transfer stage before the Mac-side socket read timed out. Subsequent jobs succeeded, proving the checkpoint and workflow were healthy. The original ComfyUI history entry has since expired, so that specific output can no longer be resumed from Windows; **Retry as new** is the correct remaining action for it.

The defect class is fixed for future jobs:

- Transient artifact reads retry three times with bounded exponential backoff.
- A transfer retry reads the already-generated artifact and never requeues inference.
- **Resume** reconnects to the original durable ComfyUI prompt ID.
- **Retry as new** creates a lineage-linked child request and deliberately runs new inference.
- Stale prompt IDs and unchanged revisions remain rejected.

## Audit and iteration evidence

- Full Node suite: 213 tests passed, 0 failed after the final patch.
- Focused timeout/operator tests: passed.
- P0 deterministic evaluation: 100/100 across 75 cases.
- P2 weighted capability audit: 90.5/100; remaining gaps are recorded in `CAPABILITY_GAP_AUDIT.md`.
- Dependency production audit: 0 known vulnerabilities.
- Asset and visual regression gates: passed.
- JavaScript syntax checks: passed.
- Git whitespace check: passed.

## Findings closed in this iteration

1. **High — incorrect recovery semantics:** Resume previously submitted a second generation. It now reconnects to the accepted prompt.
2. **High — transfer timeout lost a completed result:** transient LAN reads now retry without inference duplication.
3. **Medium — silent Reference Studio failures:** comparison, source, and variant preview errors now remain visible with bounded details; state-load failures are displayed and rethrown.
4. **Medium — repair-method gap:** Jarvis now requires reproduction, localization, regression tests, minimal patches, failure attribution, bounded iteration, and evidence bundles.
5. **Medium — research provenance:** ten upstream repositories, observed popularity signals, and adopted patterns are recorded without vendoring code.

## Residual work

- The P2 audit identifies broader product investments—not regressions introduced by this patch—including Electron journey coverage, office-format live editing, AMD video acceptance, accessibility journeys, and module decomposition.
- Apple Developer ID signing/notarization remains externally blocked until the owner supplies an enrolled signing identity.
- The main and renderer files remain large. Splitting them safely is a staged refactor, not an appropriate timeout hotfix.

No content, moderation, legal, publishing, or safety control was added or changed.
