# Voice verification

This project uses a deterministic fixture contract before a live microphone test.
The fixture at `tests/fixtures/voice/command-reference.fixture.json` represents
a normal Chromium `MediaRecorder` capture. It contains no audio, user speech,
credential, or network dependency. The contract verifies the filename, accepted
MIME type, minimum capture size, and expected transcript shape.

Run the contract checks with:

```sh
npm test
```

In the app, open the command palette with `⌘K` and select **Voice self-test**.
It checks the same fixture plus the local whisper.cpp/ffmpeg/model readiness.
It never requests microphone access, records audio, transcribes, or contacts a
provider. A passing self-test means the capture handoff contract is sound; it
does not claim a microphone permission or ASR provider has been exercised.

## Offline distribution setup

The packaged app contains runtime detection and a model manifest, but no native
whisper.cpp binary or model weights. This keeps the app bundle small and lets a
user choose an appropriate local model. Put compatible GGML models in the app's
Application Support `voice/models` folder; the first safe model filename is
selected automatically unless `WHISPER_CPP_MODEL` is set. The package never
downloads software or model files, and it exposes no credentials.

For a live release check, approve microphone transcription in Tool access, press
MIC, speak a short command, press STOP, and confirm the transcript appears in
the command input before transmitting. Record permission-denied, silence, and
local whisper.cpp outcomes separately in the release note. The application does
not automatically send microphone audio to a paid cloud transcription provider.
