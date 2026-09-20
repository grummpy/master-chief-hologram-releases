# Master Chief Hologram v1.17.0 — Private Search Infrastructure

## Outcome

Master Chief now has a local SearXNG metasearch entry point at `http://127.0.0.1:8888`. The service is isolated to this Mac, runs in Docker through Colima, and starts automatically with the signed-in user session.

## Research route

1. The approved `research.public_web` tool sends the query to the local SearXNG API.
2. SearXNG gathers and returns source links from its enabled search engines.
3. Master Chief validates HTTP(S) result URLs, strips markup, removes duplicates, and returns at most twelve sources.
4. If local SearXNG is unavailable, the prior DuckDuckGo/Wikipedia no-key route remains available as a bounded fallback.

## Privacy boundary

The SearXNG application and its request log stay on this Mac, and its port is not exposed to the LAN. A search is not offline: enabled public engines still receive the query from the local SearXNG service. Searches continue to require the existing research-tool approval.

## Runtime operations

```sh
cd "$HOME/Desktop/master-chief-hologram/infrastructure/searxng"
docker compose ps
docker compose logs --tail=100
docker compose restart
```

The private secret is held only in the ignored `infrastructure/searxng/.env` file and is not committed.

## Verification gates

- Localhost JSON search smoke test
- Loopback-only Docker port inspection
- Container restart-count inspection
- Unit, asset, visual, and package inspection gates
