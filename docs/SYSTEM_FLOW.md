# Master Chief Hologram system flow and UML

Version: 1.0.3

Date: 2026-09-12

## User and system flow

```mermaid
flowchart LR
  A[Double-click Master Chief] --> B{Already running?}
  B -- Yes --> C[Focus hologram]
  B -- No --> D[Start Electron]
  D --> E[Check providers]
  C --> F[Enter prompt]
  E --> F
  F --> G{Selected route}
  G -->|Codex Desktop| H[Authenticated Codex CLI]
  G -->|OpenAI API| I[OpenAI Responses API]
  G -->|Grok| J[xAI API]
  H --> K[Return answer]
  I --> K
  J --> K
  K --> L[Display answer and save local provider history]
  H -. failure .-> M[Plain-language error]
  I -. failure .-> M
  J -. failure .-> M
```

## Component boundary

```mermaid
classDiagram
  class Renderer {
    +showProviderHealth()
    +submitPrompt()
    +storeLocalHistory()
  }
  class PreloadBridge {
    +getProviderStatus()
    +chat(payload)
    +windowAction(action)
  }
  class MainProcess {
    +routeChat()
    +protectCredentials()
    +enforceSingleInstance()
  }
  class CodexCLI
  class OpenAIAPI
  class XAIAPI
  class GitHubAPI
  Renderer --> PreloadBridge
  PreloadBridge --> MainProcess
  MainProcess --> CodexCLI
  MainProcess --> OpenAIAPI
  MainProcess --> XAIAPI
  MainProcess --> GitHubAPI : status and repository identity only
```
