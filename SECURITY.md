# Security Policy

## Supported versions

Only the latest published version of `@barcelosvinicius/basic-engineering` (npm) and
the `be` plugin (marketplace `basic-engineering`) receive security updates.

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

- Use [GitHub private vulnerability reporting](https://github.com/barcelosvinicius/basic-engineering/security/advisories/new), or
- Email the maintainer listed in `package.json`.

Include: affected file(s), reproduction steps, and impact assessment. You can expect an
acknowledgement within 7 days.

## Scope notes

- This package ships **markdown content and a file-copying CLI**. It executes no code in
  target projects except the optional Claude Code `SessionStart` hook
  (`plugins/be/hooks/scripts/session-start.js`), which only reads `docs/HISTORY.md` from
  the current project and prints a summary.
- The plugin ships **no MCP servers** by default. `plugins/be/mcp.recommended.json` is a
  documented template the user must copy and review consciously — review any MCP server
  before enabling it.
- The installer never deletes user files and never writes outside the target's
  `.be/` directory.
