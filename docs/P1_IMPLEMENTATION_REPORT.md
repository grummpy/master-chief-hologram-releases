# P1 Runtime, Agent, and Retrieval Upgrade

Implemented P1 from the local-AI action report as version 1.44.0.

## Runtime and models

- Gaming, balanced, and AI-production profiles enforce host RAM, VRAM, CPU, queue, thermal, and heavy-workload concurrency budgets.
- Runtime leases record load/unload time, first-token latency, throughput, prompt/eval counts, and peak memory evidence.
- Circuit breakers use bounded exponential backoff; last-known-good runtime/model/workflow combinations support rollback.
- Model cards record runtime, repository, revision/digest, quantization, context, capabilities, benchmark, and host fit.
- Acquisition jobs reserve disk space, resume by byte count, verify checksums, and quarantine mismatches.
- Lifecycle states are downloading, installed, validated, promoted, deprecated, and quarantined.
- llama-swap, llama.cpp, vLLM, and Exo remain evidence-gated experiments; they are not promoted without compatible hardware benchmarks.

## Agent execution and tools

- Durable workflow templates cover research, software change, data, Office artifacts, media, and diagnosis.
- Graph state is separate from conversation state and recovers interrupted runs.
- Every completed step records input/output hashes and evidence.
- Steering supports assumption correction, evidence addition, model change, skip, branch, retry, pause, resume, cancel, and stop-after-artifact boundaries.
- Existing MCP permissions, tool schemas, project diff preview/apply/test/rollback, result offloading, and Job Center receipts remain integrated.
- Arbitrary generated code does not execute inside the Electron renderer or main process.

## Retrieval and portability

- Source records preserve file hash, parser/version, representation, extraction time, and page/slide/sheet/cell/line/chunk locators.
- Citation cards target exact locators.
- Attachment facts can be checked against promoted project memory for conflicts.
- Oversized tool results are summarized inline and identified for artifact offloading.
- Credential-free project bundles cover projects, conversations, artifacts, graph state, and provenance.
- Existing local lexical/feature-vector hybrid retrieval remains the default; embedding and reranker routes stay independent capability classes.

## Publication boundary

The public repository receives source, documentation, tests, and release metadata only. It must not receive `.env`, credentials, local conversations, generated private media, runtime state, model files, user documents, or Desktop rollback bundles.
