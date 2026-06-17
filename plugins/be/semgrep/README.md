# Semgrep rules (bundled starter set)

SAST rules shipped with `be` so that **enforcement reaches the generation loop**,
not only CI. The `/be:check` command runs these when `semgrep` is on PATH; the
`infra-ci-cd` skill wires them into the pipeline.

| Rule | Catches |
| --- | --- |
| `no-localstorage-business-data.yml` | Business data persisted to `localStorage` (UI-only keys allowlisted) |

## Usage

```bash
# Channel A (Claude Code plugin): rules live at ${CLAUDE_PLUGIN_ROOT}/semgrep/
# Channel B (npm installer):      rules live at .be/semgrep/
semgrep --config <this-dir> --error <changed-paths>
```

## Adding project rules

This is a **starter set**, intentionally small and low-false-positive. Every
project should add SAST rules for its own domain risks (hardcoded secrets,
sensitive logging, weak hash, SQL concatenation, localStorage auth, innerHTML
XSS, `eval`) — see the `infra-ci-cd` skill for the full recommended set and the
rule template. Keep project rules under the project's own `.semgrep/rules/`.

> Secret detection, linter-config protection, and the `git --no-verify` block
> are handled live by the `be` PreToolUse hook — these Semgrep rules cover what
> static analysis does better (structural/dataflow patterns).
