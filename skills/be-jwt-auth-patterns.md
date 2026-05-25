---
name: be-jwt-auth-patterns
description: >
  Universal JWT authentication patterns with Spring Security — token generation,
  authentication filter, logout blocklist, and secure frontend storage.
  Use when configuring authentication in any Spring Boot + frontend project.
---

# Skill: JWT Authentication (Universal)

## What this skill is

Universal JWT authentication patterns for any Spring Boot + frontend project.
Use when implementing authentication, configuring Spring Security, or deciding where
and how to store tokens on the client.

---

## Authentication flow

```
[Client] → POST /api/auth/login {credentials}
               ↓
[AuthService]
  1. Verify credentials (password hash)
  2. Generate JWT with unique JTI (UUID)
  3. Return {token, expiresIn}
               ↓
[Client] → injects token into each request: Authorization: Bearer <token>
               ↓
[JwtAuthenticationFilter] (on each protected request)
  1. Extract token from header
  2. Validate signature and expiration
  3. Check whether JTI is not in the BlockedToken table
  4. Set SecurityContext
```

---

## Secure configuration

```java
// Never hardcode the secret — use an environment variable
@Value("${app.jwt.secret}")
private String jwtSecret;

// HMAC-SHA256 is sufficient for most cases
// For higher requirements: RS256 with a key pair
private SecretKey signingKey() {
    return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
}
```

```bash
# Generate a secure secret (256 bits)
openssl rand -hex 32
```

---

## Table structure for blocklist (logout)

```sql
CREATE TABLE blocked_tokens (
    id BIGSERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Partial index for performance
CREATE INDEX idx_blocked_tokens_active
    ON blocked_tokens(jti) WHERE expires_at > NOW();

-- Automatic cleanup of expired tokens
DELETE FROM blocked_tokens WHERE expires_at < NOW();
```

---

## Client-side token storage

| Option | Persists after F5? | Persists after tab close? | Recommendation |
|--------|--------------------|---------------------------|----------------|
| `sessionStorage` | ✅ Yes | ❌ No | ✅ Recommended |
| `localStorage` | ✅ Yes | ✅ Yes | ❌ Avoid |
| Memory (var) | ❌ No | ❌ No | For very short sessions |
| `HttpOnly` cookie | ✅ Yes | Depends | ✅ For SSR |

**Rule:** Use `sessionStorage` for SPAs where the session should survive F5
but not tab close. Never `localStorage`.

---

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| JWT_SECRET in code | Secret hardcoded | Always use an environment variable |
| Token without expiration | `expiration()` not configured | Always define expiration (default: 24h) |
| Logout does not invalidate token | No blocklist | Implement BlockedToken table |
| Token in localStorage | XSS risk | Move to sessionStorage or HttpOnly cookie |

---

*Universal template — `.github/base/skills/be-jwt-auth-patterns.md`*
