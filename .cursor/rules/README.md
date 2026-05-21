# Cursor rules (searchconsole-mcp)

Rules are `.mdc` files. **`core-project`** uses `alwaysApply: true`. Others activate when matching paths are in context (`alwaysApply: false` + `globs`).

| File | `alwaysApply` | Globs |
|------|---------------|--------|
| [core-project.mdc](core-project.mdc) | yes | — |
| [code-style.mdc](code-style.mdc) | no | `src/**/*.ts`, `test/**/*.ts` |
| [architecture.mdc](architecture.mdc) | no | `src/**/*` |
| [running-tests.mdc](running-tests.mdc) | no | `test/**`, `src/**`, `package.json` |
| [security-checking.mdc](security-checking.mdc) | no | `src/**`, `package.json`, `security_best_practices_report.md` |
| [git-commit.mdc](git-commit.mdc) | no | `**/*` |

Skills: [../skills/README.md](../skills/README.md). Human-facing docs: [../../README.md](../../README.md).
