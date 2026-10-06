#!/bin/bash
# Claude Code na webu: doinstaluje graphify a obnoví znalostní graf projektu.
# Lokálně (na vlastním počítači) nedělá nic - tam se graphify instaluje ručně.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v graphify >/dev/null 2>&1; then
  uv tool install 'graphifyy[sql]'
fi

# Graf se staví jen z kódu (bez AI), trvá pár sekund.
cd "$CLAUDE_PROJECT_DIR"
graphify update . >/dev/null
