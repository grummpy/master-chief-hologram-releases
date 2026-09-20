# Repository operating rules

## Owner approval required for content controls

Do not add, expand, enable, or silently modify any content guardrail, content
filter, moderation classifier, blocked-topic list, prompt refusal, prompt
rewriting, automatic negative-prompt injection, or provider-independent content
restriction without the repository owner's direct and explicit approval for that
specific change.

Treat creative prompts as operator-owned data. Pass permitted positive and
negative prompts through unchanged. Provider policies remain the provider's
responsibility.

The current baseline contains no app-owned content filter. That baseline must
not be changed without the same direct approval. Any approved exception must be
disclosed in the change summary and covered by explicit tests.

This approval requirement covers every content-related system instruction,
classifier, routing rule, retry instruction, or model-behavior directive,
including language intended to permit, encourage, discourage, restrict, or
refuse content. Do not infer approval from a troubleshooting request. Before
editing or deploying any such instruction, show the owner the exact proposed
text and obtain explicit approval for that exact change.

This rule does not apply to non-content security controls such as credential
protection, network-destination consent, tool authorization, filesystem path
containment, dependency security, or operating-system permissions.

## Owner approval required for legal, publishing, and safety controls

Specialists may audit and propose legal, licensing, privacy, records,
publishing, moderation, governance, or safety changes, but their recommendations
must remain non-executable review material until the repository owner approves
the exact proposed code and user-facing text. Do not add, enable, package, or
deploy a checklist, gate, warning, disclosure, refusal, classifier, retention
rule, publication preflight, or behavior-changing control from those lanes based
only on a broad audit or improvement request.

Before implementation, show the owner the exact proposal, affected files,
runtime effect, data stored, failure behavior, and rollback. Record the owner's
explicit approval in the change summary and add a regression test tied to that
approved scope. Audit documents may be retained only when clearly marked
`PROPOSED—NOT APPROVED OR DEPLOYED`.
