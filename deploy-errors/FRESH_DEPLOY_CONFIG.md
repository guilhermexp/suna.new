# Fresh Railway Deploy Configuration

**Data:** 08/10/2025 - 20:30
**Motivo:** Recomeçar do zero após 10 dias tentando resolver auth loop

---

## Supabase (Manter - Não Deletar)

**Project URL:** https://qupamuozvmiewijkvxws.supabase.co
**Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cGFtdW96dm1pZXdpamt2eHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTM2MDAsImV4cCI6MjA3NDA4OTYwMH0.06-Ixix45QPrh3Uj_htCpEZ5vCqud2qWEUdnwfR0xso

---

## Railway Antigo (Deletar)

**Project ID:** ac7acd0f-9af5-4a0a-a7a3-093936e37e50
**Frontend URL:** https://frontend-production-410a.up.railway.app
**Backend URL:** https://backend-production-bda1.up.railway.app

---

## Estratégia Fresh Deploy

### 1. Código Base Limpo
- Usar commits mais recentes do Git (auth já corrigido)
- `c22dd88a` - httpOnly fix
- `bcf0327e` - config.toml fix
- `ea3b4593` - cookie handling fix

### 2. Ordem de Deploy
1. ✅ **Backend primeiro** → Testar health endpoint
2. ✅ **Frontend depois** → Testar auth **IMEDIATAMENTE**
3. ⚠️ **NÃO continuar** se auth não funcionar na primeira tentativa

### 3. Variáveis de Ambiente Necessárias

**Backend:**
```
SUPABASE_URL=https://qupamuozvmiewijkvxws.supabase.co
SUPABASE_ANON_KEY=(anon key acima)
SUPABASE_SERVICE_ROLE_KEY=(pegar do Supabase Dashboard)
```

**Frontend:**
```
NEXT_PUBLIC_SUPABASE_URL=https://qupamuozvmiewijkvxws.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(anon key acima)
NEXT_PUBLIC_BACKEND_URL=https://[novo-backend-railway].up.railway.app/api
NEXT_PUBLIC_URL=https://[novo-frontend-railway].up.railway.app
NEXT_PUBLIC_ENV_MODE=PRODUCTION
```

### 4. Configurações Supabase (Verificar)

No Supabase Dashboard → Authentication → Settings:

**Site URL:**
```
https://[novo-frontend-railway].up.railway.app
```

**Redirect URLs:**
```
https://[novo-frontend-railway].up.railway.app/**
https://[novo-frontend-railway].up.railway.app/auth/callback
```

**Email Settings:**
- Enable email confirmations: **OFF** ⚠️
- Enable email signup: **ON**

### 5. Teste Imediato Pós-Deploy

```bash
# 1. Backend health check
curl https://[backend-url]/health

# 2. Login test com DevTools
# Acessar: https://[frontend-url]/auth
# Login: guilherme-varela@hotmail.com / adoado01
# DEVE REDIRECIONAR para /dashboard SEM TELA PRETA
```

---

## ⚠️ Red Flags - Parar e Investigar Se:

- Backend retorna 500 no health check
- Frontend mostra tela preta após login
- Middleware logs mostram "no user" após login bem-sucedido
- Cookie `sb-*-auth-token` não aparece no DevTools após login

---

## Arquivos Críticos (Já Corrigidos no Git)

✅ `frontend/src/lib/supabase/client.ts` - Custom cookie methods
✅ `frontend/src/lib/supabase/server.ts` - Sem httpOnly override
✅ `frontend/src/middleware.ts` - Sem httpOnly override
✅ `frontend/src/app/auth/actions.ts` - redirect() server-side
✅ `backend/supabase/config.toml` - enable_confirmations: false

---

**Última Atualização:** 08/10/2025 às 20:30
**Status:** Pronto para fresh deploy
