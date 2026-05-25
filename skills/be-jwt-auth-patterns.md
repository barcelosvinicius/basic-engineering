---
name: be-jwt-auth-patterns
description: >
  Padrões universais de autenticação JWT com Spring Security — geração de token,
  filtro de autenticação, blocklist de logout e armazenamento seguro no frontend.
  Usar ao configurar autenticação em qualquer projeto Spring Boot + frontend.
---

# Skill: Autenticação JWT (Universal)

## O que é esta skill

Padrões universais de autenticação JWT para qualquer projeto Spring Boot + frontend.
Usar ao implementar autenticação, configurar Spring Security, ou ao definir onde
e como armazenar tokens no cliente.

---

## Fluxo de autenticação

```
[Cliente] → POST /api/auth/login {credenciais}
               ↓
[AuthService]
  1. Verificar credenciais (hash da senha)
  2. Gerar JWT com JTI único (UUID)
  3. Retornar {token, expiresIn}
               ↓
[Cliente] → injeta token em cada request: Authorization: Bearer <token>
               ↓
[JwtAuthenticationFilter] (em cada request protegida)
  1. Extrair token do header
  2. Validar assinatura e expiração
  3. Verificar se JTI não está na BlockedToken table
  4. Setar SecurityContext
```

---

## Configuração segura

```java
// Nunca hardcode o secret — usar variável de ambiente
@Value("${app.jwt.secret}")
private String jwtSecret;

// HMAC-SHA256 é suficiente para a maioria dos casos
// Para requisitos mais altos: RS256 com par de chaves
private SecretKey signingKey() {
    return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
}
```

```bash
# Gerar segredo seguro (256 bits)
openssl rand -hex 32
```

---

## Estrutura de tabela para blocklist (logout)

```sql
CREATE TABLE blocked_tokens (
    id BIGSERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Índice parcial para performance
CREATE INDEX idx_blocked_tokens_active
    ON blocked_tokens(jti) WHERE expires_at > NOW();

-- Limpeza automática de tokens expirados
DELETE FROM blocked_tokens WHERE expires_at < NOW();
```

---

## Armazenamento de token no cliente

| Opção | Persiste F5? | Persiste fechar aba? | Recomendação |
|-------|-------------|---------------------|-------------|
| `sessionStorage` | ✅ Sim | ❌ Não | ✅ Recomendado |
| `localStorage` | ✅ Sim | ✅ Sim | ❌ Evitar |
| Memória (var) | ❌ Não | ❌ Não | Para sessões muito curtas |
| Cookie `HttpOnly` | ✅ Sim | Depende | ✅ Para SSR |

**Regra:** Use `sessionStorage` para SPAs onde a sessão deve sobreviver a F5
mas não ao fechamento da aba. Nunca `localStorage`.

---

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| JWT_SECRET em código | Hardcode de segredo | Sempre via variável de ambiente |
| Token sem expiração | `expiration()` não configurado | Sempre definir expiração (padrão: 24h) |
| Logout não invalida token | Sem blocklist | Implementar BlockedToken table |
| Token em localStorage | Risco de XSS | Migrar para sessionStorage ou HttpOnly cookie |

---

*Template universal — `.github/base/skills/be-jwt-auth-patterns.md`*
