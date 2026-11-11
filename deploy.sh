#!/usr/bin/env bash
# ==============================================================================
# AllLogic Online — Script Oficial de Build e Deploy do Agillex Hub
# Domínio de Produção: hub.agillex.com.br / hub.alllogiconline.com.br
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Iniciando build e sincronização do Agillex Hub (hub.agillex.com.br)..."

# 1. Build local de validação
npm run build

# 2. Sincronizar com GitHub
COMMIT_MSG="${1:-fix(livechat): conectar envio de mensagens do hub com a evolution api oficial}"
if git status --porcelain | grep -q .; then
  echo "📦 Criando commit das alterações..."
  git add .
  git commit -m "$COMMIT_MSG"
fi

echo "📤 Enviando código para o GitHub..."
git push origin main

# 3. Deploy na VPS de Produção (136.248.113.145)
SSH_KEY="$HOME/.ssh/ssh-key-2026-07-03.key"
VPS_HOST="dresler@136.248.113.145"

if [ -f "$SSH_KEY" ]; then
  echo "🚀 Atualizando container em produção na VPS..."
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_HOST" "
    cd /home/dresler/matriz-saas &&
    git pull origin main &&
    docker compose up -d --build matriz-saas
  "
  echo "✅ Deploy em produção concluído com sucesso!"
fi

echo ""
echo "🎉 AGILLEX HUB PUBLICADO COM SUCESSO!"
echo "👉 Painel: https://hub.agillex.com.br"
echo "👉 Mirror: https://hub.alllogiconline.com.br"
