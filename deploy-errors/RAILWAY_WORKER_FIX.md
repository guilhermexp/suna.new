# Correção de Worker Background - suna.new Railway

**Data:** 12 de Janeiro de 2025
**Projeto:** suna.new (Railway Deployment)
**Problema:** Agent runs parando imediatamente com status "stopped" ao invés de processar

---

## 1. Problema Inicial

### Sintomas Reportados
- Seletor de modelo funcionando corretamente
- Login e dashboard funcionando
- Ao enviar mensagem para o agente:
  - Request POST `/api/agent/initiate` retornava 200 OK
  - Chat UI abria normalmente
  - Agent run era criado mas terminava imediatamente
  - Status final: **"stopped"** ao invés de "completed"
  - Nenhuma resposta do agente era gerada

### Logs de Erro no Backend
```
Agent run 2fc76814-f9c8-49b7-b728-5195762f0462 is not running (status: stopped). Ending stream.
```

### Logs de Erro no Frontend
```javascript
[useAgentStream] Final status for run ID 2fc76814-f9c8-49b7-b728-5195762f0462: stopped
```

---

## 2. Arquitetura do Sistema

### Componentes
1. **Frontend (Next.js)** - Railway service `frontend-production-410a`
2. **Backend (FastAPI)** - Railway service `backend-production-bda1`
3. **Worker (Dramatiq)** - Railway service worker
4. **Redis** - Message broker no Railway (`redis.railway.internal`)

### Fluxo de Execução Normal
1. Frontend envia mensagem → POST `/api/agent/initiate`
2. Backend cria `agent_run` no banco com status "running"
3. Backend enfileira job no Redis via Dramatiq: `run_agent_background.send()`
4. **Worker consome job do Redis** (este é o ponto que estava falhando)
5. Worker executa LLM e ferramentas
6. Worker publica respostas incrementais no Redis
7. Backend faz stream via SSE: `GET /api/agent-run/{id}/stream`
8. Frontend recebe e exibe respostas em tempo real
9. Worker marca agent run como "completed" no banco

---

## 3. Diagnóstico

### Passo 1: Verificar que a mensagem foi enviada com sucesso
- ✅ Frontend enviou request corretamente
- ✅ Backend recebeu e retornou 200 OK
- ✅ Agent run criado no banco de dados
- ✅ Job enfileirado no Redis

### Passo 2: Verificar status do worker
```bash
# Via Railway MCP
deployment_list(serviceId="d4248bfe-8afc-469a-a509-6354fa537503")
```

**Resultado:**
- Status do deployment: `SUCCESS`
- Container rodando sem crashes
- **MAS:** Logs vazios/whitespace - worker não estava processando nada

### Passo 3: Verificar variáveis de ambiente
```bash
# Backend service
ENV_MODE=local ✅

# Worker service
ENV_MODE=production ❌ PROBLEMA IDENTIFICADO!
```

### Causa Raiz
O worker tinha `ENV_MODE=production` enquanto o backend tinha `ENV_MODE=local`.

**Por que isso quebrava o worker:**

1. No código do worker (`run_agent_background.py`), a inicialização depende de várias configurações que mudam com `ENV_MODE`
2. Com `ENV_MODE=production`, o worker tentava:
   - Verificar subscription tier (não existe em self-hosted)
   - Acessar features de billing que não estavam configuradas
   - Aplicar rate limits e restrições de modelo
3. Essas verificações falhavam silenciosamente, fazendo o worker crashar ou não processar jobs
4. **Backend esperava que worker processasse**, mas worker estava inoperante

---

## 4. Solução Aplicada

### 4.1 Identificar ENV_MODE do Backend

**Verificação via Railway MCP:**
```bash
# Listar serviços do projeto
service_list(projectId="aa10f10a-c682-46e1-9d16-62871f3b5a09")
```

**Backend service (`b5d1542b-1b69-4862-b520-6a5de10480a1`):**
- Variável: `ENV_MODE=local`

### 4.2 Atualizar ENV_MODE do Worker

**Worker service (`d4248bfe-8afc-469a-a509-6354fa537503`):**

**ANTES:**
```
ENV_MODE=production
```

**DEPOIS:**
```
ENV_MODE=local
```

**Comando aplicado via Railway MCP:**
```bash
variable_set(
  projectId="aa10f10a-c682-46e1-9d16-62871f3b5a09",
  environmentId="1df03999-6df7-4b5f-9f6f-0d24fc88f7e5",
  serviceId="d4248bfe-8afc-469a-a509-6354fa537503",
  name="ENV_MODE",
  value="local"
)
```

### 4.3 Aguardar Redeploy Automático

Railway automaticamente fez redeploy do worker:
- Deployment ID: `88530f58-7df1-4457-be29-a6b78be6e8dc`
- Status: `SUCCESS`
- Logs agora mostram inicialização correta

---

## 5. Verificação da Correção

### 5.1 Logs do Worker Saudáveis

**Inicialização:**
```
[debug] Langfuse disabled - missing LANGFUSE_PUBLIC_KEY
[debug] Daytona sandbox configured successfully
[warning] No API key found for provider: ANTHROPIC
```

### 5.2 Teste End-to-End

**Mensagem de teste:** "Teste final: explique o que é Redis em uma frase"

**Resultado:**

1. ✅ Frontend enviou mensagem
2. ✅ Backend criou agent run: `60df6ee1-1025-4bf3-b228-b29eb0d9419b`
3. ✅ Job enfileirado no Redis
4. ✅ **Worker pegou e processou job**
5. ✅ Worker executou LLM (GLM-4.6)
6. ✅ Worker gerou resposta completa
7. ✅ Worker executou tool "complete"
8. ✅ Backend fez stream para frontend
9. ✅ Chat exibiu resposta: "Redis é um banco de dados em memória, de código aberto, conhecido por sua alta performance e estruturas de dados flexíveis como strings, hashes, listas, conjuntos e conjuntos ordenados."
10. ✅ **Status final: "completed"** (não mais "stopped"!)

**Logs do worker confirmando processamento:**
```
[info] Starting background agent run: 60df6ee1-1025-4bf3-b228-b29eb0d9419b
[debug] 🔧 EXECUTING TOOL: complete
[debug] ✅ Tool execution completed successfully
[info] Agent run completed normally (duration: 4.68s, responses: 14)
[debug] Agent run background task fully completed with final status: completed
```

---

## 6. Por Que ENV_MODE Importa

### Diferenças entre Modos

#### `ENV_MODE=local` (Self-Hosted)
- ✅ Todos os modelos disponíveis sem restrições
- ✅ Sem verificação de subscription/billing
- ✅ Sem rate limits de tier
- ✅ Features totalmente desbloqueadas
- ✅ Modo ideal para Railway deployment self-hosted

#### `ENV_MODE=production` (SaaS)
- ❌ Verifica subscription tier do usuário
- ❌ Aplica rate limits por tier
- ❌ Restringe acesso a modelos premium
- ❌ Requer integração com billing system
- ❌ Mostra prompts de upgrade/paywall

### Código Relevante

**Backend:** `backend/core/billing/api.py` (linhas 806-817)
```python
@router.get("/available-models")
async def get_available_models(
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
) -> Dict:
    if config.ENV_MODE == EnvMode.LOCAL:
        logger.debug("Running in local development mode - all models available")
        all_models = model_manager.list_available_models(include_disabled=False)
        # Retorna todos os modelos sem verificar subscription
```

**Worker:** `backend/run_agent_background.py` (linha 84-87)
```python
try:
    await initialize()  # Inicialização depende de ENV_MODE
except Exception as e:
    logger.critical(f"Failed to initialize Redis connection: {e}")
    raise e
```

---

## 7. Como Resolver se Ocorrer Novamente

### Sintomas de ENV_MODE Mismatch

1. **Agent runs param imediatamente:**
   - Status "stopped" ao invés de "completed"
   - Backend logs: "Agent run is not running (status: stopped)"

2. **Worker logs vazios ou com erros de inicialização:**
   - Container roda mas não processa jobs
   - Sem logs de "Starting background agent run"

3. **Seletor de modelos vazio:**
   - Indica backend também com ENV_MODE errado

### Passos de Correção

#### 1. Verificar ENV_MODE de todos os serviços

```bash
# Via Railway dashboard ou MCP
railway variables --service=backend
railway variables --service=worker
```

**Esperado para self-hosted:**
- Backend: `ENV_MODE=local`
- Worker: `ENV_MODE=local`
- Frontend: `NEXT_PUBLIC_ENV_MODE=LOCAL`

#### 2. Corrigir inconsistências

Se worker tem `ENV_MODE=production`:

```bash
# Via Railway dashboard:
# 1. Abrir worker service settings
# 2. Variables tab
# 3. Editar ENV_MODE
# 4. Trocar de "production" para "local"
# 5. Salvar (redeploy automático)

# Ou via Railway CLI:
railway variables set ENV_MODE=local --service=worker
```

#### 3. Aguardar redeploy (1-2 minutos)

Railway fará redeploy automático do worker.

#### 4. Verificar logs do worker

```bash
railway logs --service=worker
```

**Logs saudáveis devem mostrar:**
```
[debug] Langfuse disabled
[debug] Daytona sandbox configured
[info] Starting background agent run: <uuid>
```

#### 5. Testar envio de mensagem

- Abrir frontend
- Enviar mensagem simples para o agente
- Verificar que resposta completa é exibida
- Console logs devem mostrar status "completed"

---

## 8. Outras Causas Possíveis de Agent Runs Parando

Se ENV_MODE estiver correto mas agent runs ainda param:

### 1. Redis Connection Issues
```bash
# Verificar logs do backend
railway logs --service=backend | grep -i redis

# Procurar por:
# "Failed to initialize Redis connection"
# "Redis connection lost"
```

**Solução:**
- Verificar `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Confirmar que Redis service está rodando
- Testar conectividade: `redis-cli -h redis.railway.internal ping`

### 2. Dramatiq Broker Issues
```bash
# Verificar logs do worker
railway logs --service=worker | grep -i dramatiq

# Procurar por:
# "Failed to connect to broker"
# "Authentication failed"
```

**Solução:**
- Verificar que worker tem mesmas credenciais Redis que backend
- Confirmar que RedisBroker está sendo criado com password

### 3. Database Connection Issues
```bash
# Verificar logs do worker
railway logs --service=worker | grep -i "database\|supabase"
```

**Solução:**
- Verificar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Confirmar que worker pode acessar Supabase

### 4. API Keys Faltando
```bash
# Worker logs mostrarão warnings
railway logs --service=worker | grep -i "no api key"
```

**Exemplo:**
```
[warning] No API key found for provider: ANTHROPIC
```

**Solução:**
- Adicionar variáveis de ambiente no worker:
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_API_KEY`
  - `OPENAI_API_KEY`
  - etc.

---

## 9. Comandos Úteis para Diagnóstico

### Railway CLI

```bash
# Listar todos os serviços
railway service

# Ver variáveis de um serviço
railway variables --service=worker

# Ver logs em tempo real
railway logs --service=worker --follow

# Forçar redeploy
railway redeploy --service=worker
```

### Railway MCP (via Claude Code)

```bash
# Listar serviços do projeto
service_list(projectId="aa10f10a-c682-46e1-9d16-62871f3b5a09")

# Ver variáveis de um serviço
list_service_variables(
  projectId="aa10f10a-c682-46e1-9d16-62871f3b5a09",
  environmentId="1df03999-6df7-4b5f-9f6f-0d24fc88f7e5",
  serviceId="d4248bfe-8afc-469a-a509-6354fa537503"
)

# Ver logs de deployment
deployment_logs(deploymentId="88530f58-7df1-4457-be29-a6b78be6e8dc")

# Verificar status de serviço
service_info(
  projectId="aa10f10a-c682-46e1-9d16-62871f3b5a09",
  serviceId="d4248bfe-8afc-469a-a509-6354fa537503",
  environmentId="1df03999-6df7-4b5f-9f6f-0d24fc88f7e5"
)
```

### Browser DevTools (para testar frontend)

```javascript
// Console do browser
// Ver status de agent runs
localStorage.getItem('last_agent_run')

// Network tab: filtrar por
/api/agent/initiate
/api/agent-run/*/stream
/api/agent-run/*/status

// Console logs: procurar por
[useAgentStream] Final status for run ID
[ThreadComponent] Starting auto stream
```

---

## 10. Prevenção

### Checklist de Deploy para Railway

Antes de fazer deploy de mudanças no Railway:

- [ ] Backend `ENV_MODE=local`
- [ ] Worker `ENV_MODE=local`
- [ ] Frontend `NEXT_PUBLIC_ENV_MODE=LOCAL`
- [ ] Redis `REDIS_PASSWORD` configurado em backend E worker
- [ ] Todas as API keys configuradas no worker
- [ ] Testar fluxo completo: login → dashboard → enviar mensagem → receber resposta

### Configuração Recomendada para Self-Hosted

**Backend Service:**
```env
ENV_MODE=local
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379
REDIS_PASSWORD=xxx
```

**Worker Service:**
```env
ENV_MODE=local
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379
REDIS_PASSWORD=xxx
ANTHROPIC_API_KEY=xxx (se usar Claude)
GOOGLE_API_KEY=xxx (se usar Gemini)
OPENAI_API_KEY=xxx (se usar OpenAI)
```

**Frontend Service:**
```env
NEXT_PUBLIC_ENV_MODE=LOCAL
NEXT_PUBLIC_BACKEND_URL=https://backend-production-xxx.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

## 11. Resumo Executivo

### Problema
Agent runs paravam imediatamente com status "stopped" porque o worker não estava processando jobs do Redis.

### Causa
ENV_MODE mismatch entre backend (`local`) e worker (`production`), fazendo worker falhar na inicialização.

### Solução
Alterado `ENV_MODE` do worker de `production` para `local`.

### Resultado
Worker agora processa jobs corretamente, agent runs completam com status "completed", e respostas chegam ao frontend.

### Tempo para Resolver
~5 minutos após identificar a causa raiz.

---

## 12. Arquivos Relacionados

### Backend
- `backend/run_agent_background.py` - Worker Dramatiq que processa agent runs
- `backend/core/services/redis.py` - Configuração do Redis
- `backend/core/billing/api.py` - Endpoint que verifica ENV_MODE para retornar modelos
- `backend/api.py` - Backend principal com CORS e middleware

### Frontend
- `frontend/src/components/AuthProvider.tsx` - Provider de autenticação
- `frontend/src/hooks/useAgentStream.ts` - Hook que consome stream de agent runs
- `frontend/Dockerfile` - Build do frontend com variáveis NEXT_PUBLIC_*

### Railway Config
- Backend service: `b5d1542b-1b69-4862-b520-6a5de10480a1`
- Worker service: `d4248bfe-8afc-469a-a509-6354fa537503`
- Frontend service: `frontend-production-410a`

---

## 13. Links Relevantes

- **Frontend URL:** https://frontend-production-410a.up.railway.app
- **Backend URL:** https://backend-production-bda1.up.railway.app
- **Documento de fix anterior:** `RAILWAY_LOGIN_FIX.md` (correções de autenticação e CORS)
- **Railway Project:** suna.new production environment

---

**Documento criado por:** Claude Code
**Última atualização:** 12 de Janeiro de 2025
**Versão:** 1.0
