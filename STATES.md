# Master Chief Hologram — Reaction States

## Day / Night modes
- **Night**: deep cyan hologram on black (primary)
- **Day**: golden-cyan bright holographic projection

## Full state set (wired in `index-with-states.html`)

| State | Night file | Day file | Auto trigger |
|-------|------------|----------|--------------|
| idle | night_idle.jpg | day_idle.jpg | default |
| wave | night_wave.jpg | day_wave.jpg | greeting |
| salute | night_salute.jpg | — | greeting |
| listening | night_listening.jpg | day_ready.jpg | user typing |
| thinking | night_thinking.jpg | day_thinking.jpg | after send |
| loading | night_loading.jpg | — | while waiting |
| coding | night_coding.jpg | — | Codex model |
| speaking | night_speaking.jpg | day_success.jpg | reply arrives |
| success | night_success.jpg | day_success.jpg | after reply |
| happy | night_happy.jpg | day_success.jpg | celebration |
| confused | night_confused.jpg | — | error recovery |
| alert | night_alert.jpg | — | hard error |

## Assets location
```
assets/states/night/*.jpg
assets/states/day/*.jpg
```

Download the full pack from Google Drive:
https://drive.google.com/drive/folders/1PtTkpeiAhop0MU-6hWZy5O3GmW8QkQG3

Place the `states/` folder under `assets/` then use `index-with-states.html` (or merge the setState() logic into your current index).
