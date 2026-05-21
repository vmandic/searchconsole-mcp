# Search Console MCP

[![CI](https://github.com/vmandic/gsc-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/vmandic/gsc-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6366f1)](https://modelcontextprotocol.io)

**Read-only [Google Search Console](https://search.google.com/search-console) for AI coding agents.**  
Connect Cursor, Claude Desktop, or any MCP client to your GSC properties: search performance, URL inspection, and sitemaps, without leaving the editor.

- **Read-only by design** — OAuth scope `webmasters.readonly` only; no writes to Google
- **Stdio by default** — safe local use with Cursor and Claude
- **Five focused tools** — no GA4, no Indexing API, no admin clutter
- **Hardened HTTP mode** — optional streamable HTTP with loopback bind, body limits, and session caps

---

## Table of contents

- [Why use this](#why-use-this)
- [Features](#features)
- [Quick start](#quick-start)
  - [Agentic install prompt](#agentic-install-prompt)
  - [Manual setup](#manual-setup)
- [Requirements](#requirements)
- [Installation](#installation)
- [Google authentication](#google-authentication)
- [Connect your MCP client](#connect-your-mcp-client)
- [Tools reference](#tools-reference)
- [Example prompts for agents](#example-prompts-for-agents)
- [Security](#security)
- [Transports: stdio vs HTTP](#transports-stdio-vs-http)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

---

## Why use this

Search Console data helps agents answer real SEO questions: which queries drive traffic, whether a URL is indexed, or what sitemaps are on file. This server exposes that data through the [Model Context Protocol](https://modelcontextprotocol.io) so tools like Cursor can call Google’s API on your behalf.

Use it when you want:

- Property lists and search analytics inside an agent session
- URL inspection results without opening the GSC UI
- A **small, auditable** surface (five tools) instead of a general Google analytics bundle

---

## Features

| Capability | MCP tool |
|------------|----------|
| List properties you can access | `gsc_list_sites` |
| Clicks, impressions, CTR, position (with dimensions) | `gsc_search_analytics` |
| Indexing / crawl / rich-result inspection for a URL | `gsc_inspect_url` |
| Sitemaps submitted for a property | `gsc_list_sitemaps` |
| MCP server liveness (local Node.js, not Google) | `gsc_mcp_server_ping` |

**Input validation** — Tool arguments are validated with Zod (dates, URLs, row limits, allowlisted dimensions).

**Clear errors** — Failures return MCP text with `isError: true` and actionable messages (auth, `site_url` format, quota).

---

## Quick start

### Agentic install prompt

Paste the block below into **Cursor, Claude Code, Copilot, or Codex** and ask it to run the setup. The agent should execute the steps on your machine and wire up your MCP client.

**Assumptions (confirm with you before changing anything):**

| Assumption | Why it matters |
|------------|----------------|
| **Node.js 18+** | Required to build and run `gsc-mcp` |
| **`gcloud` CLI** | Used for API enablement and [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials) (ADC) |
| **Google Cloud project** | Search Console API must be enabled on a GCP project ([not the same as a GSC property](#google-cloud-project-required)) |
| **Google account** | Must already have access to the Search Console properties you care about |
| **User ADC (default)** | Setup uses `gcloud auth application-default login` with `webmasters.readonly`, not a checked-in service account key |
| **Stdio transport** | MCP config must **not** pass `--transport http` unless you explicitly want HTTP mode |
| **Absolute paths** | MCP config needs the real path to `dist/server.js` after `npm run build` |
| **Which MCP client** | Config file shape differs (Cursor/Claude Code: `mcpServers`; VS Code Copilot: `servers`; Codex: `config.toml`) |

The agent should ask for: install directory, GCP project ID, and which client you use.

```
Set up the gsc-mcp MCP server from https://github.com/vmandic/gsc-mcp on this machine end-to-end.

Before you change anything, confirm with me:
1) Which MCP client I use (Cursor, Claude Code, GitHub Copilot in VS Code, OpenAI Codex, or Claude Desktop).
2) A Google Cloud project ID where we can enable the Search Console API (or use my current gcloud default project).
3) Where to clone the repo (default: ~/source/vmandic/gsc-mcp or a path I choose).

Then do the following, reporting each step:

A) Prerequisites
- Verify Node.js >= 18 and gcloud are installed.
- Do not commit or paste any secrets into the repo.

B) Clone, build, test
- git clone https://github.com/vmandic/gsc-mcp.git into the chosen directory.
- npm install && npm run build && npm test
- Confirm dist/server.js exists.

C) Google Cloud + auth (user ADC)
- gcloud services enable searchconsole.googleapis.com --project=PROJECT_ID
- gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly
  (If this opens a browser, tell me to complete sign-in.)
- gcloud auth application-default set-quota-project PROJECT_ID
- Remind me: I need Search Console property access on my Google account; the GCP project only enables the API.

D) MCP client config (stdio only — no --transport http)
- Add gsc-mcp using command "node" and args ["ABSOLUTE_PATH/dist/server.js"], or command "gsc-mcp" if we npm link -g.
- Use the correct config file for my client (see the repo README "Connect your MCP client"):
  - Claude Code: prefer `claude mcp add gsc-mcp --transport stdio -- node ABSOLUTE_PATH/dist/server.js` first if I use multiple clients.
  - Cursor: ~/.cursor/mcp.json → mcpServers
  - VS Code Copilot: .vscode/mcp.json or user MCP config → servers, type stdio
  - Codex: ~/.codex/config.toml → [mcp_servers.gsc-mcp] or `codex mcp add`
- Use absolute paths only.

E) Verify
- Tell me to restart the MCP client.
- After restart, call tool gsc_mcp_server_ping (local server only, not Google).
- Call gsc_list_sites and show whether properties were returned; if auth fails, point me to README troubleshooting.

When finished, summarize: clone path, GCP project ID, config file edited, and the exact JSON/TOML or CLI command used.
```

---

### Manual setup

Use this if you prefer to run commands yourself.

**1. Install and build** (from source):

```bash
git clone https://github.com/vmandic/gsc-mcp.git
cd gsc-mcp
npm install
npm run build
```

**2. Enable the API and authenticate** (one-time; requires a [Google Cloud project](#google-cloud-project-required)):

```bash
gcloud services enable searchconsole.googleapis.com --project=YOUR_PROJECT_ID
```

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly
```

```bash
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
```

Your Google user must have access to the Search Console properties you want. The GCP project does not replace that.

**3. Connect a client** — example for **Cursor** (`~/.cursor/mcp.json`). Using Claude Code, Copilot, or Codex too? See [Connect your MCP client](#connect-your-mcp-client) (set up **Claude Code first** if you use several).

```json
{
  "mcpServers": {
    "gsc-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/gsc-mcp/dist/server.js"],
      "env": {}
    }
  }
}
```

**4. Restart the client**, then ask: *“List my Search Console properties”* (tool `gsc_list_sites`).

Stdio is the default (no extra flags). Logs go to stderr; JSON-RPC uses stdin/stdout.

---

## Requirements

| Requirement | Notes |
|-------------|--------|
| **Node.js** | 18 or newer |
| **Google account** | With access to the Search Console properties you care about |
| **Google Cloud project** | Required to [enable the Search Console API](https://developers.google.com/webmaster-tools/v1/prereqs); used for API quota (not the same as a GSC property) |
| **Credentials** | [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials) (user login via `gcloud`) **or** a service account JSON via `GOOGLE_APPLICATION_CREDENTIALS` |
| **MCP client** | Cursor, Claude Desktop, or any client that supports stdio MCP (HTTP optional) |

Optional: [Google Cloud SDK](https://cloud.google.com/sdk) (`gcloud`) for the interactive ADC login flow.

---

## Installation

### Option A — Run from a clone (recommended for development)

```bash
git clone https://github.com/vmandic/gsc-mcp.git
cd gsc-mcp
npm install
npm test          # optional: unit tests
npm run build     # produces dist/server.js
```

Verify:

```bash
node dist/server.js --help
node dist/server.js --version
```

### Option B — Global CLI after build

```bash
npm link -g
gsc-mcp --help
```

Then point your MCP client at `gsc-mcp` instead of `node …/dist/server.js`.

### Option C — `npx` (when published to npm)

```bash
npx -y gsc-mcp
```

Until the package is on npm, use Option A or B from a local clone.

---

## Google authentication

The server never stores passwords. It uses **Application Default Credentials** (ADC): the same mechanism as `gcloud` and Google client libraries.

You need **two different things** from Google:

| What | Purpose |
|------|---------|
| **Search Console property access** | Your Google user (or service account) must be a user on the site in [Search Console](https://search.google.com/search-console) |
| **Google Cloud project** | Enables the Search Console API and attributes quota/billing for API calls |

Having a site in Search Console is **not** enough on its own. Google’s [API prerequisites](https://developers.google.com/webmaster-tools/v1/prereqs) require a Cloud project with the API turned on.

### Google Cloud project (required)

1. Create or pick a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the API (once per project):

```bash
gcloud services enable searchconsole.googleapis.com --project=YOUR_PROJECT_ID
```

Or: **APIs & Services → Library** → search **Google Search Console API** → **Enable**.

3. After ADC login, set the **quota project** if Google asks for one (common with user credentials):

```bash
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
```

`YOUR_PROJECT_ID` is the Cloud project ID (e.g. `my-seo-tools`), not a Search Console property URL.

**Service accounts** must be created inside this same Cloud project. The JSON key you download is tied to that project; you still add the service account email as a user on each GSC property.

This MCP server does not ask you for a project ID in config. `GoogleAuth` picks it up from ADC, `GOOGLE_CLOUD_PROJECT`, or `gcloud config set project`.

### Personal / laptop setup (most common)

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly
```

That scope is enough for this server. Your Google user must already have access to the relevant Search Console properties, and the Search Console API must be [enabled on a Cloud project](#google-cloud-project-required) (see above).

### Service account

Set a key file path:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

The service account must be added as a user on each GSC property (Settings → Users and permissions).

### Sharing ADC with Analytics MCP

If you use [Google’s Analytics MCP](https://github.com/googleanalytics/google-analytics-mcp) on the same machine, you can request multiple scopes in one login:

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/webmasters.readonly
```

This server only needs `webmasters.readonly`; extra scopes are optional for your workflow.

---

## Connect your MCP client

Every client runs the **same local Node.js MCP server** (`gsc-mcp`). That process talks to **Google Search Console** on your behalf. The client (Cursor, Claude Code, Copilot, Codex) only spawns the server and passes tool calls over stdio.

**Before you connect any client**

1. Run `npm run build` so `dist/server.js` exists.
2. Complete [Google authentication](#google-authentication) (ADC) once on the machine.
3. Use an **absolute path** to `dist/server.js` in config (or `gsc-mcp` after `npm link -g`).

**If you use more than one client**, set up **Claude Code first**. You will reuse the same binary and credentials; doing auth and paths once avoids confusion when you add Cursor, Copilot, or Codex.

| Client | Config location | Config key |
|--------|-----------------|------------|
| Claude Code | CLI, `~/.claude.json`, or project `.mcp.json` | `mcpServers` |
| Cursor | `~/.cursor/mcp.json` | `mcpServers` |
| GitHub Copilot (VS Code) | `.vscode/mcp.json` or user MCP config | `servers` |
| OpenAI Codex | `~/.codex/config.toml` | `[mcp_servers.<name>]` |
| Claude Desktop | OS-specific Claude config | `mcpServers` |

All examples below use **stdio** (default). Do not pass `--transport http` unless you intend [HTTP mode](#transports-stdio-vs-http).

---

### 1. Claude Code (set up first)

[Claude Code](https://code.claude.com/) is Anthropic’s terminal coding agent. Configure gsc-mcp here first if you plan to use multiple tools on one machine.

**Option A — CLI (quick)**

```bash
claude mcp add gsc-mcp --transport stdio -- \
  node /absolute/path/to/gsc-mcp/dist/server.js
```

Check: `claude mcp list` (or `/mcp` in the Claude Code session).

**Option B — Project file (team-friendly)**

Add `.mcp.json` at the project root:

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

User-wide servers can also live under `mcpServers` in `~/.claude.json` (see [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)).

---

### 2. Cursor

[Cursor](https://cursor.com/) runs its **own** MCP host inside the IDE (separate config from Claude Code). You do **not** need the Claude Code app for Cursor, but if you use both, complete [Claude Code](#1-claude-code-set-up-first) setup and ADC first.

Edit **`~/.cursor/mcp.json`** (or MCP settings in the project):

```json
{
  "mcpServers": {
    "gsc-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/gsc-mcp/dist/server.js"],
      "env": {}
    }
  }
}
```

After `npm link -g`:

```json
"command": "gsc-mcp",
"args": []
```

Restart Cursor, then open **Settings → MCP** and confirm `gsc-mcp` is connected. The tools listed are served by the **local Node server**, not by Google directly.

---

### 3. GitHub Copilot (VS Code)

Copilot Chat in VS Code uses a different JSON shape: top-level **`servers`**, not `mcpServers`.

**Workspace** — `.vscode/mcp.json` (commit for your team):

```json
{
  "servers": {
    "gsc-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/gsc-mcp/dist/server.js"]
    }
  }
}
```

**User profile** — Command Palette → **MCP: Open User Configuration**.

Verify with **MCP: List Servers**. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) and [Copilot MCP guide](https://docs.github.com/en/copilot/customizing-copilot/using-model-context-protocol/extending-copilot-chat-with-mcp).

---

### 4. OpenAI Codex

[Codex](https://developers.openai.com/codex) (CLI and IDE extension) stores MCP servers in TOML.

**Option A — CLI**

```bash
codex mcp add gsc-mcp -- \
  node /absolute/path/to/gsc-mcp/dist/server.js
```

**Option B — `~/.codex/config.toml`**

```toml
[mcp_servers.gsc-mcp]
command = "node"
args = ["/absolute/path/to/gsc-mcp/dist/server.js"]
```

Project-level: `.codex/config.toml` in a trusted project. In the Codex TUI, run `/mcp` to see active servers. Details: [Codex MCP](https://developers.openai.com/codex/mcp).

---

### 5. Claude Desktop

Add under `mcpServers` in Claude Desktop’s config file (path depends on OS):

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

Restart Claude Desktop after saving.

---

### Other MCP clients

Any client that supports **stdio MCP** can use:

```bash
node /absolute/path/to/gsc-mcp/dist/server.js
```

Do not wrap the process in HTTP unless the client requires streamable HTTP and you accept the [security tradeoffs](#security).

---

## Tools reference

### `gsc_mcp_server_ping`

Checks that **this MCP server** (the local Node.js process) is running. Returns `pong`.

Does **not** contact Google Search Console, your site, or Search Console’s APIs. Use the `gsc_*` tools for GSC data.

---

### `gsc_list_sites`

Lists Search Console properties the authenticated identity can access.

**Parameters:** none

**Returns:** JSON from the Search Console API (`siteEntry`, etc.)

---

### `gsc_search_analytics`

Queries search analytics: impressions, clicks, CTR, average position.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `site_url` | yes | Property URL, e.g. `https://example.com/` or `sc-domain:example.com` |
| `start_date` | yes | `YYYY-MM-DD` |
| `end_date` | yes | `YYYY-MM-DD` |
| `dimensions` | no | Up to 5 of: `query`, `page`, `country`, `device`, `searchAppearance`, `date` |
| `type` | no | `web`, `image`, `video`, `news`, `discover`, `googleNews` |
| `row_limit` | no | 1–25000 (API max) |
| `start_row` | no | Pagination offset |
| `dimension_filter_groups` | no | Structured filters (bounded schema) |
| `aggregation_type` | no | `auto`, `byProperty`, `byPage` |
| `data_state` | no | `final` or `all` |

---

### `gsc_inspect_url`

Runs URL inspection (index status, crawl, mobile usability, rich results).

| Parameter | Required | Description |
|-----------|----------|-------------|
| `site_url` | yes | Property URL |
| `inspection_url` | yes | Full URL to inspect (must belong to the property) |
| `language_code` | no | Issue message language (default `en-US`) |

---

### `gsc_list_sitemaps`

Lists sitemaps submitted for a property.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `site_url` | yes | Property URL |

---

## Example prompts for agents

Once the server is connected, you can ask your agent things like:

- *“List all Search Console properties I have access to.”*
- *“For `https://example.com/`, show top queries by clicks for the last 28 days.”*
- *“Pull search analytics for `sc-domain:example.com` with dimensions `date` and `query`, limit 50 rows.”*
- *“Inspect `https://example.com/pricing` in Search Console and summarize indexing status.”*
- *“What sitemaps are submitted for `https://example.com/`?”*

Tip: `site_url` must match GSC exactly (often a trailing slash on URL-prefix properties).

---

## Security

This server can access **your** Search Console data using **your** Google credentials. Treat it like any tool that runs API calls on your machine.

### What we enforce in code

| Control | Detail |
|---------|--------|
| **Read-only OAuth** | Scope `https://www.googleapis.com/auth/webmasters.readonly` only |
| **No write tools** | No sitemap submit, no site add/remove |
| **Stdio default** | MCP clients spawn the process locally; no network listener unless you opt in |
| **Loopback HTTP bind** | `--host` defaults to `127.0.0.1` |
| **HTTP warnings** | Binding to `0.0.0.0` logs an explicit exposure warning |
| **Request limits** | HTTP POST body max **4 MB**; max **32** concurrent HTTP sessions |
| **Input validation** | Zod schemas on tool parameters |
| **Error redaction** | Tool and log messages strip home paths and noisy stack details |

### What you should do

1. **Prefer stdio** for Cursor and Claude Desktop (default).
2. **Do not expose HTTP** to the public internet without extra auth (reverse proxy, VPN, mTLS, or shared secret). HTTP mode has **no MCP-layer authentication**.
3. **Use least-privilege Google access** — only the GSC scope above unless you deliberately share ADC with other MCP servers.
4. **Never commit** service account JSON or `.env` secrets (see `.gitignore`).
5. **Review** [security_best_practices_report.md](security_best_practices_report.md) for the full audit and residual risks.

### Threat model (short)

| Mode | Who can call tools? |
|------|---------------------|
| **stdio** | The MCP client process that started the server (your IDE / agent host) |
| **HTTP on `127.0.0.1`** | Processes on your machine that can open that port |
| **HTTP on `0.0.0.0`** | Anyone on the network that can reach the port |

---

## Transports: stdio vs HTTP

```
┌─────────────┐     stdin/stdout (JSON-RPC)     ┌──────────────┐
│ MCP client  │ ◄──────────────────────────────► │   gsc-mcp    │
│ (Cursor)    │         default: stdio          │   + Google   │
└─────────────┘                                 │   Search     │
                                                │   Console API│
┌─────────────┐     HTTP POST/GET /mcp          └──────────────┘
│ MCP client  │ ◄──────────────────────────────►      ▲
│ (optional)  │         --transport http                │
└─────────────┘                                         │
                                                        ADC /
                                                   service account
```

### Stdio (default, recommended)

```bash
node dist/server.js
# or
gsc-mcp
```

- Best for Cursor, Claude Desktop, and local agents
- Uses `stdio-guard` so logs go to stderr and JSON-RPC stays on stdout
- No port to firewall

### HTTP (optional)

```bash
node dist/server.js --transport http --host 127.0.0.1 --port 3000
```

Endpoint: `http://<host>:<port>/mcp` (streamable HTTP transport per MCP SDK).

Use HTTP only when your client requires it and you understand the [security](#security) implications.

---

## Configuration

### CLI

```
gsc-mcp [--transport stdio|http] [--host <addr>] [--port <n>] [--version] [--help]
```

| Flag / variable | Default | Description |
|-----------------|---------|-------------|
| `--transport` / `GSC_MCP_TRANSPORT` | `stdio` | `stdio` or `http` |
| `--host` / `GSC_MCP_HOST` | `127.0.0.1` | HTTP bind address |
| `--port` / `GSC_MCP_PORT` | `3000` | HTTP port |
| `GOOGLE_APPLICATION_CREDENTIALS` | — | Path to service account JSON |

### Smithery

[Smithery](https://smithery.ai/) is a registry for discovering and installing MCP servers in compatible clients. [smithery.yaml](smithery.yaml) tells Smithery to run this server over stdio via `npx gsc-mcp`.

---

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| **Authentication failed** | Run `gcloud auth application-default login` with `webmasters.readonly`. Enable [Search Console API](#google-cloud-project-required) on a Cloud project; set [quota project](#google-cloud-project-required). Confirm GSC property access. |
| **API has not been used / disabled / access not configured** | Enable `searchconsole.googleapis.com` on your GCP project. Wait a few minutes after enabling. |
| **Permission denied** | Property not shared with your account or service account. |
| **Site or resource not found** | Fix `site_url` (trailing slash, `https://` vs `sc-domain:`). |
| **Tools missing in Cursor** | Restart Cursor; check MCP logs; verify absolute path to `dist/server.js` and that you ran `npm run build`. |
| **Server exits immediately** | Run `node dist/server.js` in a terminal: stdio servers wait for input; that is normal. |
| **Insufficient authentication scopes** | Re-run ADC login including `webmasters.readonly`. |
| **Quota exceeded** | Wait and retry; reduce `row_limit` or query frequency. |

Enable integration tests against the live API:

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly

GSC_INTEGRATION=1 \
GSC_SITE_URL="https://your-site.example/" \
npm run test:integration
```

---

## Development

Every push and pull request to `main` runs [CI](.github/workflows/ci.yml): `npm ci`, `npm test`, production build, CLI smoke checks, and `npm audit` (high+) on Node 18, 20, and 22. Integration tests are local only (they need your Google ADC).

```bash
npm run typecheck      # TypeScript check (src)
npm test               # Unit tests (mocked GSC client)
npm run build          # dist/server.js
npm run build:prod     # Minified production bundle
npm run test:integration   # Live API (requires ADC + GSC_INTEGRATION=1)
```

Project layout:

```
src/
  server.ts          # Entry, transport selection
  cli.ts             # Args and help
  stdio-guard.ts     # MCP-safe stdout
  http-transport.ts  # Optional HTTP MCP
  http-body.ts       # Bounded POST reader
  tools/             # GSC tool implementations + Zod schemas
test/                # Node test runner suites
```

Contributions welcome via [issues](https://github.com/vmandic/gsc-mcp/issues) and pull requests.

---

## License

[MIT](LICENSE) — Copyright (c) Vedran Mandić and contributors.
