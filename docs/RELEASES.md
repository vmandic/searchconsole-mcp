# Releases and distribution

This document describes how versions of **searchconsole-mcp** are published and where to install them.

## GitHub Releases

| Resource | URL |
|----------|-----|
| **All releases** | https://github.com/vmandic/searchconsole-mcp/releases |
| **Latest release** | https://github.com/vmandic/searchconsole-mcp/releases/latest |
| **Create a release** (maintainers) | https://github.com/vmandic/searchconsole-mcp/releases/new |

GitHub Releases track **source milestones**: tag `vX.Y.Z` on `main` should match `version` in [`package.json`](../package.json). Release notes live in [CHANGELOG.md](../CHANGELOG.md) and on the GitHub release page.

GitHub Releases do **not** host the npm tarball. Users install the server from the npm registry (below).

### Maintainer checklist (new version)

Agents: follow [.cursor/skills/ship-release/SKILL.md](../.cursor/skills/ship-release/SKILL.md) (confirmation gates before npm publish and git tag).

1. Bump `version` in `package.json` and update `CHANGELOG.md`.
2. Run `npm test` and `npm run build:prod`.
3. Publish: `npm publish --auth-type=web` (scoped public package; `publishConfig.access` is already `public`).
4. Tag and release on GitHub:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title "vX.Y.Z" --notes-file CHANGELOG.md
   ```
   Or use [releases/new](https://github.com/vmandic/searchconsole-mcp/releases/new) in the browser and paste the changelog section for that version.

## npm package (primary install)

| Resource | URL |
|----------|-----|
| **Package page** | https://www.npmjs.com/package/@vmandic/searchconsole-mcp |
| **Install** | `npm install -g @vmandic/searchconsole-mcp` |
| **Run without install** | `npx -y @vmandic/searchconsole-mcp` |

The package name is **`@vmandic/searchconsole-mcp`**. The CLI binary is still **`searchconsole-mcp`**.

`package.json` links this repository via the `repository` field so npmjs.com can show the GitHub source link.

## GitHub Packages tab

https://github.com/vmandic/searchconsole-mcp/packages

That page lists packages **published to GitHub’s registry** (Container registry, GitHub Packages npm scope, etc.). This project distributes through **registry.npmjs.org**, not GitHub Packages, so the Packages tab may stay empty unless you add a separate publish target later.

For consumers, use **npm** and **GitHub Releases**, not the Packages tab.

## Version alignment

| Location | Should match |
|----------|----------------|
| `package.json` → `version` | e.g. `1.0.0` |
| Git tag | `v1.0.0` |
| GitHub Release | `v1.0.0` |
| npm dist-tag `latest` | same semver |

## CI

Pushes to `main` run [.github/workflows/ci.yml](../.github/workflows/ci.yml) (tests, production build, audit). Publishing to npm and creating GitHub Releases are manual steps today.
