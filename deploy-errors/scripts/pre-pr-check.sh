#!/bin/bash

# Pre-PR Check Script
# Verifica problemas comuns antes de criar um Pull Request

set -e

echo "🔍 Executando verificações pré-PR..."
echo ""

ERRORS_FOUND=0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para reportar erro
report_error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
}

# Função para reportar sucesso
report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para reportar warning
report_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Verificando endpoints sem /api prefix..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MISSING_API_PREFIX=$(grep -rE "backendApi\.(get|post|put|delete)\(['\"]\/(?!api\/)" frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules || true)

if [ -n "$MISSING_API_PREFIX" ]; then
    report_error "Endpoints sem /api prefix encontrados:"
    echo "$MISSING_API_PREFIX" | head -10
    echo ""
    echo "💡 Fix sugerido:"
    echo "   sed -i '' \"s|backendApi.get('/|backendApi.get('/api/|g\" <arquivo>"
    echo ""
else
    report_success "Nenhum endpoint sem /api prefix"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Verificando prefixo /api duplicado..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DOUBLE_API_PREFIX=$(grep -rE "backendApi\.(get|post|put|delete)\(['\"]\/api\/api\/" frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules || true)

if [ -n "$DOUBLE_API_PREFIX" ]; then
    report_error "/api/api/ duplicado encontrado:"
    echo "$DOUBLE_API_PREFIX"
    echo ""
else
    report_success "Nenhum prefixo /api duplicado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Verificando auth guards sem isLoading..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MISSING_ISLOADING=$(grep -rn "const { user } = useAuth()" frontend/src --include="*.tsx" 2>/dev/null | grep -v "isLoading" | grep -v node_modules || true)

if [ -n "$MISSING_ISLOADING" ]; then
    report_warning "useAuth() sem isLoading encontrado (possível race condition):"
    echo "$MISSING_ISLOADING" | head -5
    echo ""
    echo "💡 Fix sugerido:"
    echo "   const { user, isLoading } = useAuth();"
    echo "   if (isLoading) return <Spinner />;"
    echo ""
else
    report_success "Todos os useAuth() verificam isLoading"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Verificando console.log e debugger esquecidos..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONSOLE_LOGS=$(grep -rn "console\.log\|console\.debug" frontend/src backend/app --include="*.ts" --include="*.tsx" --include="*.py" 2>/dev/null | grep -v "node_modules" | grep -v "__pycache__" | grep -v "// console.log" | grep -v "# console" || true)

if [ -n "$CONSOLE_LOGS" ]; then
    COUNT=$(echo "$CONSOLE_LOGS" | wc -l | tr -d ' ')
    report_warning "$COUNT console.log/debug encontrados"
    echo "$CONSOLE_LOGS" | head -10
    echo ""
else
    report_success "Nenhum console.log ou debugger esquecido"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Rodando testes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

if npm run test -- --run --passWithNoTests 2>&1 | grep -q "PASS\|no tests"; then
    report_success "Testes passaram"
else
    report_error "Testes falharam"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Verificando tipos TypeScript..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run type-check 2>&1 | grep -q "Found 0 errors"; then
    report_success "Type check passou"
else
    report_error "Type check falhou"
    npm run type-check 2>&1 | tail -20
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Rodando linter..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run lint 2>&1 | grep -q "No ESLint warnings or errors\|0 problems"; then
    report_success "Linter passou"
else
    report_warning "Linter com warnings/errors"
    npm run lint 2>&1 | tail -20
fi

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS_FOUND -eq 0 ]; then
    echo -e "${GREEN}"
    echo "   ✅ ✅ ✅  TUDO PRONTO PARA PR  ✅ ✅ ✅"
    echo -e "${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. git push origin <branch>"
    echo "  2. Criar PR no GitHub"
    echo "  3. Aguardar code review"
    echo ""
    exit 0
else
    echo -e "${RED}"
    echo "   ❌ ❌ ❌  $ERRORS_FOUND ERRO(S) ENCONTRADO(S)  ❌ ❌ ❌"
    echo -e "${NC}"
    echo ""
    echo "Por favor, corrija os erros acima antes de criar o PR."
    echo ""
    exit 1
fi
