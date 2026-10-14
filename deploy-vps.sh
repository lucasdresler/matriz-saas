#!/bin/bash
# Script de Instalação e Deploy Automático para Ubuntu 24.04 aarch64 (ARM64)

set -e

echo "🚀 Iniciando configuração do MATRIZ OS na VPS..."

# 1. Atualizar pacotes do sistema
echo "📦 Atualizando pacotes..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg git ufw

# 2. Instalar Docker e Docker Compose (se não estiver instalado)
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker oficial..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado com sucesso!"
else
    echo "✅ Docker já está instalado."
fi

# 3. Liberar portas no firewall local (Ubuntu)
echo "🛡️ Configurando regras de portas (3000, 8080, 80, 443)..."
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

# 4. Subir containers via Docker Compose
echo "🚀 Subindo os containers (Painel Next.js, Evolution API, PostgreSQL e Redis)..."
sudo docker compose down 2>/dev/null || true
sudo docker compose up -d --build

echo ""
echo "🎉 TUDO PRONTO E RODANDO!"
echo "👉 Painel MATRIZ OS: http://SEU_IP:3000"
echo "👉 Evolution API (WhatsApp): http://SEU_IP:8080"
echo ""
echo "Dica: Lembre-se de liberar as portas 3000 e 8080 nas 'Security Lists' da Oracle Cloud (Ingress Rules)."
