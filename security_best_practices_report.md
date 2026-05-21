# Security best practices report — gsc-mcp

**Date:** 2026-05-21  
**Scope:** `/Users/vekzdran/source/vmandic/gsc-mcp` (TypeScript / Node.js MCP server, optional HTTP transport)  
**Guidance used:** `javascript-express-web-server-security.md` (HTTP server patterns; no Express framework in repo)

## Executive summary

`gsc-mcp` is a small read-only MCP bridge to Google Search Console. The default **stdio** transport is reasonably safe for local agent use because only the parent process talks to the server. The main risks appear when **HTTP mode** is enabled: the server listens on all interfaces with **no MCP-layer authentication**, so anyone who can reach the port may invoke tools using the host’s Google Application Default Credentials.

Dependency audit (`npm audit`) reported **0 vulnerabilities** at scan time. Input validation uses Zod but is permissive in places; error text returned to MCP clients is partially redacted, while stderr logging may still leak detail.

**Recommended priorities:** bind HTTP to loopback only (or document and enforce it), add request body limits, tighten Zod schemas, and align README with actual network behavior.

---

## Critical

### Finding 1 — Unauthenticated HTTP MCP exposes Google credentials to the network

| Field | Detail |
|-------|--------|
| **Severity** | Critical (when `--transport http` is used outside a trusted single-user machine) |
| **Location** | `src/http-transport.ts` — `httpServer.listen(port)` (lines 104–106); session handling (lines 14–97) |
| **Evidence** | No auth middleware, API keys, or session secrets. Any client that can `POST` to `/mcp` with a valid MCP initialize payload can create a session and call tools. Tools use `GoogleAuth` with `webmasters.readonly` (see `src/server.ts` lines 36–37, 45). |
| **Impact** | Remote attacker on the same LAN (or internet if port is exposed) can list GSC properties, pull search analytics, inspect URLs, and list sitemaps as the server OS user’s Google identity. |
| **Fix** | Default HTTP bind to `127.0.0.1` only; add `--host` with safe default. Optionally require a shared secret header or mTLS for HTTP mode. Document that HTTP must not be exposed publicly. |
| **Mitigation** | Firewall the port; run only stdio in production; use SSH tunnel if remote access is needed. |
| **False positives** | Low risk if HTTP is never enabled and only stdio is used. |

---

## High

### Finding 2 — HTTP server binds all interfaces, not loopback

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `src/http-transport.ts` line 104: `httpServer.listen(port, ...)` |
| **Evidence** | Node’s `server.listen(port)` without a host accepts connections on all addresses (`0.0.0.0` / `::`), not only localhost. README states `http://127.0.0.1:<port>/mcp` (README line 85), which does not match implementation. |
| **Impact** | Amplifies Finding 1: GSC MCP may be reachable from other machines on the network without the operator intending it. |
| **Fix** | `httpServer.listen(port, '127.0.0.1', ...)` by default; optional `--host 0.0.0.0` with explicit warning in help text. |
| **Mitigation** | OS firewall blocking inbound on the chosen port. |

### Finding 3 — Unbounded HTTP request body (DoS / memory exhaustion)

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `src/http-transport.ts` lines 28–30 |
| **Evidence** | All POST body chunks are accumulated with no max size: `for await (const chunk of req) chunks.push(chunk)`. |
| **Impact** | Large or slow POST bodies can exhaust memory or CPU on the MCP host (denial of service). |
| **Fix** | Enforce a max body size (e.g. 1–4 MB for JSON-RPC MCP) and abort with 413 if exceeded. Align with EXPRESS-BODY-001 spirit. |
| **Mitigation** | Reverse proxy body limits if HTTP is fronted by nginx/Caddy. |

### Finding 4 — Unbounded in-memory MCP sessions

| Field | Detail |
|-------|--------|
| **Severity** | Medium–High |
| **Location** | `src/http-transport.ts` line 12: `transports: Record<string, ...>` |
| **Evidence** | Each successful initialize adds an entry; cleanup only on `transport.onclose`. No cap on session count or idle timeout. |
| **Impact** | Attacker (or bug) can open many sessions and grow memory until the process is stressed. |
| **Fix** | Max concurrent sessions, idle TTL, rate limit on initialize. |
| **Mitigation** | Process restart; single-user trusted network only. |

---

## Medium

### Finding 5 — Weak Zod validation on tool inputs

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `src/tools/index.ts` lines 45–54, 63–65 |
| **Evidence** | `site_url`, `inspection_url`, dates are `z.string()` only. `row_limit` has no `.max(25000)`. `dimension_filter_groups` is `z.array(z.record(z.unknown()))`. |
| **Impact** | Invalid or oversized API calls may waste quota, cause confusing errors, or pass unexpected structures to the Google client (API should reject, but abuse is easier). |
| **Fix** | Stricter schemas: URL format checks, `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` for dates, `row_limit` capped, allowlisted `dimensions` / `type` values. |
| **Mitigation** | Google API-side validation and quota limits. |

### Finding 6 — Verbose errors logged to stderr

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `src/http-transport.ts` line 75; `src/server.ts` lines 68–77 |
| **Evidence** | `console.error('[gsc-mcp] Error handling MCP request:', error)` logs full error objects. Tool responses use `sanitizeToolError` (`src/errors.ts`), but logs are not redacted. |
| **Impact** | Shared logs or CI artifacts may contain paths, project IDs, or Gaxios response fragments. |
| **Fix** | Log structured, redacted messages in production; reuse sanitization for stderr. |
| **Mitigation** | Restrict log access; avoid HTTP mode in multi-tenant environments. |

### Finding 7 — `dimension_filter_groups` accepts arbitrary objects

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `src/tools/index.ts` line 52; `src/tools/gscSearchAnalytics.ts` line 33 |
| **Evidence** | Untrusted MCP tool args cast to API types: `as searchconsole_v1.Schema$ApiDimensionFilterGroup[]`. |
| **Impact** | Not classic SQL/command injection; risk is API abuse, quota burn, or unexpected API behavior from malformed filters. |
| **Fix** | Replace `z.record(z.unknown())` with a strict Zod schema matching GSC filter shape, or remove the parameter until needed. |

---

## Low

### Finding 8 — Help text suggests broader OAuth scopes than required

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Location** | `src/config.ts` `ADC_SCOPES_HINT`; `src/cli.ts` line 38; `src/errors.ts` line 31 |
| **Evidence** | Auth hints include Analytics and `cloud-platform` scopes in addition to `webmasters.readonly`. |
| **Impact** | Operators may grant more Google access than this server needs (least-privilege violation). |
| **Fix** | Primary hint: readonly GSC scope only; optional second line for multi-MCP setups. |
| **Mitigation** | Document scope choice in README (partially present). |

### Finding 9 — No security headers on HTTP responses

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Location** | `src/http-transport.ts` — all `res.writeHead` calls |
| **Evidence** | JSON/plain responses without `X-Content-Type-Options`, etc. |
| **Impact** | Limited for a JSON API with no browser UI; minor if something embeds responses in HTML. |
| **Fix** | Set `X-Content-Type-Options: nosniff` on JSON responses if desired (EXPRESS-HEADERS-001 style). |

### Finding 10 — Dependency hygiene (informational)

| Field | Detail |
|-------|--------|
| **Severity** | Low / informational |
| **Location** | `package.json`, `package-lock.json` |
| **Evidence** | `npm audit` at scan time: 0 vulnerabilities. |
| **Impact** | Supply-chain risk remains; lockfile should stay committed and audited on release. |
| **Fix** | Keep `npm audit` in CI; pin major SDK updates deliberately. |

---

## Positive observations

| Area | Notes |
|------|--------|
| **Scope** | OAuth limited to `webmasters.readonly` (`src/config.ts`). No write tools in codebase. |
| **Tool errors to clients** | `sanitizeToolError` redacts paths and maps common API failures (`src/errors.ts`). |
| **No shell/exec** | No `child_process`, `eval`, or dynamic code execution in application source. |
| **Stdio default** | Default transport is stdio, which avoids network exposure when used as documented for Cursor. |
| **CLI port validation** | Port range checked in `src/cli.ts` lines 65–67. |

---

## Suggested fix order

1. Finding 2 + 1 — loopback bind and document HTTP threat model  
2. Finding 3 — body size limit  
3. Finding 4 — session limits (if HTTP stays supported)  
4. Finding 5 + 7 — tighten Zod schemas  
5. Finding 6 + 8 — logging and scope hints  

---

## Out of scope / not reported

- **TLS/HSTS** — Local MCP; TLS not expected on raw HTTP (per skill guidance).  
- **CSRF/cookies** — No cookie-based web UI.  
- **XSS** — No HTML rendering of user content.  
- **SSRF** — Outbound URLs go to Google APIs only; tool URLs are not used for server-side fetch to arbitrary hosts.
