# Private SearXNG runtime

This Compose stack binds SearXNG only to `127.0.0.1:8888`. It is not reachable from the LAN. Colima supplies the local Docker runtime and starts at macOS login through Homebrew Services. The container restarts unless explicitly stopped.

Management:

```sh
cd infrastructure/searxng
docker compose up -d
docker compose ps
docker compose logs --tail=100 searxng
docker compose pull && docker compose up -d
docker compose down
```

The ignored `.env` contains the private instance secret. Search configuration is versioned in `settings.yml`; cache data is ignored under `data/`.
