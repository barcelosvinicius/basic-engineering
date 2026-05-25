# Como Contribuir — [PROJETO]

> Obrigado por querer contribuir! Leia este guia antes de abrir um PR.

## Configuração do ambiente

<!-- CUSTOMIZAR -->
```bash
# Pré-requisitos
[listar: Node.js, Java, Docker, etc.]

# Setup
git clone [url]
cd [projeto]
cp .env.example .env
# Preencher .env com valores de desenvolvimento

# Iniciar ambiente
[comando para subir o stack]
```

## Fluxo de contribuição

```
1. Abrir issue descrevendo a mudança
2. Aguardar discussão e aprovação (para mudanças grandes)
3. Criar branch: git checkout -b feature/RF-XX-descricao
4. Implementar e escrever testes
5. Garantir que CI passa localmente
6. Abrir PR usando o template
7. Aguardar code review
8. Incorporar feedback e fazer merge
```

## Padrões de commit (Conventional Commits)

```
feat(escopo): adiciona funcionalidade X
fix(escopo): corrige bug Y
docs(escopo): atualiza documentação Z
test(escopo): adiciona testes para W
refactor(escopo): extrai lógica de V para service
chore(deps): atualiza dependência X para v2.0
ci: adiciona step de cobertura no pipeline
```

## Critérios de aceite de PR

- [ ] Testes passando (CI verde)
- [ ] Cobertura de código ≥ meta do projeto
- [ ] Sem novos warnings de lint
- [ ] Documentação atualizada se necessário
- [ ] Template de PR preenchido
- [ ] Ao menos 1 aprovação de reviewer

## Reportando bugs

Usar o template de bug report em `.github/ISSUE_TEMPLATE/bug-report.yml`.

Incluir obrigatoriamente:
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots ou logs relevantes
- Versão do sistema

## Código de conduta

<!-- CUSTOMIZAR -->
Este projeto adota um ambiente respeitoso e colaborativo.
Feedback técnico construtivo é sempre bem-vindo.
Comportamento desrespeitoso não será tolerado.
