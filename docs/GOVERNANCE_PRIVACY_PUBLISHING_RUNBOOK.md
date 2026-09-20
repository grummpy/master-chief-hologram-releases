# Governance, Privacy, and Publishing Operator Runbook

Applies to Master Chief Hologram v1.42.0. This is operational issue-spotting, not legal advice, license clearance, or a declaration of compliance.

## Before entering private information

1. Confirm the route badge. `LOCAL` means the selected local Ollama runtime. A private-LAN Ollama or ComfyUI host is still another machine managed by the operator.
2. For a cloud route, read the one-time destination confirmation. Only the prompt, chosen conversation context, and explicitly selected attachment context should be sent.
3. Verify the current provider account terms, retention controls, region, subprocessors, and organizational authorization before sending sensitive, confidential, regulated, government, or third-party data.
4. Use Tool access to enable only the capabilities needed for the task. Disable them when the task is complete.

## What Clear does

- **Clear** removes saved conversations, recoverable conversation trash, temporary retrieval data, and browser-local conversation state. It preserves generated media, Projects, and credentials.
- **Clear All** also removes generated media, local media-job history, Reference Studio projects, and active creative queues. It preserves deliberate Projects and credentials.
- Clearing the Mac cannot prove deletion from a cloud provider, public search engine, email recipient, exported copy, backup, or private Windows worker that is offline. Review those systems separately.

## Before publishing or sharing

Open **Systems → Privacy and publishing review** and complete the artifact preflight:

1. Name the accountable human owner and exact artifact/version.
2. Review provenance: source files, citations, provider/model, workflow, transformations, hashes, and parent revision.
3. Review ownership, licenses, trademark, publicity, distribution rights, and any model or custom-node restrictions.
4. Review consent or authorization for identifiable people, likenesses, voices, confidential inputs, and reference assets.
5. Review personal, sensitive, confidential, regulated, and government data.
6. Have a qualified human review factual claims, calculations, citations, and material omissions.
7. Record the decision on AI-assistance, sponsorship, and synthetic-media disclosure for the target audience and channel.
8. Record final human approval. A completed checklist is not automatic legal clearance.

## Model-output boundaries

- Model output is generated assistance, not a source-of-truth record or professional determination.
- Preserve user text and the exact provider route; do not silently rewrite a prompt or claim that a provider executed an unavailable capability.
- Keep factual claims tied to inspectable sources. Treat unsupported certainty, predictions, identity assertions, and sensitive inferences as review failures.
- Generated artifacts remain drafts until opened and reviewed by the operator. Hashes establish file identity, not factual accuracy or ownership.

## Credential and incident response

1. Do not paste a token into a prompt, screenshot, diagnostic report, source file, or issue.
2. Connector setup stores supported secrets with macOS encrypted storage. Environment fallback is intended only when secure storage is unavailable.
3. If a credential may have leaked, revoke it at the provider first, replace it in Connector Setup, then inspect redacted diagnostics and provider access logs.
4. Report application vulnerabilities through the private path in `SECURITY.md`; do not post private prompts, documents, LAN addresses, or exploit details publicly.

## Escalation evidence

For counsel, privacy, security, records, or publishing review, preserve the artifact hash and version, provenance metadata, intended audience/channel, source list, route disclosure, applicable provider/model/node licenses, the completed preflight, and the reviewer/decision date. Do not include raw credentials or unrelated private prompts.
