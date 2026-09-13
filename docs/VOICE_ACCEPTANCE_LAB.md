# Voice Acceptance Lab

Version 1.0 · 2026-09-13 · Training Officer / Test Pilot exercise · Status: ready for physical run

## Purpose

Produce redacted evidence that separates macOS permission, browser capture, transcription route, and input-box insertion. The deterministic **Voice self-test** remains a contract check only; it is never evidence of a live microphone result.

## Preconditions

- Launch the single Desktop bundle, [Master Chief Hologram.app](/Users/daddy/Desktop/Master%20Chief%20Hologram.app).
- Open **Systems** and record the displayed voice readiness label without recording paths, credentials, prompts, or speech.
- Use a non-sensitive test phrase: “Master Chief, check microphone input.”
- If the app shows **MIC SETTINGS**, select it, enable Master Chief Hologram in macOS Microphone privacy settings, return to the app, and press MIC again.

## Redacted acceptance matrix

| Case | Action | Expected UI result | Record | Recovery / escalation |
|---|---|---|---|---|
| Fixture | `⌘K` → Voice self-test | Pass/fail explains that no microphone or provider was used. | Build version and result. | A failure blocks live testing; inspect [VOICE_VERIFICATION.md](VOICE_VERIFICATION.md). |
| Not determined | Press MIC on a new privacy state. | macOS asks for access; allow starts listening. | Prompt shown and final state only. | If no prompt appears, reopen app and use MIC SETTINGS. |
| Denied | Deny the macOS request or disable access. | App shows recovery guidance and MIC SETTINGS; no recording begins. | “Denied recovery shown.” | Enable app in macOS Microphone settings, relaunch if macOS requires it. |
| No device | Disconnect/disable the selected input where practical, then press MIC. | Plain-language unavailable error; no crash. | Error category only. | Reconnect/select input and retry. |
| Silence | Start MIC, wait three seconds, press STOP. | No-speech/transcription outcome; no stale text inserted. | Route used and result. | Check local ASR readiness or cloud credentials; do not log secrets. |
| Normal speech | Start MIC, speak test phrase, press STOP. | Final transcript appears in the compose box and focus returns there. | Exact pass/fail, route (local/cloud), and elapsed seconds. | If capture succeeds but transcription fails, separate ASR route from permission evidence. |
| Stop / retry | Stop after one second, then run normal speech again. | UI returns to MIC between attempts; second attempt is independent. | Retry pass/fail. | If stuck in SAVING or LISTENING, capture redacted console-free UI state and file a defect. |
| Local ASR | Configure only a supported local whisper.cpp binary, model, and ffmpeg if available. | Systems shows local voice readiness; normal speech returns a local transcript. | “Local route” and model family, not path. | Missing dependency is setup work, not a microphone-permission failure. |
| Cloud fallback | With no local ASR and an already configured cloud key, run normal speech. | Transcription either returns text or names a bounded provider error. | “Cloud route” and result, never key/error body. | Keep provider completion out of this acceptance unless it is already configured. |

## Exit criteria

Pass when the normal-speech and retry cases insert text into the input box, the denied case provides recovery, and every attempted row identifies whether it was fixture, permission/capture, local ASR, or cloud fallback. Attach only the redacted table to the release record. A failed or unperformed physical row remains **unverified**.

## Escalation contract

Classify the defect before changing code: **TCC/privacy** when macOS reports denied; **browser capture** when permission is granted but `getUserMedia` fails; **ASR route** when captured audio does not transcribe; **compose insertion** when returned text is not placed in the input. This classification prevents a cloud or model change from masking a microphone failure.
