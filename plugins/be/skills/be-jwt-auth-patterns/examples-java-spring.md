# JWT examples — Java / Spring Security + PostgreSQL

Supporting material for the `be-jwt-auth-patterns` skill.

## Secure configuration (Spring)

```java
// Never hardcode the secret — use an environment variable
@Value("${app.jwt.secret}")
private String jwtSecret;

// HMAC-SHA256 is sufficient for most single-service cases
// For multi-service verification: RS256 with a key pair
private SecretKey signingKey() {
    return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
}
```

```bash
# Generate a secure secret (256 bits)
openssl rand -hex 32
```

## Blocklist schema (PostgreSQL)

```sql
CREATE TABLE blocked_tokens (
    id BIGSERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Partial index for performance
CREATE INDEX idx_blocked_tokens_active
    ON blocked_tokens(jti) WHERE expires_at > NOW();

-- Periodic cleanup of expired entries
DELETE FROM blocked_tokens WHERE expires_at < NOW();
```

## Filter chain placement

In Spring Security, register the JWT filter before
`UsernamePasswordAuthenticationFilter`:

```java
http.addFilterBefore(jwtAuthenticationFilter,
        UsernamePasswordAuthenticationFilter.class);
```
