---
name: ship-release
description: >-
  Ship a new version of @vmandic/searchconsole-mcp: bump version, CHANGELOG,
  npm publish, GitHub tag and release. Use when the user asks to release,
  publish to npm, tag vX.Y.Z, or create a GitHub release for searchconsole-mcp.
---

# Ship release (searchconsole-mcp)

Conservative maintainer workflow for this repo only. **Do not improvise** on package name, scopes, or git/npm commands.

## Hard rules

- **Never** publish as unscoped `searchconsole-mcp` (npm blocks it; use `@vmandic/searchconsole-mcp`).
- **Never** `git push --force`, `git reset --hard`, or skip hooks (`--no-verify`).
- **Never** commit secrets, `.env`, or service account JSON.
- **Never** run `npm publish` without explicit user approval for that version.
- **Never** tag or create a GitHub release if `npm test` or `npm run build:prod` failed.
- **Never** bump version on `main` and publish from a dirty or unrelated branch without user confirmation.
- Publish uses **`npm publish --auth-type=web`** (passkey in browser), not fake `--otp` placeholders.

## Before you start

Read:

- [docs/RELEASES.md](../../../docs/RELEASES.md)
- [CHANGELOG.md](../../../CHANGELOG.md)
- Current `version` in [package.json](../../../package.json)

Confirm with the user:

1. Target semver (`patch` / `minor` / `major` or exact `X.Y.Z`).
2. Whether npm + GitHub release happen in this session (both are manual).
3. That `main` is the release branch and CI is green.

## Version alignment (all must match)

| Artifact | Format |
|----------|--------|
| `package.json` → `version` | `1.2.3` |
| Git tag | `v1.2.3` |
| GitHub Release | `v1.2.3` |
| npm dist-tag `latest` | `1.2.3` |
| `CHANGELOG.md` section | `## [1.2.3] - YYYY-MM-DD` |

## Step 1 — Prepare code (git only)

1. `git status` — working tree must be clean except intentional release edits.
2. Bump `version` in `package.json` only (no drive-by refactors).
3. Add `## [X.Y.Z] - date` to `CHANGELOG.md` (Keep a Changelog style). Link at bottom: `[X.Y.Z]: https://github.com/vmandic/searchconsole-mcp/releases/tag/vX.Y.Z`
4. If user-facing install/docs changed, update `README.md` only where needed.
5. Run:

```bash
npm ci
npm test
npm run build:prod
node dist/server.js --version   # must match package.json
node dist/server.js --help >/dev/null
npm audit --audit-level=high
```

6. Commit on `main` with a clear message (e.g. `Release vX.Y.Z.`). **Push `main` only if the user asked to push.**

Stop if any command fails.

## Step 2 — Publish to npm (user machine)

**Agent does not run publish unless the user explicitly requests it in this session** (credentials + passkey are local).

Instruct the user (or run only after explicit approval):

```bash
npm whoami
npm view @vmandic/searchconsole-mcp version   # note current latest
npm publish --auth-type=web
```

Verify:

```bash
npm view @vmandic/searchconsole-mcp version
npx -y @vmandic/searchconsole-mcp --version
```

Notes:

- `prepublishOnly` runs `build:prod` automatically.
- `publishConfig.access` is `public` (scoped package).
- Distribution is **registry.npmjs.org**, not GitHub Packages.

## Step 3 — GitHub tag and release

After npm shows the new version (or user confirms publish succeeded):

```bash
git pull origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

Create the release (prefer section for this version, not entire CHANGELOG):

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z" \
  --notes "## searchconsole-mcp vX.Y.Z\n\n<bullet summary>\n\n**Install:** \`npx -y @vmandic/searchconsole-mcp\`\n\n**npm:** https://www.npmjs.com/package/@vmandic/searchconsole-mcp\n\n**Full changelog:** https://github.com/vmandic/searchconsole-mcp/blob/main/CHANGELOG.md"
```

Or browser: https://github.com/vmandic/searchconsole-mcp/releases/new

Verify:

- https://github.com/vmandic/searchconsole-mcp/releases/latest
- Release tag points at the commit that contains the version bump

## Step 4 — Post-release checks

- [ ] npm `latest` === `package.json` version
- [ ] GitHub release exists for `vX.Y.Z`
- [ ] `CHANGELOG.md` link for version works
- [ ] README npm badge resolves (may cache briefly)
- [ ] Do **not** re-publish the same version to npm (immutable)

## What not to change in a release PR

- OAuth scopes in `src/config.ts`
- HTTP bind defaults / body or session limits without security review
- Adding MCP tools or dependencies without explicit product approval
- `smithery.yaml` only if start command or package name changed

## Rollback (if publish was wrong)

- npm: deprecate or publish a **new** patch version; **cannot** overwrite an existing version.
- GitHub: delete mistaken release/tag only if user explicitly requests and understands impact.
- Never force-push `main`.

## References

- User docs: [README.md](../../../README.md) — Releases and npm package
- Maintainer docs: [docs/RELEASES.md](../../../docs/RELEASES.md)
- Agent guide: [AGENTS.md](../../../AGENTS.md)
