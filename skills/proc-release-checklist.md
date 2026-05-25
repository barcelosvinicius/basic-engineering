---
name: proc-release-checklist
description: >
  Protocolo de validação pré-go-live universal — segurança, testes, banco de dados,
  observabilidade e plano de rollback. Usar obrigatoriamente antes de qualquer entrega
  em produção, primeiro deploy ou release com mudanças de schema.
---

# Skill: Checklist de Release (Pré-Go-Live)

## O que é esta skill

Protocolo de validação antes de qualquer entrega em produção — primeiro deploy ou
nova versão significativa. Universal: adaptar as seções ao contexto do projeto.

> **Princípio:** Um checklist de release não é burocracia. É a última linha de
> defesa antes que um problema chegue ao usuário real.

---

## Quando usar

- Primeiro deploy em produção de um projeto
- Release com mudanças de schema de banco
- Release com mudanças em autenticação ou segurança
- Release com novos endpoints expostos publicamente
- Qualquer release após período de inatividade > 2 semanas

Para releases incrementais pequenos (hotfix, ajuste visual), um subconjunto das
seções abaixo é suficiente.

---

## 1. Segurança — obrigatório antes de qualquer release público

- [ ] **Senhas com hash seguro**: Argon2id ou bcrypt com parâmetros adequados
- [ ] **JWT/tokens**: expiração configurada, revogação implementada, secret forte (≥ 256 bits)
- [ ] **Variáveis de ambiente**: todos os segredos em env, nenhum hardcoded no código
- [ ] **Headers HTTP**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options configurados
- [ ] **CORS**: origens explícitas configuradas (sem wildcard `*` em APIs com credenciais)
- [ ] **Rate limiting**: endpoints de autenticação e endpoints públicos protegidos
- [ ] **Upload de arquivos**: validação de magic bytes ativa antes de processamento
- [ ] **SQL**: confirmação de queries parametrizadas (sem concatenação de input)
- [ ] **Auditoria de dependências**: sem CVEs críticos ou altos abertos (`npm audit`, `mvn dependency-check`)
- [ ] **Pentest mínimo**: IDOR testado, brute force testado, token pós-logout testado

---

## 2. Banco de dados

- [ ] **Migrations versionadas**: todas as alterações de schema estão em migrations Flyway/Liquibase
- [ ] **Backup validado**: backup recente testado (restore verificado, não apenas snapshot)
- [ ] **Índices criados**: queries do dashboard/relatórios verificadas com EXPLAIN
- [ ] **Rollback planejado**: estratégia de rollback documentada se a migration for destrutiva
- [ ] **RLS / isolamento**: se sistema multi-usuário, isolamento de dados validado

---

## 3. Backend / API

- [ ] **Health check**: endpoint `/health` ou equivalente funcionando e monitorado
- [ ] **Variáveis obrigatórias**: inicialização falha claramente se variável obrigatória falta
- [ ] **Timeouts**: chamadas externas com timeout explícito configurado
- [ ] **Tratamento de erros**: GlobalExceptionHandler não expõe stack trace ao cliente
- [ ] **Logs**: estruturado, sem PII, sem segredos; correlation ID por request
- [ ] **Paginação**: endpoints de lista não retornam todos os registros sem paginação

---

## 4. Frontend

- [ ] **Variáveis de ambiente**: URLs de API não hardcodadas; arquivo de env configurado
- [ ] **Build de produção**: build com minificação e tree-shaking ativo
- [ ] **Lazy loading**: bundle inicial não carrega todos os módulos
- [ ] **Erros de console**: zero erros no console em fluxo normal de uso
- [ ] **Fluxo sem JS**: página de fallback ou mensagem adequada se JS desabilitado
- [ ] **Acessibilidade**: axe/Lighthouse sem erros críticos nos fluxos principais

---

## 5. Observabilidade

- [ ] **Alertas configurados**: alerta para taxa de erro acima do baseline
- [ ] **Dashboard de métricas**: latência, taxa de erro, throughput visíveis
- [ ] **Runbook**: documento descrevendo o que fazer se o sistema ficar indisponível
- [ ] **Contato de plantão**: quem acionar se houver incidente fora do horário comercial

---

## 6. Processo

- [ ] **REQUISITOS.md**: RFs implementados neste release marcados como ✅
- [ ] **analise-estrutural.md**: pendências novas descobertas durante o release registradas
- [ ] **HISTORICO.md**: entrada de release criada com o que foi entregue e decisões tomadas
- [ ] **Documentação de usuário**: COMO_USAR.md atualizado com novas funcionalidades (se aplicável)
- [ ] **Janela de manutenção**: usuários notificados se houver downtime esperado
- [ ] **Plano de rollback**: procedimento documentado caso o release precise ser revertido

---

## 7. Validação pós-deploy (primeiros 30 minutos)

```
□ Aplicação responde (health check verde)
□ Login funciona
□ Fluxo crítico principal (ex: criar transação, importar CSV) funciona
□ Logs sem erros críticos inesperados
□ Métricas de latência dentro do baseline
□ Nenhum usuário reportou problema nos primeiros acessos
```

---

## Formato de registro do release

Adicionar ao `HISTORICO.md`:

```markdown
### [AAAA-MM-DD] Release [versão ou descrição]

**Responsável:** [nome]
**Entregas:**
- [RF-XX] [descrição da feature]
- [fix] [descrição do bug corrigido]

**Checklist de release:** ✅ Completo | ⚠️ Pendências: [listar]
**Decisões:** [decisões tomadas durante o release]
**Próximos passos:** [o que monitorar nas próximas horas/dias]
**Bloqueios:** Nenhum
```

---

*Skill — `.github/skills/proc-release-checklist.md`*
*Referência: `principios-engenharia.md` §2 (Segurança), §9 (Observabilidade), §10 (CI/CD)*
