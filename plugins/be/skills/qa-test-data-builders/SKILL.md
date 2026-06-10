---
name: qa-test-data-builders
description: >
  Use when writing unit or integration tests that need test data. Centralize
  object creation in fixture builders, follow the AAA pattern (Arrange, Act,
  Assert), and keep data deterministic — avoids repetition and flaky tests.
---

# Skill: Test Data Builders

Patterns for creating consistent and reusable test data using the Builder
pattern. Applies to any language with minor syntax adaptation.

## Principle: centralized test fixtures

Instead of building objects from scratch in every test, centralize them in a
fixture module/class with one factory per entity, plus variation helpers:

```java
// src/test/java/com/example/TestFixtures.java
public final class TestFixtures {
    private TestFixtures() {}  // non-instantiable

    // ✅ Fixture with realistic and deterministic data
    public static User aUser() {
        return User.builder()
            .id(1L)
            .name("Test User")
            .email("user@test.com")
            .password("$hash$fake")
            .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
            .build();
    }

    // Variation: same fixture with one field changed
    public static User aUserWithEmail(String email) {
        return aUser().toBuilder()
            .email(email)
            .build();
    }
}
```

## Usage in tests — AAA pattern

```java
@Test
void findById_existingUser_returnsDTO() {
    // Arrange — use the fixtures
    User user = TestFixtures.aUser();
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));

    // Act
    UserResponse response = userService.findById(1L);

    // Assert
    assertThat(response.email()).isEqualTo("user@test.com");
    assertThat(response.id()).isEqualTo(1L);
}
```

## Naming conventions

```java
// Test names: method_scenario_expectedResult
@Test void create_validData_returns201() { ... }
@Test void create_duplicateEmail_throwsConflictException() { ... }
@Test void findById_nonExistingId_throwsNotFoundException() { ... }
@Test void delete_anotherUsersResource_throwsForbiddenException() { ... }

// Fixture names: indefinite article + entity
public static User aUser() { ... }
public static Order anOrder() { ... }
```

## Rules for reliable tests

- **Deterministic data** — never depend on `now()` or `random()`; use fixed
  dates and `Clock.fixed()` (or the language equivalent) to control time.
- **Never sleep** in tests — synchronize on conditions, not on time.
- **Compare decimals by value**, not representation (e.g., AssertJ
  `isEqualByComparingTo("100.00")` for `BigDecimal`).
- **One main assertion per test** — makes the failing behavior obvious.
- Verify that collaborators were **not** called when they shouldn't be.

## Checklist for new tests

- [ ] Uses centralized fixtures instead of building objects inline
- [ ] Follows the AAA pattern: Arrange / Act / Assert
- [ ] Uses the naming pattern `method_scenario_result`
- [ ] Covers the happy path + at least 1 error case
- [ ] No sleeps — deterministic data and time
- [ ] Verifies unwanted interactions did not happen
