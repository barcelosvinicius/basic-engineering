# basic-engineering

> Base universal de documentação, agents e skills para projetos de software com GitHub Copilot.

![Versão](https://img.shields.io/badge/versão-v20260511--144605-blue)

## O que é este repositório?

Este repositório contém a **base fundacional** para qualquer projeto de software que utilize
GitHub Copilot como assistente de IA. Inclui:

- 📋 Templates de agents (roles) para cada papel da equipe
- 🛠️ Skills universais reutilizáveis (backend, frontend, QA, infra, processo)
- 📄 Templates de documentação (HISTORICO, CHANGELOG, ADR, onboarding e mais)
- ⚙️ Princípios de engenharia independentes de tecnologia

## Como usar

### 1. Verificar pré-requisitos

- Git ≥ 2.x, curl ou wget
- Conta GitHub

### 2. Copiar a base para seu projeto

```bash
# Clone este repositório (ou baixe o base-atualizacao.zip)
git clone https://github.com/barcelosvinicius/basic-engineering.git

# Copie a pasta base para seu projeto
cp -r basic-engineering/.github/base/ meu-projeto/.github/base/
cp basic-engineering/check-version.sh meu-projeto/check-version.sh
cp basic-engineering/BASE_VERSION meu-projeto/BASE_VERSION
```

### 3. Verificar versão <a name="passo-0"></a>

```bash
cd meu-projeto
bash check-version.sh
```

### 4. Seguir o BOOTSTRAP

Leia `BOOTSTRAP.md` e siga os 7 passos para configurar seu projeto completo.

## Estrutura

```
basic-engineering/
├── BOOTSTRAP.md              — Guia completo de setup (leia primeiro)
├── principios-engenharia.md  — Princípios universais de engenharia
├── BASE_VERSION              — Versão atual da base
├── base-manifest.json        — Metadados e URL de verificação de versão
├── check-version.sh          — Script de verificação de versão
├── copilot-instructions.template.md — Template para copilot-instructions.md
├── roles/                    — 13 templates de agents
├── skills/                   — 16 skills universais
└── docs/                     — 11 templates de documentação
```

## Versão

A versão segue o formato `vYYYYMMDD-HHMMSS`. Consulte `BASE_VERSION` para a versão instalada
e execute `bash check-version.sh` para verificar se há atualizações disponíveis.