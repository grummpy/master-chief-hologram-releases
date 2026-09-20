# Contributing

1. Create a focused branch from `main`.
2. Preserve local-first routing, explicit cloud selection, credential redaction, and main-process approval gates.
3. Add deterministic tests for every behavior change.
4. Run `npm test`, `npm run test:p0`, `npm run test:p2`, `npm run test:assets`, `npm run test:visual`, and `npm audit --omit=dev`.
5. Do not add content filters, prompt rewriting, hidden negatives, or provider substitutions without the owner's exact prior approval.
6. Include rollback instructions for state migrations or runtime changes.

Extension recipes must use SDK `1.0`, request only supported declarative capabilities, and remain review-required until their license, provenance, maintenance, and behavior are verified.
