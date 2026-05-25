#!/usr/bin/env bash
# check-version.sh — Checks whether the local base version is up to date
#
# Usage:
#   bash check-version.sh
#   bash check-version.sh --silent   # no messages, exit code only
#
# Exit codes:
#   0 — local version is up to date
#   1 — local version is outdated (update available)
#   2 — remote version could not be checked

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
REPO_OWNER="barcelosvinicius"
REPO_NAME="basic-engineering"
BRANCH="main"
REMOTE_VERSION_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/BASE_VERSION"
LOCAL_VERSION_FILE="$(dirname "$0")/BASE_VERSION"
SILENT=false

# ── Arguments ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --silent|-s) SILENT=true ;;
  esac
done

log() {
  $SILENT || echo "$*"
}

# ── Read local version ───────────────────────────────────────────────────────
if [[ ! -f "$LOCAL_VERSION_FILE" ]]; then
  log "❌  BASE_VERSION file not found at: $LOCAL_VERSION_FILE"
  log "    Make sure to run this script from the root of the copied base."
  exit 2
fi

LOCAL_VERSION=$(tr -d '[:space:]' < "$LOCAL_VERSION_FILE")

# ── Read remote version ──────────────────────────────────────────────────────
if command -v curl &>/dev/null; then
  REMOTE_VERSION=$(curl -fsSL "$REMOTE_VERSION_URL" 2>/dev/null | tr -d '[:space:]') || true
elif command -v wget &>/dev/null; then
  REMOTE_VERSION=$(wget -qO- "$REMOTE_VERSION_URL" 2>/dev/null | tr -d '[:space:]') || true
else
  log "⚠️  Neither curl nor wget is available."
  log "   Install curl or wget to check the remote version."
  exit 2
fi

if [[ -z "$REMOTE_VERSION" ]]; then
  log "⚠️  Could not fetch the remote version."
  log "   Check your internet connection and try again."
  exit 2
fi

# ── Comparison ───────────────────────────────────────────────────────────────
# Format is vYYYYMMDD-HHMMSS — lexicographic comparison works correctly.

log ""
log "┌─────────────────────────────────────────────────┐"
log "│          basic-engineering — Check             │"
log "└─────────────────────────────────────────────────┘"
log "  Local version  : $LOCAL_VERSION"
log "  Remote version : $REMOTE_VERSION"
log ""

if [[ "$LOCAL_VERSION" == "$REMOTE_VERSION" ]]; then
  log "✅  Your base is up to date."
  exit 0
elif [[ "$LOCAL_VERSION" < "$REMOTE_VERSION" ]]; then
  log "🔄  Update available!"
  log ""
  log "  To update, follow Step 0 in BOOTSTRAP.md:"
  log "  https://github.com/${REPO_OWNER}/${REPO_NAME}#step-0"
  log ""
  exit 1
else
  log "ℹ️  Local version ($LOCAL_VERSION) is newer than remote ($REMOTE_VERSION)."
  log "   This can happen in development/preview environments."
  exit 0
fi
