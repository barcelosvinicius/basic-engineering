# Doc-comment formats by language

Supporting material for the `proc-code-documentation` skill. Document the
**why**, the contract (params/return/throws), units, and side effects — not
the obvious mechanics.

## TypeScript / JavaScript — TSDoc / JSDoc

```ts
/**
 * Computes the income-commitment ratio for a user.
 *
 * @param expenses - Total monthly expenses, in cents (non-negative).
 * @param netIncome - Monthly net income, in cents (must be > 0).
 * @returns Ratio in [0, 1]; clamped at 1 when expenses exceed income.
 * @throws {ValidationError} If `netIncome` is zero or negative.
 */
export function commitmentRatio(expenses: number, netIncome: number): number {
  // ...
}
```

## Java — Javadoc

```java
/**
 * Revokes a JWT by storing its JTI in the blocklist until expiry.
 *
 * @param jti        the token's unique identifier (UUID)
 * @param expiresAt  when the token would naturally expire; the row is
 *                   purged after this instant
 * @throws ConflictException if the JTI is already revoked
 */
public void revoke(String jti, Instant expiresAt) {
    // ...
}
```

## Python — docstrings (PEP 257)

```python
def commitment_ratio(expenses: int, net_income: int) -> float:
    """Compute the income-commitment ratio.

    Args:
        expenses: Total monthly expenses, in cents (>= 0).
        net_income: Monthly net income, in cents (> 0).

    Returns:
        Ratio in [0, 1]; clamped at 1 when expenses exceed income.

    Raises:
        ValueError: If ``net_income`` is not positive.
    """
    ...
```

## Go — doc comments (start with the identifier name)

```go
// RevokeToken stores the token's JTI in the blocklist until expiresAt,
// after which the entry is purged. It returns ErrAlreadyRevoked if the
// JTI is already present.
func RevokeToken(jti string, expiresAt time.Time) error {
    // ...
}
```

## C# — XML doc comments

```csharp
/// <summary>Revokes a JWT by adding its JTI to the blocklist.</summary>
/// <param name="jti">The token's unique identifier (GUID).</param>
/// <param name="expiresAt">Instant after which the entry is purged.</param>
/// <exception cref="ConflictException">If the JTI is already revoked.</exception>
public void Revoke(string jti, DateTimeOffset expiresAt) { /* ... */ }
```

## Notes

- Tools generate API docs from these formats — keep the contract accurate.
- Don't document private helpers unless the *why* is non-obvious; their names
  and small size should carry the meaning.
- Units and nullability that the type can't express are the highest-value
  thing to write down.
