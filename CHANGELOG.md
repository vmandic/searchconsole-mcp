# Changelog

All notable changes to this project are documented here. Versioning follows [Semantic Versioning](https://semver.org/). Releases are tagged on GitHub to match `package.json`.

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

[1.0.0]: https://github.com/vmandic/searchconsole-mcp/releases/tag/v1.0.0
