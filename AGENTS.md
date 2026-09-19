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

The currently committed narrow boundary is the existing baseline, not standing
authorization to expand it. Any proposed change to that boundary requires the
same direct approval and must be disclosed in the change summary and tests.

This rule does not apply to non-content security controls such as credential
protection, network-destination consent, tool authorization, filesystem path
containment, dependency security, or operating-system permissions.
