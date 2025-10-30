# ✅ Checklist para Pull Requests e Merges

## 🚀 Antes de Criar o PR

### 1. Verificações de Código

```bash
# Rodar este script antes de criar PR
./deploy-errors/scripts/pre-pr-check.sh
```

**Ou manualmente:**

- [ ] **Nenhum endpoint sem `/api` prefix**
  ```bash
  grep -rE "backendApi\.(get|post|put|delete)\(['\"]\/(?!api\/)" frontend/src --include="*.ts" --include="*.tsx" | grep -v node_modules
  ```

- [ ] **Auth guards implementados corretamente**
  ```bash
  # Buscar uso de useAuth sem isLoading
  grep -rn "const { user } = useAuth()" frontend/src --include="*.tsx" | grep -v "isLoading"
  ```

- [ ] **Nenhum console.log/debugger esquecido**
  ```bash
  grep -rn "console\.log\|debugger" frontend/src backend/app --exclude-dir=node_modules
  ```

### 2. Testes

- [ ] Testes unitários passam: `npm run test`
- [ ] Testes de tipo passam: `npm run type-check`
- [ ] Linter passa: `npm run lint`
- [ ] Build local funciona: `npm run build`

### 3. Teste Manual Local

- [ ] Fazer logout completo
- [ ] Limpar localStorage: `localStorage.clear()`
- [ ] Criar nova conta
- [ ] Verificar se dashboard carrega imediatamente
- [ ] Abrir DevTools e verificar:
  - [ ] Nenhum erro 404
  - [ ] Nenhum erro de CORS
  - [ ] Nenhuma promise unhandled rejection
  - [ ] Loading states funcionam corretamente

---

## 👀 Durante Code Review

### Para o Revisor:

#### Verificar API Calls
```typescript
// ✅ CORRETO:
backendApi.get('/api/billing/subscription')
backendApi.post('/api/composio/profiles', data)

// ❌ INCORRETO:
backendApi.get('/billing/subscription')  // Falta /api
backendApi.post('/api/api/composio/profiles', data)  // Duplicado
```

#### Verificar Auth Guards
```typescript
// ✅ CORRETO:
const MyComponent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;

  return <Content />;
};

// ❌ INCORRETO:
const MyComponent = () => {
  const { user } = useAuth();  // Falta isLoading!
  return <Content />;  // Race condition!
};
```

#### Verificar Supabase Queries
```typescript
// ✅ CORRETO:
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],
  queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    return supabase
      .from('projects')
      .select('*')
      .eq('account_id', session.user.id);
  },
  enabled: !!user,  // ✅ Só executa se user existir
});

// ❌ INCORRETO:
const { data } = useQuery({
  queryKey: ['projects'],
  queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    // ❌ Não verifica se session existe!
    return supabase.from('projects').select('*');
  },
  // ❌ Não tem enabled check!
});
```

#### Verificar SQL/Migrations
- [ ] Migrations têm rollback
- [ ] Triggers têm error handling
- [ ] Nenhuma quebra de constraint em dados existentes
- [ ] Índices apropriados criados

---

## 🚢 Após Merge para Main

### 1. Monitorar Deployment (5-10 min)

```bash
# Ver logs do Railway em tempo real
railway logs --service backend -f
railway logs --service frontend -f
```

**Verificar:**
- [ ] Build completa sem erros
- [ ] Deploy bem-sucedido
- [ ] Health checks passam
- [ ] Nenhum erro crítico nos logs

### 2. Smoke Tests (5 min)

```bash
# Testar endpoints principais
./deploy-errors/scripts/smoke-test.sh

# Ou manualmente:
curl https://backend-production-bda1.up.railway.app/api/health
curl https://frontend-production-410a.up.railway.app/
```

**No Browser:**
- [ ] Abrir https://frontend-production-410a.up.railway.app/
- [ ] Fazer login
- [ ] Verificar dashboard carrega
- [ ] Abrir DevTools → Console
- [ ] Verificar nenhum erro 404 ou 500
- [ ] Verificar Network tab (F12 → Network):
  - [ ] Todas requests retornam 2xx ou 401
  - [ ] Nenhuma request para endpoint errado

### 3. Verificar Logs/Monitoring

**Sentry (se configurado):**
- [ ] Nenhum erro novo nas últimas 10 minutos
- [ ] Response times normais
- [ ] Nenhum spike de erros

**Railway Logs:**
```bash
# Ver últimas 100 linhas de cada serviço
railway logs --service backend --lines 100
railway logs --service frontend --lines 100
railway logs --service worker --lines 100
```

---

## 🚨 Em Caso de Problema

### Rollback Rápido (2-5 min)

**Opção 1: Reverter commit no Git**
```bash
# 1. Ver histórico
git log --oneline -10

# 2. Identificar commit problemático
# Exemplo: abc1234 - "feat: Nova feature que quebrou"

# 3. Reverter
git revert abc1234

# 4. Push
git push origin main

# 5. Railway vai automaticamente fazer deploy do revert
```

**Opção 2: Rollback no Railway Dashboard**
```
1. Acessar: https://railway.app/project/<project-id>
2. Clicar em "Deployments"
3. Encontrar o último deployment que funcionava
4. Clicar em "Redeploy"
```

### Comunicação

```markdown
🚨 **ROLLBACK EXECUTADO**

**Commit revertido:** abc1234
**Motivo:** [descrever problema]
**Status:** ✅ Aplicação voltou ao normal

**Próximos passos:**
1. Investigar causa raiz
2. Criar fix
3. Testar localmente
4. Re-submeter PR
```

---

## 📊 Métricas de Qualidade do PR

### ⭐ PR Excelente:
- ✅ Todos os testes passam
- ✅ Nenhuma violação de linting
- ✅ Code coverage não diminuiu
- ✅ Documentação atualizada
- ✅ Checklist completa
- ✅ Deploy sem problemas
- ✅ Nenhum erro em produção nas primeiras 24h

### ⚠️ PR Precisa Melhorar:
- ❌ Testes falhando
- ❌ Linter com warnings
- ❌ Falta documentação
- ❌ Checklist incompleta
- ❌ Deploy com erros
- ❌ Rollback necessário

---

## 🔧 Scripts Úteis

### Criar PR:
```bash
# Criar branch
git checkout -b feature/minha-feature

# Fazer alterações
git add .
git commit -m "feat: Nova feature"

# Rodar checklist automaticamente
./deploy-errors/scripts/pre-pr-check.sh

# Se tudo passar:
git push origin feature/minha-feature

# Criar PR no GitHub
gh pr create --title "feat: Nova feature" --body "Descrição..."
```

### Após Merge:
```bash
# Voltar para main
git checkout main
git pull

# Monitorar deployment
./deploy-errors/scripts/watch-deployment.sh

# Rodar smoke tests
./deploy-errors/scripts/smoke-test.sh
```

---

## 📝 Template de PR Description

```markdown
## 📝 Descrição

[Descrever o que foi feito]

## 🎯 Motivo

[Por que essa mudança é necessária]

## 🧪 Como Testar

1. [Passo 1]
2. [Passo 2]
3. [Verificar resultado esperado]

## ✅ Checklist

- [ ] Testes passam localmente
- [ ] Linter passa
- [ ] Type check passa
- [ ] Build local funciona
- [ ] Testado manualmente
- [ ] Documentação atualizada (se necessário)
- [ ] Nenhum console.log/debugger esquecido
- [ ] Endpoints com /api prefix
- [ ] Auth guards implementados

## 📸 Screenshots

[Se aplicável, adicionar screenshots]

## 🔗 Issues Relacionadas

Closes #123
Related to #456
```

---

**Última Atualização:** 30 de Outubro de 2025
**Versão:** 1.0
