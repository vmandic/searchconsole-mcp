# Agent guide — searchconsole-mcp

Coding agents: start with **Cursor rules** (below). End users: [README.md](README.md).

## Cursor rules (primary)

Conventions are split by topic in [`.cursor/rules/`](.cursor/rules/README.md):

- **`core-project.mdc`** — always on: identity, commands, rule index
- **`code-style.mdc`** — `src/`, `test/`: ESM, Zod, stdio, tool handlers
- **`architecture.mdc`** — `src/`: layout, tools, esbuild boundaries
- **`running-tests.mdc`** — tests and `package.json`: `npm test`, mocks, integration flag
- **`security-checking.mdc`** — auth, HTTP, deps, `security_best_practices_report.md`
- **`git-commit.mdc`** — commit/push/npm publish gates

Do not duplicate rule content here; update the relevant `.mdc` when conventions change.

## Cursor skills

| Skill | When |
|-------|------|
| [ship-release](.cursor/skills/ship-release/SKILL.md) | Version bump, `npm publish`, GitHub tag/release |

Index: [.cursor/skills/README.md](.cursor/skills/README.md). Reference: [docs/RELEASES.md](docs/RELEASES.md).

## Quick reference

| Item | Value |
|------|--------|
| npm | `@vmandic/searchconsole-mcp` |
| GitHub | https://github.com/vmandic/searchconsole-mcp |
| Test | `npm test` (required before claiming code done) |
| Build | `npm run build:prod` |
| License | MIT |

## Ask before doing

- New MCP tools or OAuth scopes beyond read-only GSC
- HTTP default bind or body/session limit changes
- `npm publish`, git tags, force push, or broad refactors without explicit request
