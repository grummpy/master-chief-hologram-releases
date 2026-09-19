# Master Chief Hologram v1.8.0 — Audio Production Contracts

## Delivered

- Offline speech-to-text health includes microphone permission, whisper.cpp runtime, selected GGML model, and ffmpeg.
- Speech synthesis uses a provider-neutral contract. `macos-say` is the local default; ElevenLabs is optional and uses the same job schema.
- Transcription, narration, dialogue, effects, and mux are separate jobs so sources and stems remain reversible.
- Every job records cue ID, timing, provider, model, voice, parameters, inputs, parent lineage, errors, and status.
- Archived audio artifacts record role, MIME type, byte size, timestamp, and SHA-256 checksum.
- The Systems panel exposes both transcription and audio-production readiness.

## Archive layout

Audio lineage is stored under the app data directory at `audio/archive/<session>/<job>/`. Job metadata is stored separately in `audio/jobs.json` so final mux outputs never replace source stems.

## Provider boundary

Local narration/dialogue requires macOS `say` and ffmpeg. ElevenLabs remains optional and is not contacted unless explicitly selected with a configured key and voice ID.
