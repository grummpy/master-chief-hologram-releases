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

For a live release check, approve microphone transcription in Tool access, press
MIC, speak a short command, press STOP, and confirm the transcript appears in
the command input before transmitting. Record permission-denied, silence, local
whisper.cpp, and cloud-fallback outcomes separately in the release note.
