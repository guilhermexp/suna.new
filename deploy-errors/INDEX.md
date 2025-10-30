# 🗂️ Índice Rápido - Deploy Errors

## 🆘 Precisa de Ajuda Rápida?

```
┌─────────────────────────────────────────────────────────┐
│  🚨 Qual é o seu problema?                              │
└─────────────────────────────────────────────────────────┘

1. 🔄 Loading infinito / Skeleton loaders
   └─► QUICK_TROUBLESHOOTING.md → Seção 1

2. ❌ Erro 404 em múltiplos endpoints
   └─► QUICK_TROUBLESHOOTING.md → Seção 2

3. 🔐 Problemas de autenticação / hasUser: false
   └─► QUICK_TROUBLESHOOTING.md → Seção 3

4. 🚀 Deployment failing no Railway
   └─► QUICK_TROUBLESHOOTING.md → Seção 4

5. 💥 Backend retorna 500 Internal Server Error
   └─► QUICK_TROUBLESHOOTING.md → Seção 5

6. 📝 Preciso criar um Pull Request
   └─► PR_CHECKLIST.md

7. 🔍 Quero entender o problema em detalhes
   └─► RAILWAY_API_PREFIX_FIX_2025_10_30.md
```

---

## 📚 Documentos por Uso

### 🎯 Para Desenvolvedores

| Situação | Documento | Tempo Estimado |
|----------|-----------|----------------|
| Antes de criar PR | `PR_CHECKLIST.md` | 10-15 min |
| Problema em prod | `QUICK_TROUBLESHOOTING.md` | 5-15 min |
| Entender causa raiz | `RAILWAY_API_PREFIX_FIX_2025_10_30.md` | 30-45 min |
| Configurar pre-commit | `scripts/pre-pr-check.sh` | 5 min |

### 🧪 Para QA/DevOps

| Situação | Documento | Tempo Estimado |
|----------|-----------|----------------|
| Testar deploy | `scripts/smoke-test.sh` | 2-3 min |
| Monitorar problemas | `QUICK_TROUBLESHOOTING.md` | 5 min |
| Rollback | `PR_CHECKLIST.md` → Seção "Em Caso de Problema" | 2-5 min |

### 📖 Para Novos Membros da Equipe

**Leia nesta ordem:**
1. `README.md` - Overview geral (10 min)
2. `RAILWAY_API_PREFIX_FIX_2025_10_30.md` - Exemplo de problema completo (30 min)
3. `QUICK_TROUBLESHOOTING.md` - Como diagnosticar (15 min)
4. `PR_CHECKLIST.md` - Processo de desenvolvimento (15 min)

**Total:** ~1h 10min

---

## 🗺️ Mapa de Navegação

```
deploy-errors/
│
├─ 📖 README.md ◄─────────── COMECE AQUI
│  └─ Overview de tudo
│
├─ 🗂️ INDEX.md ◄─────────── VOCÊ ESTÁ AQUI
│  └─ Índice rápido
│
├─ 📋 Documentos Principais
│  │
│  ├─ 🚨 QUICK_TROUBLESHOOTING.md
│  │  └─ Diagnóstico rápido por sintoma (5-15 min)
│  │
│  ├─ ✅ PR_CHECKLIST.md
│  │  └─ Checklist completo para PRs (10-15 min)
│  │
│  └─ 📄 RAILWAY_API_PREFIX_FIX_2025_10_30.md
│     └─ Relatório detalhado do fix (30-45 min)
│
└─ 🛠️ scripts/
   │
   ├─ pre-pr-check.sh
   │  └─ Validações automáticas antes de PR
   │
   └─ smoke-test.sh
      └─ Testes após deploy
```

---

## 🔍 Busca Rápida por Palavra-Chave

### Problemas Comuns:

```bash
# Loading infinito
cat QUICK_TROUBLESHOOTING.md | grep -A 20 "skeleton loaders"

# Erro 404
cat QUICK_TROUBLESHOOTING.md | grep -A 20 "Erro 404"

# Auth issues
cat QUICK_TROUBLESHOOTING.md | grep -A 20 "hasUser: false"

# Deploy failing
cat QUICK_TROUBLESHOOTING.md | grep -A 20 "Deployment failing"
```

### Soluções por Componente:

```bash
# Frontend
grep -r "frontend" . --include="*.md" | grep -i "fix\|solution"

# Backend
grep -r "backend" . --include="*.md" | grep -i "fix\|solution"

# Auth
grep -r "auth\|authentication" . --include="*.md" | grep -i "fix\|solution"

# API endpoints
grep -r "/api" . --include="*.md" | grep -i "fix\|solution"
```

---

## 📊 Fluxograma de Decisão

```
                    Encontrou um problema?
                            │
                            ▼
                ┌──────────────────────┐
                │  É urgente?          │
                │  (produção quebrada) │
                └──────┬───────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
    ┌──────────────┐      ┌──────────────────┐
    │     SIM      │      │       NÃO        │
    │ (< 1h)       │      │   (pode esperar) │
    └──────┬───────┘      └──────┬───────────┘
           │                     │
           ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐
    │ QUICK_          │   │ RAILWAY_API_    │
    │ TROUBLESHOOTING │   │ PREFIX_FIX      │
    │ .md             │   │ .md             │
    └─────┬───────────┘   └─────┬───────────┘
          │                     │
          ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐
    │ Encontrou       │   │ Entendeu o      │
    │ solução?        │   │ problema?       │
    └─────┬───────────┘   └─────┬───────────┘
          │                     │
    ┌─────┴─────┐         ┌─────┴─────┐
    │           │         │           │
    ▼           ▼         ▼           ▼
  SIM         NÃO       SIM         NÃO
    │           │         │           │
    │           │         │           │
    ▼           │         │           │
  Fix           │         │           │
  Aplicado      │         │           │
    │           │         │           │
    └───────────┴─────────┴───────────┘
                │
                ▼
        ┌──────────────┐
        │  Documentar  │
        │  Aprendizado │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  Adicionar   │
        │  à base de   │
        │  conhecimento│
        └──────────────┘
```

---

## 🎯 Atalhos por Função

### Desenvolvedor Frontend:
```bash
# Antes de commitar
./scripts/pre-pr-check.sh

# Se encontrar erro 404
cat QUICK_TROUBLESHOOTING.md | grep -A 50 "Erro 404"

# Se loading infinito
cat QUICK_TROUBLESHOOTING.md | grep -A 50 "skeleton loaders"
```

### Desenvolvedor Backend:
```bash
# Ver erros 500 comuns
cat QUICK_TROUBLESHOOTING.md | grep -A 50 "500 Internal"

# Verificar endpoints
cat RAILWAY_API_PREFIX_FIX_2025_10_30.md | grep -A 20 "Endpoints Corrigidos"
```

### DevOps:
```bash
# Smoke test após deploy
./scripts/smoke-test.sh

# Rollback rápido
cat PR_CHECKLIST.md | grep -A 30 "Rollback"

# Monitorar logs
railway logs --service backend -f
```

### Tech Lead:
```bash
# Overview de todos os problemas
cat RAILWAY_API_PREFIX_FIX_2025_10_30.md | grep "##"

# Prevenir problemas
cat PR_CHECKLIST.md

# Métricas
cat README.md | grep -A 10 "Estatísticas"
```

---

## 📝 Comandos Mais Usados

```bash
# 1. Verificar se PR está pronto
./deploy-errors/scripts/pre-pr-check.sh

# 2. Testar deploy em prod
./deploy-errors/scripts/smoke-test.sh

# 3. Buscar solução para problema específico
grep -r "seu-problema" deploy-errors/ --include="*.md"

# 4. Ver logs em tempo real
railway logs --service backend -f

# 5. Verificar health
curl https://backend-production-bda1.up.railway.app/api/health

# 6. Rollback
git revert HEAD && git push
```

---

## 🆕 Últimas Atualizações

| Data | Documento | Mudança |
|------|-----------|---------|
| 30/10/2025 | RAILWAY_API_PREFIX_FIX | Criação inicial - Fix completo de /api prefix |
| 30/10/2025 | QUICK_TROUBLESHOOTING | Criação inicial - Guia de diagnóstico |
| 30/10/2025 | PR_CHECKLIST | Criação inicial - Checklist de PRs |
| 30/10/2025 | Scripts | Criação de pre-pr-check.sh e smoke-test.sh |

---

## 💡 Dicas Rápidas

1. **Sempre rode** `./scripts/pre-pr-check.sh` antes de criar PR
2. **Depois de cada deploy**, rode `./scripts/smoke-test.sh`
3. **Se em dúvida**, comece por `QUICK_TROUBLESHOOTING.md`
4. **Documente tudo** - próxima vez será mais rápido
5. **Use os scripts** - eles automatizam 80% das verificações

---

**Última Atualização:** 30 de Outubro de 2025
**Versão:** 1.0

---

**❓ Ainda com dúvidas?**

1. Leia `README.md` para contexto geral
2. Use `QUICK_TROUBLESHOOTING.md` para diagnóstico
3. Consulte `RAILWAY_API_PREFIX_FIX_2025_10_30.md` para entender causa raiz
4. Se nada funcionar, peça ajuda e documente a solução!
