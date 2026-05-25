---
name: qa-test-data-builders
description: >
  Padrões universais para criar dados de teste consistentes com o Builder pattern.
  Usar ao escrever testes unitários e de integração — centraliza builders em TestFixtures
  para evitar repetição e tornar os testes legíveis com padrão AAA.
---

# Skill: Builders de Dados de Teste (Universal)

## O que é esta skill

Padrões para criar dados de teste consistentes e reutilizáveis usando o Builder pattern.
Usar ao escrever testes unitários ou de integração — evita repetição e torna os testes
legíveis com padrão AAA (Arrange, Act, Assert).

---

## Princípio: TestFixtures centralizados

Em vez de construir objetos do zero em cada teste, centralizar em uma classe de fixtures:

```java
// src/test/java/com/exemplo/TestFixtures.java
public final class TestFixtures {
    private TestFixtures() {}  // não instanciável

    // ✅ Fixture com dados realistas e determinísticos
    public static User umUsuario() {
        return User.builder()
            .id(1L)
            .name("Usuário de Teste")
            .email("usuario@test.com")
            .password("$hash$fake")
            .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
            .build();
    }

    // Variação: fixture com campo específico alterado
    public static User umUsuarioComEmail(String email) {
        return umUsuario().toBuilder()
            .email(email)
            .build();
    }
}
```

---

## Uso nos testes — padrão AAA

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private UserService userService;

    @Test
    void findById_usuarioExistente_retornaDTO() {
        // Arrange — usar TestFixtures
        User user = TestFixtures.umUsuario();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Act
        UserResponse response = userService.findById(1L);

        // Assert
        assertThat(response.email()).isEqualTo("usuario@test.com");
        assertThat(response.id()).isEqualTo(1L);
    }
}
```

---

## Convenções de nomenclatura

```java
// Padrão: metodoDeTeste_cenario_resultadoEsperado
@Test void create_dadosValidos_retorna201() { ... }
@Test void create_emailDuplicado_lancaConflictException() { ... }
@Test void findById_idInexistente_lancaNotFoundException() { ... }
@Test void delete_recursoDeOutroUsuario_lancaForbiddenException() { ... }

// Fixtures em português: "um/uma" + entidade (legibilidade em PT-BR)
public static User umUsuario() { ... }
public static Order umPedido() { ... }
```

---

## Regras para testes confiáveis

```java
// ✅ Dados determinísticos (não dependem de now() ou random())
.createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))  // data fixa

// ✅ Para BigDecimal: isEqualByComparingTo (não isEqualTo)
assertThat(result.amount()).isEqualByComparingTo("100.00");

// ❌ Nunca Thread.sleep() em testes
// ✅ Usar Clock.fixed() para controlar tempo

// ✅ Um assert principal por teste
// (facilita identificar qual assertion falhou)
```

---

## Checklist para novos testes

- [ ] Usa TestFixtures em vez de construir objetos inline
- [ ] Segue o padrão AAA: Arrange / Act / Assert
- [ ] Usa o padrão de nomenclatura `metodo_cenario_resultado`
- [ ] Cobre o happy path + pelo menos 1 caso de erro
- [ ] Não usa `Thread.sleep()` — dados determinísticos
- [ ] `verify()` para confirmar que repositories não foram chamados desnecessariamente

---

*Template universal — `.github/base/skills/qa-test-data-builders.md`*
