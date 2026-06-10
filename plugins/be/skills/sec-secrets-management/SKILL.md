---
name: sec-secrets-management
description: >
  Use when handling any credential — API keys, database passwords, signing
  secrets, certificates — or when configuring environments and CI. Storage,
  injection, rotation, scanning, and incident response for leaked secrets.
---

# Skill: Secrets Management

Rules for storing, injecting, rotating, and protecting secrets in any
project. A secret is anything that grants access: passwords, API keys,
tokens, signing keys, certificates, connection strings.

Reference: `engineering-principles.md` §2 (Security).

## The non-negotiables

1. **No secret in the repository, ever** — not in code, config files,
   migrations, tests, docs, commit messages, or CI logs. `.env` files are
   git-ignored; only `.env.example` (with placeholder values) is committed.
2. **Inject at runtime** — environment variables or a secrets manager
   (cloud KMS/Secrets Manager, Vault). The application fails fast and
   clearly at startup when a required secret is missing.
3. **One secret per purpose** — never reuse the JWT signing key as the
   database password or share credentials across environments.
4. **Least privilege** — credentials scoped to exactly what the consumer
   needs (read-only DB user for reporting, deploy token limited to one repo).
5. **Rotation is routine, not an emergency** — design so a secret can be
   swapped without a code change (re-read from env/manager on restart).

## Environment layout

```
.env.example      # committed — names + placeholder values + comments
.env              # git-ignored — local development values
CI secrets store  # GitHub Actions secrets / equivalent — per environment
Production        # secrets manager or platform env vars, never files in the image
```

Rules:
- Document every variable in `.env.example` with a one-line comment.
- CI masks secrets in logs — but never `echo` them anyway.
- Docker images never contain secrets (no `ENV` with real values, no
  baked-in files); inject at container start.

## Detection — catch leaks before they land

- Enable secret scanning in CI: Semgrep `p/secrets`, gitleaks, or the
  platform's native scanner (see the `infra-ci-cd` skill).
- Add a pre-commit hook where the team tolerates it.
- Custom SAST rule for the project's own token formats.

## Incident response — a secret leaked

Order matters; follow exactly:

1. **Rotate first** — issue a new secret and deploy it.
2. **Revoke the leaked one** — only after the replacement is live.
3. **Audit usage** — check access logs for the exposure window.
4. **Then clean history** — rewriting git history is cosmetic; the secret
   is compromised the moment it was pushed. Never treat removal as the fix.
5. Record the incident in `docs/lessons-learned.md`.

## Application-level secrets

- **Password storage:** modern memory-hard KDF — Argon2id (preferred) or
  bcrypt with adequate cost. Never MD5/SHA-x, never reversible encryption.
- **Signing keys:** ≥ 256-bit random (`openssl rand -hex 32`); see
  `be-jwt-auth-patterns` for token-specific rules.
- **Logs:** never log secrets or PII; scrub headers like `Authorization`
  in middleware (see `ops-observability`).

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Secret committed "temporarily" | Local shortcut | `.env` git-ignored from day one; scanner in CI |
| Same secret in dev and prod | Convenience | Per-environment values, separate stores |
| Secret removed from git but not rotated | Treating cleanup as the fix | Rotate + revoke first, always |
| App starts with missing secret and fails later | No startup validation | Validate required vars at boot, fail fast |
| Secrets in CI logs | Debug echo | Never print; rely on masked secret stores |
