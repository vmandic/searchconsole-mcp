# Search Console MCP

An MCP server that exposes **read-only** [Google Search Console](https://search.google.com/search-console) data to coding agents. Use it from Cursor, Claude Desktop, or any MCP client that speaks stdio or streamable HTTP.

The server wraps the Search Console API with a small, predictable tool surface: list properties, pull search analytics, inspect URLs, and list sitemaps. Nothing is written back to Google; the OAuth scope is `webmasters.readonly` only.

## Install and run

```bash
git clone https://github.com/vmandic/gsc-mcp.git
cd gsc-mcp
npm install
npm test
npm run build
```

Run locally:

```bash
node dist/server.js --help
npx gsc-mcp
```

After `npm link -g`, the `gsc-mcp` binary is on your PATH.

## Authentication

The server uses [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials). For a laptop setup:

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly
```

If you already use Google's Analytics MCP, you can request several scopes in one login:

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/webmasters.readonly
```

Alternatively, set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON that has Search Console access on the properties you care about.

## MCP client setup

**Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "gsc-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/gsc-mcp/dist/server.js"]
    }
  }
}
```

Replace the path with your checkout. Use `"command": "gsc-mcp"` if you installed the package globally.

## Tools

| Tool | What it does |
|------|----------------|
| `ping` | Liveness check (`pong`) |
| `gsc_list_sites` | Properties your account can access |
| `gsc_search_analytics` | Clicks, impressions, CTR, position (with dimensions and filters) |
| `gsc_inspect_url` | URL inspection (indexing, crawl, rich results) |
| `gsc_list_sitemaps` | Sitemaps submitted for a property |

Tool errors are returned as MCP text with `isError: true` and messages aimed at humans (auth hints, bad `site_url`, quota).

## CLI and HTTP mode

```
gsc-mcp [--transport stdio|http] [--host 127.0.0.1] [--port 3000] [--version] [--help]
```

| Variable | Purpose |
|----------|---------|
| `GSC_MCP_TRANSPORT` | `stdio` (default) or `http` |
| `GSC_MCP_HOST` | Bind address for `http` (default `127.0.0.1`) |
| `GSC_MCP_PORT` | Port when `http` (default `3000`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account key path |

HTTP mode serves MCP at `http://<host>:<port>/mcp` (streamable HTTP transport). **Default bind is loopback only.**

### HTTP security

HTTP mode uses your machine’s Google credentials. Anyone who can open a TCP connection to the bind address can call MCP tools as you (read-only GSC).

- Prefer **stdio** (default) for Cursor and local agents.
- Default **`--host 127.0.0.1`** so the server is not exposed on the LAN.
- Only use **`--host 0.0.0.0`** on networks you trust, behind a firewall, or with additional protection (VPN, reverse proxy auth).
- POST bodies are capped at 4 MB; concurrent HTTP sessions are capped at 32 per process.

## Development

```bash
npm run typecheck    # src only
npm test             # unit tests (mocked API)
npm run build        # dist/server.js
```

Optional live API check (needs real ADC):

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly
GSC_INTEGRATION=1 GSC_SITE_URL="https://your-site.example/" npm run test:integration
```

## License

MIT. See [LICENSE](LICENSE).
