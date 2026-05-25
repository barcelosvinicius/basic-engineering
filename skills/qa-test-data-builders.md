---
name: qa-test-data-builders
description: >
  Universal patterns for creating consistent test data with the Builder pattern.
  Use when writing unit and integration tests — centralize builders in TestFixtures
  to avoid repetition and make tests readable with the AAA pattern.
---

# Skill: Test Data Builders (Universal)

## What this skill is

Patterns for creating consistent and reusable test data using the Builder pattern.
Use when writing unit or integration tests — it avoids repetition and makes tests
readable with the AAA pattern (Arrange, Act, Assert).

---

## Principle: centralized TestFixtures

Instead of building objects from scratch in every test, centralize them in a fixture class:

```java
// src/test/java/com/exemplo/TestFixtures.java
public final class TestFixtures {
    private TestFixtures() {}  // non-instantiable

    // ✅ Fixture with realistic and deterministic data
    public static User umUsuario() {
        return User.builder()
            .id(1L)
            .name("Test User")
            .email("user@test.com")
            .password("$hash$fake")
            .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
            .build();
    }

    // Variation: fixture with a specific field changed
    public static User umUsuarioComEmail(String email) {
        return umUsuario().toBuilder()
            .email(email)
            .build();
    }
}
```

---

## Usage in tests — AAA pattern

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private UserService userService;

    @Test
    void findById_existingUser_returnsDTO() {
        // Arrange — use TestFixtures
        User user = TestFixtures.umUsuario();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Act
        UserResponse response = userService.findById(1L);

        // Assert
        assertThat(response.email()).isEqualTo("user@test.com");
        assertThat(response.id()).isEqualTo(1L);
    }
}
```

---

## Naming conventions

```java
// Pattern: testMethod_scenario_expectedResult
@Test void create_validData_returns201() { ... }
@Test void create_duplicateEmail_throwsConflictException() { ... }
@Test void findById_nonExistingId_throwsNotFoundException() { ... }
@Test void delete_anotherUsersResource_throwsForbiddenException() { ... }

// Fixtures in Portuguese: "um/uma" + entity (PT-BR readability)
public static User umUsuario() { ... }
public static Order umPedido() { ... }
```

---

## Rules for reliable tests

```java
// ✅ Deterministic data (does not depend on now() or random())
.createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))  // fixed date

// ✅ For BigDecimal: isEqualByComparingTo (not isEqualTo)
assertThat(result.amount()).isEqualByComparingTo("100.00");

// ❌ Never Thread.sleep() in tests
// ✅ Use Clock.fixed() to control time

// ✅ One main assert per test
// (makes it easier to identify which assertion failed)
```

---

## Checklist for new tests

- [ ] Uses TestFixtures instead of building objects inline
- [ ] Follows the AAA pattern: Arrange / Act / Assert
- [ ] Uses the naming pattern `method_scenario_result`
- [ ] Covers the happy path + at least 1 error case
- [ ] Does not use `Thread.sleep()` — deterministic data
- [ ] Uses `verify()` to confirm repositories were not called unnecessarily

---

*Universal template — `.github/base/skills/qa-test-data-builders.md`*
