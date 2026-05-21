# Security best practices report — searchconsole-mcp

**Date:** 2026-05-21  
**Last updated:** 2026-05-21 (post-remediation)  
**Scope:** TypeScript / Node.js MCP server, optional HTTP transport

## Executive summary

Initial review flagged **HTTP mode** as the main risk: unauthenticated access to Google ADC on a network-visible bind address, plus unbounded bodies and sessions.

**Remediation (commits `d71b76c` … `5a7de1d`):**

| Finding | Status |
|---------|--------|
| 1–2 Unauthenticated HTTP / all-interface bind | **Mitigated** — default `127.0.0.1`, `--host` flag, warnings for `0.0.0.0` |
| 3 Unbounded POST body | **Fixed** — `readJsonBody`, 4 MB cap, 413 response |
| 4 Unbounded sessions | **Fixed** — max 32 concurrent sessions |
| 5–7 Weak Zod / filters / logs | **Improved** — `src/tools/schemas.ts`, redacted stderr via `formatErrorForLog` |
| 8 Broad scope hints | **Fixed** — `ADC_SCOPES_GSC_ONLY` in errors; multi-MCP hint in help only |
| 9 Security headers | **Partial** — `X-Content-Type-Options: nosniff` on HTTP responses |
| 10 Dependencies | **OK** — `npm audit`: 0 vulnerabilities |

**Residual risk:** HTTP mode still has **no MCP-layer authentication**. Loopback default is appropriate for local agents; do not expose `0.0.0.0` without extra controls.

---

## Critical (remediated with caveats)

### Finding 1 — Unauthenticated HTTP MCP exposes Google credentials

| Field | Detail |
|-------|--------|
| **Severity** | Critical when HTTP is exposed beyond localhost |
| **Status** | **Mitigated** (not eliminated) |
| **Remediation** | Default bind `127.0.0.1`; CLI/README warn that HTTP uses host ADC; `--host` documented |
| **Residual** | No API key or mTLS on `/mcp`. Anyone who can reach the bind address can still use tools. |

---

## High (addressed)

### Finding 2 — HTTP server binds all interfaces

| **Status** | **Fixed** |
| **Evidence** | `httpServer.listen(port, host, …)` with `DEFAULT_HTTP_HOST = '127.0.0.1'` (`src/http-config.ts`, `src/http-transport.ts`) |

### Finding 3 — Unbounded HTTP request body

| **Status** | **Fixed** |
| **Evidence** | `src/http-body.ts`, `MAX_HTTP_BODY_BYTES`, tests in `test/http-body.test.ts` |

### Finding 4 — Unbounded in-memory MCP sessions

| **Status** | **Fixed** |
| **Evidence** | `MAX_HTTP_SESSIONS = 32`, 503 when exceeded (`src/http-transport.ts`) |

---

## Medium (improved)

### Finding 5 — Weak Zod validation

| **Status** | **Improved** |
| **Evidence** | `src/tools/schemas.ts` — dates, URLs, `row_limit` max, allowlisted dimensions/types |

### Finding 6 — Verbose errors logged to stderr

| **Status** | **Improved** |
| **Evidence** | `formatErrorForLog` in `src/errors.ts`; used in `http-transport.ts` and `server.ts` |

### Finding 7 — Arbitrary `dimension_filter_groups`

| **Status** | **Improved** |
| **Evidence** | Structured Zod schema with bounded arrays (`src/tools/schemas.ts`) |

---

## Low (addressed / informational)

### Finding 8 — Broad OAuth scope hints

| **Status** | **Fixed** — `ADC_SCOPES_GSC_ONLY` in tool errors |

### Finding 9 — No security headers

| **Status** | **Partial** — `X-Content-Type-Options: nosniff` |

### Finding 10 — Dependencies

| **Status** | **OK** at scan time |

---

## Security-and-hardening checklist (post-fix)

### Authentication

- [x] OAuth scope limited to `webmasters.readonly`
- [x] No passwords/tokens in repo
- [ ] HTTP MCP auth (not implemented; use stdio or network isolation)

### Input

- [x] Zod validation at MCP tool boundary
- [x] No SQL/shell sinks
- [x] HTTP body size limit

### Data

- [x] Tool errors redacted for clients
- [x] stderr uses redacted log formatter for HTTP handler and fatal paths

### Infrastructure

- [x] Loopback default for HTTP
- [x] `npm audit` clean
- [x] `.gitignore` excludes `node_modules`, `dist`

---

## Recommended follow-ups (optional)

1. Shared secret or mTLS for HTTP mode when remote access is required  
2. Rate limit on `initialize` per IP  
3. CI job: `npm test && npm audit`  
4. Document threat model in `docs/HTTP.md` if HTTP mode is first-class  
