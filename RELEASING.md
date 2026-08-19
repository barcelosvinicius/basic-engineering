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
2. If any backlog item changed state, refresh the status table:
   `node scripts/backlog-audit.js --md` and commit it. The release refuses to
   run against a stale table — it once claimed "nothing implemented" for two
   months while 16 of 20 items had shipped.
3. Run:

   ```bash
   npm run release -- minor        # or: patch | major | an explicit 3.2.0
   ```

   This bumps the four version files in lockstep, rolls `[Unreleased]` into a
   dated section, regenerates the guides, runs `validate` + tests, then commits
   `chore(release): vX.Y.Z`. `--dry-run` previews without committing — note it
   **does write the files** (so you can read the diff) and prints how to revert;
   if one of those files already had uncommitted work, it says so instead of
   telling you to `git checkout --` over it.

4. Push:

   ```bash
   git push origin HEAD
   ```

   (or run step 2 with `--push` to do it in one go). The push to `main` does
   **both**: the marketplace plugin updates on its own, and `release.yml` sees
   the new version, runs `validate` + tests, `npm publish`es via OIDC (public,
   with provenance), then creates the tag and GitHub release. If the version is
   unchanged, the workflow no-ops — so ordinary commits never publish.

> Manual fallback (needs npm 2FA): `npm publish --auth-type=web` and approve in
> the browser. Prefer the CI path — no secrets, and it attaches provenance.
