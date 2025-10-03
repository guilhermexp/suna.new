#!/bin/bash

# Script para configurar variáveis de ambiente no Railway
# Para o serviço worker

cd "$(dirname "$0")/backend"

# Ler o arquivo .env e configurar cada variável
while IFS='=' read -r key value; do
  # Pular linhas vazias e comentários
  if [[ -z "$key" || "$key" =~ ^# ]]; then
    continue
  fi
  
  # Remover espaços em branco
  key=$(echo "$key" | tr -d ' ')
  value=$(echo "$value" | tr -d ' ')
  
  # Pular se key estiver vazia
  if [[ -z "$key" ]]; then
    continue
  fi
  
  # Configurar a variável no Railway
  echo "Setting $key..."
  railway variables --set "$key=$value" --service worker
done < .env

# Configurar variáveis específicas do Railway
echo "Setting Railway-specific variables..."
railway variables --set "REDIS_HOST=\${{REDIS.RAILWAY_PRIVATE_DOMAIN}}" --service worker
railway variables --set "REDIS_PORT=\${{REDIS.PORT}}" --service worker
railway variables --set "ENV_MODE=production" --service worker

echo "Variáveis configuradas para o worker!"
