# Releasing

`be` ships through two channels, both driven from this repo.

## Channel A — Claude Code plugin (marketplace)

**Automatic.** The marketplace serves from `main`, so merging a version bump to
`main` is all it takes — users pick it up with `/plugin update be@basic-engineering`.

## Channel B — npm installer

Published by CI via **OIDC Trusted Publishing** — no token or secret stored. See
[.github/workflows/release.yml](.github/workflows/release.yml).

### One-time npm setup

On npmjs.com → the package → **Settings → Trusted Publisher → GitHub Actions**:

- **Repository:** `barcelosvinicius/basic-engineering`
- **Workflow filename:** `release.yml`
- **Environment:** leave empty

### Cutting a release

1. Bump the version in lockstep (`npm run validate` enforces the sync):
   `package.json`, `plugins/be/.claude-plugin/plugin.json`,
   `.claude-plugin/marketplace.json` (semver) and `BASE_VERSION`
   (`vYYYYMMDD-HHMMSS`).
2. Update `CHANGELOG.md` (move **Unreleased** into the new version).
3. If commands/agents/skills changed, run `npm run gen:guide` and commit the
   regenerated `BE-GUIDE.md` / `BE-GUIDE.pt.md`.
4. Tag and push:
   ```bash
   git tag vX.Y.Z
   git push origin main vX.Y.Z
   ```
   The tag push triggers `release.yml`, which checks the version matches the tag,
   runs `validate` + tests, then `npm publish` (public, with provenance) via OIDC.
5. Optional: `gh release create vX.Y.Z --notes-from-tag`.

> Manual fallback (needs npm 2FA): `npm publish --auth-type=web` and approve in
> the browser. Prefer the CI path — no secrets, and it attaches provenance.
