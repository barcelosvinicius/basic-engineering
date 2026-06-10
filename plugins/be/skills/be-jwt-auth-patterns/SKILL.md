---
name: be-jwt-auth-patterns
description: >
  Use when implementing token-based authentication (JWT), deciding how to
  revoke tokens on logout, or choosing where to store tokens on the client.
  Stack-agnostic flow, secret handling, blocklist revocation, and client
  storage rules, with Java/Spring examples as a resource.
---

# Skill: JWT / Token Authentication

Universal token-based authentication patterns for any backend + frontend
project. Use when implementing authentication, configuring the auth
middleware/filter chain, or deciding where and how to store tokens on the
client.

## Authentication flow

```
[Client] → POST /api/auth/login {credentials}
               ↓
[Auth service]
  1. Verify credentials (password hash — see sec-secrets-management)
  2. Generate JWT with a unique JTI (UUID) claim
  3. Return {token, expiresIn}
               ↓
[Client] → sends token on each request: Authorization: Bearer <token>
               ↓
[Auth middleware/filter] (on each protected request)
  1. Extract token from header
  2. Validate signature and expiration
  3. Check that the JTI is not in the blocked-tokens store
  4. Populate the request's security context
```

## Signing and secrets

- **Never hardcode the signing secret** — read it from an environment
  variable or secrets manager (see `sec-secrets-management`).
- HMAC-SHA256 (HS256) with a 256-bit random secret is sufficient for a
  single-service backend. Generate with `openssl rand -hex 32`.
- Use asymmetric signing (RS256/ES256) when multiple services must verify
  tokens without sharing the signing key.
- **Always set an expiration** (default: ≤ 24h; shorter + refresh tokens for
  sensitive systems).

## Logout / revocation — blocklist

Stateless JWTs cannot be invalidated by themselves. To support real logout:

- Store the JTI of revoked tokens in a `blocked_tokens` store
  (`jti`, `expires_at`).
- The auth middleware rejects any token whose JTI is present.
- Purge rows where `expires_at < now()` periodically — the table stays small
  because entries only need to live until the token would expire anyway.

## Client-side token storage

| Option | Survives F5? | Survives tab close? | Recommendation |
|--------|--------------|---------------------|----------------|
| `sessionStorage` | ✅ | ❌ | ✅ Default for SPAs |
| `localStorage` | ✅ | ✅ | ❌ Avoid — exposed to any XSS |
| Memory (variable) | ❌ | ❌ | Very short sessions only |
| `HttpOnly` cookie | ✅ | configurable | ✅ Best for SSR; immune to XSS reads (mind CSRF) |

**Rule:** never `localStorage`. Use `sessionStorage` for SPAs, `HttpOnly` +
`Secure` + `SameSite` cookies for SSR.

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Signing secret in code | Hardcoded secret | Environment variable / secrets manager |
| Token without expiration | Expiration not configured | Always define expiration |
| Logout does not invalidate the token | No revocation mechanism | Implement the JTI blocklist |
| Token in localStorage | XSS exfiltration risk | sessionStorage or HttpOnly cookie |

## Resources

- [examples-java-spring.md](examples-java-spring.md) — Spring Security
  configuration snippet and blocklist SQL schema.
