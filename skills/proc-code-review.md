---
name: proc-code-review
description: >
  Protocolo estruturado de revisão de código entre agentes e humanos — checklist por
  camada, critérios de aprovação/rejeição e responsabilidade por agente. Usar ao revisar
  um PR ou ao implementar um gate de qualidade antes de merge.
---

# Skill: Protocolo de Revisão de Código

## O que é esta skill

Define o protocolo estruturado de revisão de código entre agentes e humanos.
Use ao revisar um PR, ao solicitar revisão de outro agente, ou ao implementar
um gate de qualidade antes de merge.

> **Princípio:** Code review não é auditoria de estilo. É o momento de capturar
> o que o autor não consegue ver por estar muito próximo do código.

---

## Responsabilidade por tipo de mudança

| Tipo de mudança | Revisor primário | Revisor adicional |
|----------------|-----------------|-------------------|
| Novo endpoint ou DTO | `backend-developer` | `security-reviewer` |
| Mudança em autenticação/autorização | `security-reviewer` | `qa-engineer` |
| Novo componente de interface | `frontend-developer` | QA (se houver E2E) |
| Mudança em cálculo de negócio | `backend-developer` | `domain-expert` |
| Query JPQL/SQL complexa | `backend-developer` | `data-analyst` |
| Migration de banco | `backend-developer` | PM (confirmar janela) |
| Upload ou processamento de arquivo | `security-reviewer` | `backend-developer` |
| Feature completa (backend + frontend) | `project-manager` coordena | Todos os anteriores |

---

## O que revisar — por camada

### Backend

**Correção:**
- [ ] A lógica implementada corresponde ao requisito (RF-XX)?
- [ ] Casos de borda tratados (nulo, vazio, valor zero, overflow)?
- [ ] Transações de banco corretas (readOnly em leituras, rollback em falhas)?
- [ ] N+1 evitado (queries em batch, sem loop de selects)?

**Segurança:**
- [ ] Endpoint novo mapeado no SecurityConfig (público ou protegido)?
- [ ] Autorização verificada no servidor, não apenas no cliente?
- [ ] Input validado antes de uso (Bean Validation, sanitização)?
- [ ] Entidade JPA não retornada diretamente (usar DTO)?
- [ ] Segredos fora do código?

**Qualidade:**
- [ ] Injeção por construtor (não `@Autowired` em campo)?
- [ ] Exceções customizadas lançadas (não exceções genéricas)?
- [ ] Testes unitários cobrindo o novo comportamento?
- [ ] Migration Flyway criada se schema foi alterado?

### Frontend

**Correção:**
- [ ] Componente consome a API corretamente (tipagem, tratamento de erro)?
- [ ] Estado de loading presente para operações assíncronas?
- [ ] Estado vazio tratado para listas?

**UX (ver `fe-ux-patterns.md`):**
- [ ] Feedback visual após ações (toast, disable de botão)?
- [ ] Confirmação antes de ações destrutivas?
- [ ] Hierarquia visual clara (o que é mais importante está em destaque)?

**Acessibilidade (ver `fe-accessibility-patterns.md`):**
- [ ] Elements interativos com tags semânticas?
- [ ] Inputs com labels associados?
- [ ] Focus visível em todos os elementos interativos?

**Performance:**
- [ ] Instâncias de gráficos destruídas no OnDestroy?
- [ ] Subscriptions canceladas no OnDestroy?
- [ ] Debounce em campos de busca?

### Geral

- [ ] Nenhum `console.log` / `println` de dados sensíveis?
- [ ] Nomenclatura consistente com o restante do sistema?
- [ ] PR referencia a issue com `Closes #N`?
- [ ] Docs atualizados se houve decisão arquitetural?

---

## Como dar feedback de revisão

### Tom e estrutura

```
❌ "Isso está errado."

✅ "Este método pode gerar N+1 quando `transactions` tem muitos registros.
   Considerar usar @Query com JOIN FETCH ou busca em batch.
   Ref: principios-engenharia.md §4.3"
```

**Categorias de comentário:**
- `[BLOQUEANTE]` — não pode mergear sem resolver
- `[SUGESTÃO]` — melhoria, não obrigatória para este PR
- `[PERGUNTA]` — entender a intenção antes de julgar
- `[ELOGIO]` — reconhecer boas práticas encontradas

### O que NÃO é responsabilidade do review

- Estilo de código coberto por linter (deixar para automação)
- Preferências pessoais sem justificativa técnica
- Nitpicks em código que será refatorado no próximo sprint

---

## Protocolo de delegação entre agentes

Quando um agente identificar algo fora de sua área durante revisão:

```
backend-developer revisa PR → encontra componente Angular com XSS potential
→ Acionar security-reviewer: "Linha 42 de transaction-list.component.html
  usa innerHTML sem sanitização. Ver OWASP A03."

security-reviewer revisa PR → encontra cálculo de comprometimento incorreto
→ Acionar domain-expert: "Fórmula em DashboardService.calcComprometimento()
  divide gastos por receita_bruta. Confirmar se deve ser receita_liquida."
```

---

## Gates automáticos antes de merge

```yaml
# O que deve estar verde antes de qualquer merge:
- Build: sem erros de compilação
- Testes: todos passando (cobertura ≥ meta do projeto)
- Linter: sem erros (warnings toleráveis)
- Análise estática: sem issues críticos
- Security scan: sem CVEs críticos/altos não mitigados
- 1 aprovação humana: obrigatório (agentes não aprovam para merge)
```

---

*Skill — `.github/skills/proc-code-review.md`*
*Referência: `principios-engenharia.md` §10.2 (Proteção de Branch), §11.3 (Checklist)*
