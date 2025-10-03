# 🚀 Deployment do Suna/Kortix no Railway

## ✅ Deployment Completo!

### 📦 Serviços Criados:

1. **Redis** (Managed Database)
   - Banco de dados Redis gerenciado pelo Railway
   - Usado para cache e gerenciamento de filas

2. **Backend** (API Service)
   - URL: https://backend-production-ba43.up.railway.app
   - API FastAPI em Python 3.11
   - Build logs: https://railway.com/project/ac7acd0f-9af5-4a0a-a7a3-093936e37e50/service/488f1359-9b34-48e0-97a0-eaa607ee895c

3. **Worker** (Background Jobs)
   - Processa jobs assíncronos com Dramatiq
   - Conectado ao Redis para gerenciamento de filas
   - Build logs: https://railway.com/project/ac7acd0f-9af5-4a0a-a7a3-093936e37e50/service/c38cb429-cd23-4ea9-b190-352f00c054d5

4. **Frontend** (Web App)
   - URL: https://frontend-production-9d3b.up.railway.app
   - Next.js 15 com React 18
   - Build logs: https://railway.com/project/ac7acd0f-9af5-4a0a-a7a3-093936e37e50/service/527a3e27-6036-472d-8504-d161c2172b8f

### 🔐 Variáveis de Ambiente Configuradas:

**Backend & Worker:**
- ✅ Supabase (URL, Keys, JWT Secret)
- ✅ Redis (usando variáveis do Railway: REDIS.RAILWAY_PRIVATE_DOMAIN, REDIS.PORT)
- ✅ LLM APIs (OpenAI, Morph, Gemini, OpenRouter, XAI, Groq, ZAI)
- ✅ Search APIs (Tavily, Firecrawl, Serper)
- ✅ Daytona (Sandbox)
- ✅ Composio (Integrations)
- ✅ RapidAPI
- ✅ Webhook & MCP configurations
- ✅ Kortix Admin API Key
- ✅ ENV_MODE=production

**Frontend:**
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_BACKEND_URL (apontando para o backend do Railway)
- ✅ NEXT_PUBLIC_URL (URL do frontend no Railway)
- ✅ NEXT_PUBLIC_ENV_MODE=PRODUCTION
- ✅ KORTIX_ADMIN_API_KEY
- ✅ NEXT_OUTPUT=standalone

### 🌐 URLs do Projeto:

- **Dashboard do Projeto:** https://railway.com/project/ac7acd0f-9af5-4a0a-a7a3-093936e37e50
- **Frontend:** https://frontend-production-9d3b.up.railway.app
- **Backend API:** https://backend-production-ba43.up.railway.app
- **API Docs:** https://backend-production-ba43.up.railway.app/docs

### 📝 Próximos Passos:

1. **Aguardar os Builds Completarem:**
   - Acesse o dashboard do Railway para verificar o status dos builds
   - Backend pode levar 5-10 minutos (build do Docker com Python)
   - Frontend pode levar 5-10 minutos (build do Next.js)
   - Worker usa a mesma imagem do backend

2. **Verificar os Logs:**
   ```bash
   # Backend logs
   railway logs --service backend
   
   # Worker logs
   railway logs --service worker
   
   # Frontend logs
   railway logs --service frontend
   ```

3. **Testar a Aplicação:**
   - Acesse https://frontend-production-9d3b.up.railway.app
   - Teste o login/registro
   - Verifique se a integração com o backend está funcionando

4. **Configurações Adicionais (se necessário):**
   - Domínio customizado: `railway domain --service frontend`
   - Ajustar recursos (RAM/CPU) via dashboard se necessário
   - Configurar webhooks no Supabase para apontar para o backend do Railway

### 🔧 Comandos Úteis:

```bash
# Ver status do projeto
railway status

# Ver variáveis de um serviço
railway variables --service backend

# Fazer redeploy de um serviço
railway redeploy --service backend

# Ver logs em tempo real
railway logs --service backend --follow

# Abrir dashboard no navegador
open https://railway.com/project/ac7acd0f-9af5-4a0a-a7a3-093936e37e50
```

### ⚠️ Notas Importantes:

1. **Custos:** O Railway tem um plano gratuito limitado. Este projeto pode exceder os limites gratuitos devido ao uso de recursos.

2. **Redis:** Está usando o Redis gerenciado do Railway, que é conectado automaticamente via variáveis de referência.

3. **CORS:** O backend está configurado para aceitar requisições do frontend no Railway.

4. **Supabase Database:** Certifique-se de que o schema 'basejump' está exposto nas configurações do Supabase (Project Settings -> Data API -> Exposed schemas).

5. **Daytona Snapshot:** Verifique se o snapshot 'kortix/suna:0.1.3.20' está criado em https://app.daytona.io/dashboard/snapshots

### 🐛 Troubleshooting:

Se algo não funcionar:

1. Verifique os logs de cada serviço
2. Confirme que todas as variáveis de ambiente estão configuradas corretamente
3. Verifique se o Redis está funcionando: `railway connect redis`
4. Teste a API diretamente: `curl https://backend-production-ba43.up.railway.app/api/health`

---

**Deploy realizado com sucesso!** 🎉

Projeto: suna-kortix
Workspace: Guilherme Varela's Projects
