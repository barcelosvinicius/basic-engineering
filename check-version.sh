#!/usr/bin/env bash
# check-version.sh — Verifica se a versão local da base está atualizada
#
# Uso:
#   bash check-version.sh
#   bash check-version.sh --silent   # sem mensagens, apenas código de saída
#
# Códigos de saída:
#   0 — versão local está atualizada
#   1 — versão local está desatualizada (atualização disponível)
#   2 — não foi possível verificar a versão remota

set -euo pipefail

# ── Configuração ────────────────────────────────────────────────────────────
REPO_OWNER="barcelosvinicius"
REPO_NAME="basic-engineering"
BRANCH="main"
REMOTE_VERSION_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/BASE_VERSION"
LOCAL_VERSION_FILE="$(dirname "$0")/BASE_VERSION"
SILENT=false

# ── Argumentos ──────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --silent|-s) SILENT=true ;;
  esac
done

log() {
  $SILENT || echo "$*"
}

# ── Leitura da versão local ──────────────────────────────────────────────────
if [[ ! -f "$LOCAL_VERSION_FILE" ]]; then
  log "❌  Arquivo BASE_VERSION não encontrado em: $LOCAL_VERSION_FILE"
  log "    Certifique-se de executar este script na raiz da base copiada."
  exit 2
fi

LOCAL_VERSION=$(tr -d '[:space:]' < "$LOCAL_VERSION_FILE")

# ── Leitura da versão remota ─────────────────────────────────────────────────
if command -v curl &>/dev/null; then
  REMOTE_VERSION=$(curl -fsSL "$REMOTE_VERSION_URL" 2>/dev/null | tr -d '[:space:]') || true
elif command -v wget &>/dev/null; then
  REMOTE_VERSION=$(wget -qO- "$REMOTE_VERSION_URL" 2>/dev/null | tr -d '[:space:]') || true
else
  log "⚠️  Nem curl nem wget estão disponíveis."
  log "   Instale curl ou wget para verificar a versão remota."
  exit 2
fi

if [[ -z "$REMOTE_VERSION" ]]; then
  log "⚠️  Não foi possível obter a versão remota."
  log "   Verifique sua conexão com a internet e tente novamente."
  exit 2
fi

# ── Comparação ───────────────────────────────────────────────────────────────
# O formato é vYYYYMMDD-HHMMSS — comparação lexicográfica funciona corretamente.

log ""
log "┌─────────────────────────────────────────────────┐"
log "│         basic-engineering — Verificação         │"
log "└─────────────────────────────────────────────────┘"
log "  Versão local  : $LOCAL_VERSION"
log "  Versão remota : $REMOTE_VERSION"
log ""

if [[ "$LOCAL_VERSION" == "$REMOTE_VERSION" ]]; then
  log "✅  Sua base está atualizada."
  exit 0
elif [[ "$LOCAL_VERSION" < "$REMOTE_VERSION" ]]; then
  log "🔄  Atualização disponível!"
  log ""
  log "  Para atualizar, siga o Passo 0 do BOOTSTRAP.md:"
  log "  https://github.com/${REPO_OWNER}/${REPO_NAME}#passo-0"
  log ""
  exit 1
else
  log "ℹ️  Versão local ($LOCAL_VERSION) é mais recente que a remota ($REMOTE_VERSION)."
  log "   Isso pode ocorrer em ambientes de desenvolvimento/preview."
  exit 0
fi
