---
name: proc-changelog
description: >
  Processo para gerar e manter o CHANGELOG.md a partir de commits Conventional Commits.
  Usar ao preparar uma release, criar release notes, gerar atualizações para usuários
  ou fechar uma sprint com entregáveis.
---

# Skill: Geração de Changelog

## O que é esta skill

Define o processo de manutenção do `CHANGELOG.md` seguindo o padrão
[Keep a Changelog](https://keepachangelog.com) com Conventional Commits.
Usar ao preparar releases, criar notas de versão ou documentar mudanças para usuários.

---

## Formato do CHANGELOG.md

```markdown
# Changelog

Todas as mudanças notáveis neste projeto estão documentadas aqui.
Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)

## [Não lançado]

### Adicionado
- Funcionalidades novas ainda não em produção

---

## [1.2.0] — 2026-04-15

### Adicionado
- RF-25: Importação de CSV do Nubank com detecção de duplicatas
- RF-26: Validação de tipo de arquivo por magic bytes

### Modificado
- Dashboard agora exibe reserva de emergência em destaque
- Performance do endpoint /api/v1/transactions melhorada (índice adicionado)

### Corrigido
- Bug #47: comprometimento exibia NaN quando receita era zero
- Timeout em importações de CSV com mais de 500 linhas

### Segurança
- Atualização de JJWT 0.12.3 → 0.12.6 (CVE-2024-XXXX)

---

## [1.1.0] — 2026-03-01
...
```

---

## Mapeamento Conventional Commits → seções

| Tipo de commit | Seção no changelog | Incluir? |
|---------------|-------------------|---------|
| `feat:` | **Adicionado** | ✅ Sempre |
| `fix:` | **Corrigido** | ✅ Sempre |
| `perf:` | **Modificado** | ✅ Sempre |
| `refactor:` | **Modificado** | ⚠️ Se afeta comportamento observável |
| `security:` ou `fix(security):` | **Segurança** | ✅ Sempre |
| `docs:` | — | ❌ Não incluir |
| `test:` | — | ❌ Não incluir |
| `chore:` | — | ❌ Não incluir (exceto deps) |
| `chore(deps):` ou Dependabot | **Segurança** | ✅ Se CVE corrigido |
| `ci:` | — | ❌ Não incluir |

---

## Como gerar changelog de commits git

```bash
# Ver commits desde a última tag
git log v1.1.0..HEAD --oneline --no-merges

# Formato mais detalhado
git log v1.1.0..HEAD \
  --pretty=format:"- %s (%h)" \
  --no-merges \
  | grep -E "^- (feat|fix|perf|refactor|security)"

# Ver todas as tags existentes
git tag --sort=-version:refname | head -10
```

---

## Processo de release — passo a passo

```
1. Criar seção [x.y.z] acima de [Não lançado]
   └── Mover itens de [Não lançado] para a nova seção

2. Filtrar: incluir apenas feat, fix, perf, security
   └── Traduzir para linguagem de usuário (não técnica)

3. Ordenar dentro de cada seção: impacto → estabilidade → segurança
   └── Mais impactante para o usuário vem primeiro

4. Revisar: cada linha deve responder "o que o usuário pode fazer agora?"
   └── ❌ "refatora TransactionService para usar Strategy pattern"
   └── ✅ "Categorização de transações agora 30% mais rápida"

5. Commitar junto com o código da release
   └── git commit -m "chore(release): v1.2.0 — changelog e bump de versão"
```

---

## Versionamento semântico (SemVer)

```
MAJOR.MINOR.PATCH

MAJOR: quebra compatibilidade (ex: mudar endpoint, remover campo da API)
MINOR: nova funcionalidade sem quebrar (ex: novo endpoint, novo relatório)
PATCH: correção de bug ou vulnerabilidade sem nova funcionalidade
```

Para projetos em fase de desenvolvimento ativo (antes de produção estável):
- Usar `0.x.y` — MINOR para features, PATCH para fixes
- Promover para `1.0.0` no primeiro deploy estável em produção

---

## Escrita orientada ao usuário

```
❌ Técnico (não incluir no changelog público):
"Adiciona índice composto (date, user_id) na tabela transactions"
"Refatora GlobalExceptionHandler para usar ProblemDetail"

✅ Orientado ao usuário:
"Carregamento do histórico de transações até 3x mais rápido"
"Mensagens de erro agora indicam o campo específico com problema"
```

---

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Changelog desatualizado | Não atualizado na hora do merge | Atualizar `[Não lançado]` em cada PR de feat/fix |
| Itens técnicos demais | Copiar commits sem filtrar | Filtrar para feat, fix, perf, security e traduzir |
| Sem data nas versões | Data do release não registrada | Sempre incluir data no formato AAAA-MM-DD |
| Versão duplicada | Erro de numeração | Verificar tags git antes de criar nova seção |

---

*Skill — `.github/skills/proc-changelog.md`*
*Referência: [Keep a Changelog](https://keepachangelog.com) · [SemVer](https://semver.org)*
