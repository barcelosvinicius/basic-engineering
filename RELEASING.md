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

### Cutting a release — one command

1. Write your notes under `## [Unreleased]` in `CHANGELOG.md`.
2. Run:

   ```bash
   npm run release -- minor        # or: patch | major | an explicit 3.2.0
   ```

   This bumps the four version files in lockstep, rolls `[Unreleased]` into a
   dated section, regenerates the guides, runs `validate` + tests, then commits
   `chore(release): vX.Y.Z` and tags `vX.Y.Z`. Add `--dry-run` to preview
   without committing.

3. Push to publish:

   ```bash
   git push origin HEAD vX.Y.Z
   ```

   (or run step 2 with `--push` to do it in one go). The tag push triggers
   `release.yml` → `validate` + tests → `npm publish` (public, with provenance)
   via OIDC. The push to `main` updates the marketplace plugin on its own.
4. Optional: `gh release create vX.Y.Z --notes-from-tag`.

> Manual fallback (needs npm 2FA): `npm publish --auth-type=web` and approve in
> the browser. Prefer the CI path — no secrets, and it attaches provenance.
