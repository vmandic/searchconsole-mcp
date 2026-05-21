# Agent guide — searchconsole-mcp

Read-only **Google Search Console** MCP server for Cursor, Claude, and other MCP clients. This file is for coding agents working in the repo. End-user setup lives in [README.md](README.md).

## What this project is

- **Scope:** GSC only — list properties, search analytics, URL inspection, sitemaps. No writes to Google.
- **OAuth:** Single scope `https://www.googleapis.com/auth/webmasters.readonly` (`GSC_READONLY_SCOPE` in `src/config.ts`). Do not add write or admin scopes without an explicit product decision and README/security updates.
- **Surface:** Five MCP tools (`gsc_mcp_server_ping`, `gsc_list_sites`, `gsc_search_analytics`, `gsc_inspect_url`, `gsc_list_sitemaps`). Prefer extending existing tools over adding unrelated Google APIs (GA4, Indexing API, etc.).
- **Transports:** **stdio** (default, for local MCP clients) and optional **HTTP** (loopback-first, bounded bodies/sessions).

## Tech stack

| Piece | Choice |
|-------|--------|
| Runtime | Node.js **≥ 18** (CI: 18, 20, 22) |
| Language | TypeScript (ESM, `.js` import suffixes in `src/`) |
| MCP | `@modelcontextprotocol/sdk` |
| Google | `@googleapis/searchconsole`, `google-auth-library` (ADC) |
| Validation | Zod (`src/tools/schemas.ts`) |
| Bundle | esbuild → single `dist/server.js` (`esbuild.config.mjs`); runtime deps **not** bundled |

## Commands

Run from repo root:

```bash
npm ci
npm test                 # typecheck + unit tests (mocked GSC)
npm run build            # dev bundle + sourcemap
npm run build:prod       # minified bundle (npm publish / release)
npm run typecheck
npm run test:integration # live API — needs ADC + GSC_INTEGRATION=1 + GSC_SITE_URL
```

After build:

```bash
node dist/server.js --help
node dist/server.js --version
```

`prepublishOnly` runs `build:prod`. Published tarball includes only `dist/server.js`, `README.md`, `LICENSE` (`package.json` → `files`).

## Project layout

```
src/
  server.ts           # Entry: stdio guard, CLI, transport, dynamic SDK imports
  cli.ts              # Args, help, version
  config.ts           # Server name, OAuth scopes, version
  stdio-guard.ts      # MCP-safe stdout (JSON-RPC only on stdout)
  errors.ts           # sanitizeToolError (user-facing), formatErrorForLog (stderr)
  clients.ts          # Lazy Search Console client + test overrides
  http-config.ts      # DEFAULT_HTTP_HOST, session/body limits
  http-body.ts        # Bounded JSON POST reader
  http-transport.ts   # Optional streamable HTTP MCP
  tools/
    index.ts          # registerGscTools — tool registration + safeTool wrapper
    schemas.ts        # Zod schemas (shared by tools and tests)
    gsc*.ts           # Thin API wrappers per resource
test/                 # node:test — mirror src concerns
```

## Conventions for changes

### MCP / stdio

- **Never** log to `stdout` in stdio mode except JSON-RPC. Use `console.error` / stderr, or the stdio guard (`installStdioGuard`). Breaking this breaks Cursor and Claude Desktop.
- Tool handlers return MCP text content; failures use `isError: true` and messages from `sanitizeToolError` (no raw stack traces or home paths to users).
- Register tools in `src/tools/index.ts`. Put Zod shapes in `src/tools/schemas.ts` and reuse `.shape` fields in `server.tool(...)` definitions.

### API wrappers

- Keep Google calls in `src/tools/gsc*.ts` via `getGscClient(auth)` from `src/clients.ts`.
- Unit tests mock the client with `setGscClientForTests` / `resetGscClientForTests`; do not call Google in default `npm test`.

### HTTP mode

- Default bind: `127.0.0.1` (`src/http-config.ts`). Treat `0.0.0.0` as dangerous; document warnings in CLI/README if touched.
- Respect existing limits: body size (`http-body.ts`), max sessions (`http-transport.ts`). Do not remove caps without security review.
- HTTP has **no MCP-layer auth**; residual risk is documented in `security_best_practices_report.md`.

### Errors and logging

- User-facing: `sanitizeToolError` in `src/errors.ts` — map auth, permission, not found, quota, invalid argument; redact paths.
- Operator logs: `formatErrorForLog` — use in `server.ts` / `http-transport.ts`, not raw `err.message` with secrets.

## Testing

| Suite | When | How |
|-------|------|-----|
| Unit | Always before PR | `npm test` — schemas, CLI, HTTP config/body, mocked GSC wrappers, tool registration |
| Integration | Local only, optional | `GSC_INTEGRATION=1` + ADC + `GSC_SITE_URL` → `npm run test:integration` |
| CI | Every push/PR to `main` | `.github/workflows/ci.yml` — no integration job |

Add tests next to the behavior (`test/*.test.ts`). Prefer extending existing describe blocks and mocks over new integration dependencies.

## Security and dependencies

- Read `security_best_practices_report.md` before changing HTTP transport, auth scopes, or validation bounds.
- Run `npm audit --audit-level=high` when changing dependencies; CI enforces this.
- Do not commit secrets, service account JSON, or `.env` with credentials.
- `npm publish` ships only the built CLI; users authenticate via **Application Default Credentials** on their machine.

## Boundaries (ask before doing)

- Adding MCP tools beyond the five GSC-focused tools or scopes beyond read-only GSC.
- Bundling dependencies into `dist/server.js` (current design: external `dependencies` at install time).
- Broad refactors, mass renames, or dependency major upgrades without explicit request.
- Committing or force-pushing without user instruction (see repo owner rules).
- Exposing HTTP on `0.0.0.0` by default or removing session/body limits.

## Publishing to npm

Package name: `@vmandic/searchconsole-mcp` (scoped; unscoped `searchconsole-mcp` blocked by npm as too similar to `search-console-mcp`). From a clean tree:

```bash
npm login
npm test
npm publish          # runs prepublishOnly → build:prod
```

Verify: `npm view @vmandic/searchconsole-mcp`, `npx -y @vmandic/searchconsole-mcp --help`. Bump `version` in `package.json` for releases. `publishConfig.access` is `public`.

## Docs and registry

- **README.md** — user install, MCP client config, auth, troubleshooting, tool reference.
- **smithery.yaml** — stdio via `npx -y @vmandic/searchconsole-mcp`; keep in sync if the npm package name or start command changes.

## Verification checklist (before claiming done)

- [ ] `npm test` passes
- [ ] `npm run build:prod` produces `dist/server.js` with shebang
- [ ] `node dist/server.js --help` and `--version` work
- [ ] New tool args validated in `schemas.ts` with tests
- [ ] No stdout pollution in stdio path; error messages still sanitized
- [ ] README/AGENTS.md updated if behavior, tools, auth, or HTTP security changed

## Repository

- GitHub: https://github.com/vmandic/searchconsole-mcp
- License: MIT
