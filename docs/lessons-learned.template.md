# Lições Aprendidas — [PROJETO]

> Registro de erros, descobertas e decisões técnicas importantes de cada sessão.
> Formato: **Contexto → Problema → Regra**. Cada entrada é imutável — lições
> superadas são marcadas como ✅, nunca deletadas.
>
> Referência: `principios-engenharia.md` §11.2 (Documentação como Código) e §11.4 (PCS).

---

## Como usar este arquivo

- **Quando registrar:** após qualquer sessão em que um erro foi cometido, uma decisão
  importante foi tomada, ou um padrão foi descoberto que evitaria retrabalho futuro.
- **Quando consultar:** no início de cada sessão (via `proc-session-continuity`), antes
  de aplicar qualquer padrão numa área que já teve problemas antes.
- **Formato obrigatório por entrada:**

```
### [Mês/Ano] Título curto e descritivo

**Contexto:** O que estava sendo feito quando o problema foi encontrado.
**Problema:** O que deu errado ou o que foi descoberto. Ser específico — 
  incluir sintoma, comportamento observado, e como reproduzir se relevante.
**Regra:** O que fazer (ou não fazer) no futuro. Incluir exemplo de código
  correto/incorreto quando aplicável.
**Referência:** §X.X de `principios-engenharia.md` ou arquivo relacionado.
```

- **Agrupamento:** quando o arquivo crescer, agrupar por categoria:
  `## Backend`, `## Frontend`, `## Banco de Dados`, `## Segurança`, `## Processo`

---

<!-- 
EXEMPLO — remova este bloco e substitua por lições reais do projeto

### [Mês/Ano] Título da lição

**Contexto:** Descrição do que estava sendo implementado.
**Problema:** O que deu errado, sintoma observado, como reproduzir.
**Regra:** 
```
// ✅ Correto
[código ou instrução correta]

// ❌ Errado — e por quê
[código ou instrução incorreta]
```
**Referência:** §X.X de `principios-engenharia.md`
-->

---

*Última atualização: [AAAA-MM-DD] · Referência: `principios-engenharia.md` §11.2, §11.4*
