# Changelog

All notable changes to this project are documented here. Versioning follows [Semantic Versioning](https://semver.org/). Releases are tagged on GitHub to match `package.json`.

## [1.1.1] - 2026-09-08

### Fixed

- Dependency updates to clear high-severity `npm audit` findings (`@toon-format/toon`, `hono`, `fast-uri`, `ip-address`, and related transitive packages).

### Notes

- No runtime API or MCP tool changes since 1.1.0.

## [1.1.0] - 2026-05-22

### Added

- Optional **TOON** tool output via `GSC_OUTPUT_FORMAT=toon` ([Token-Oriented Object Notation](https://github.com/toon-format/toon)) for fewer tokens on tabular GSC responses.
- `src/output-format.ts` with search analytics row flattening (dimension names from request) and tab-delimited TOON encoding.
- URL inspection remains JSON when TOON is enabled (nested payloads).

### Notes

- Default output is unchanged (`json`). Set `GSC_OUTPUT_FORMAT=toon` in the MCP client `env` block to opt in.

## [1.0.1] - 2026-05-21

### Added

- Cursor **ship-release** skill and path-scoped **`.cursor/rules/`** for agents (core, code-style, architecture, tests, security, git).
- Trimmed **AGENTS.md** as an index to rules and skills.

### Notes

- Runtime bundle unchanged since 1.0.0; patch aligns npm and GitHub release with current repository docs and maintainer workflow.

## [1.0.0] - 2026-05-21

First public release.

### Added

- Read-only Google Search Console MCP server (stdio default, optional HTTP).
- Tools: `gsc_list_sites`, `gsc_search_analytics`, `gsc_inspect_url`, `gsc_list_sitemaps`, `gsc_mcp_server_ping`.
- OAuth scope `webmasters.readonly` only; Zod validation for tool inputs.
- HTTP hardening: loopback bind default, 4 MB body limit, max 32 sessions, security headers.
- Published to npm as [`@vmandic/searchconsole-mcp`](https://www.npmjs.com/package/@vmandic/searchconsole-mcp).

### Notes

- npm package is **scoped** (`@vmandic/searchconsole-mcp`) because unscoped `searchconsole-mcp` is blocked as too similar to [`search-console-mcp`](https://www.npmjs.com/package/search-console-mcp).
- Distribution is via **npm**, not GitHub Packages (see [docs/RELEASES.md](docs/RELEASES.md)).

[1.1.1]: https://github.com/vmandic/searchconsole-mcp/releases/tag/v1.1.1
[1.1.0]: https://github.com/vmandic/searchconsole-mcp/releases/tag/v1.1.0
[1.0.1]: https://github.com/vmandic/searchconsole-mcp/releases/tag/v1.0.1
[1.0.0]: https://github.com/vmandic/searchconsole-mcp/releases/tag/v1.0.0
