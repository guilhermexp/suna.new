#!/bin/bash

# Smoke Test Script
# Testa endpoints principais após deploy

set -e

# URLs
BACKEND_URL="https://backend-production-bda1.up.railway.app"
FRONTEND_URL="https://frontend-production-410a.up.railway.app"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para testar endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    local description="$4"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -ne "${BLUE}Testing:${NC} $name... "

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$STATUS" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (${STATUS})"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} (expected: ${expected_status}, got: ${STATUS})"
        echo -e "   ${YELLOW}URL:${NC} $url"
        [ -n "$description" ] && echo -e "   ${YELLOW}Note:${NC} $description"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo "🧪 Executando Smoke Tests..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Health Check" \
    "$BACKEND_URL/api/health" \
    "200" \
    "Verifica se backend está respondendo"

test_endpoint "Composio Health" \
    "$BACKEND_URL/api/composio/health" \
    "200" \
    "Verifica se integração Composio está OK"

test_endpoint "Billing Subscription (sem auth)" \
    "$BACKEND_URL/api/billing/subscription" \
    "401" \
    "Deve retornar 401 sem autenticação - OK"

test_endpoint "Agents (sem auth)" \
    "$BACKEND_URL/api/agents" \
    "401" \
    "Deve retornar 401 sem autenticação - OK"

test_endpoint "Composio Icon Slack" \
    "$BACKEND_URL/api/composio/toolkits/slack/icon" \
    "200" \
    "Verifica se endpoint de ícones funciona"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Homepage" \
    "$FRONTEND_URL/" \
    "200" \
    "Verifica se frontend está servindo"

test_endpoint "Dashboard (sem auth)" \
    "$FRONTEND_URL/dashboard" \
    "200" \
    "Página deve carregar (redirect interno para /login)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resultados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Total de testes: $TOTAL_TESTS"
echo -e "${GREEN}Passaram: $PASSED_TESTS${NC}"
echo -e "${RED}Falharam: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ✅ ✅  TODOS OS TESTES PASSARAM  ✅ ✅ ✅${NC}"
    echo ""
    echo "Deploy está funcionando corretamente!"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ❌ ❌  $FAILED_TESTS TESTE(S) FALHARAM  ❌ ❌ ❌${NC}"
    echo ""
    echo "⚠️  Ações sugeridas:"
    echo "  1. Ver logs: railway logs --service backend -f"
    echo "  2. Verificar environment variables"
    echo "  3. Considerar rollback se crítico"
    echo ""
    exit 1
fi
