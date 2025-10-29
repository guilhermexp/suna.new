# Workflow de Sincronização com Upstream

**Última Sincronização:** 2025-10-07
**Upstream:** https://github.com/kortix-ai/suna.git

## 📋 Visão Geral

Este documento descreve o processo completo para sincronizar mudanças do repositório upstream oficial (Kortix) com este fork self-hosted. O processo foi desenvolvido para minimizar riscos e preservar customizações críticas.

## ⚠️ IMPORTANTE: Customizações que NÃO devem ser removidas

Este fork contém modificações essenciais para self-hosting que **NUNCA** devem ser substituídas pelo upstream:

### 1. **Billing API - LOCAL Mode**
- **Arquivo:** `backend/core/billing/api.py`
- **Motivo:** Upstream removeu código de LOCAL mode (commit `677b02bb`)
- **Razão:** Sistema de billing local é essencial para self-hosting
- **Ação:** Sempre manter a versão local, **NUNCA** sobrescrever com upstream

### 2. **Modelo 302.AI**
- **Arquivo:** `backend/core/ai_models/registry.py`
- **Customização:** Modelo `claude-sonnet-4-5-20250929` com endpoint 302.AI
- **Detalhes:**
  ```python
  id="claude-sonnet-4-5-20250929"  # Sem provider prefix
  api_base="https://api.302.ai/cc"
  pricing: 70% mais barato (0.90 vs 3.00 input tokens)
  ```
- **Razão:** Integração custom com API 302.AI para redução de custos
- **Ação:** Preservar este modelo no registry, não remover

### 3. **Token Usage Components**
- **Arquivos:**
  - `frontend/src/components/billing/token-usage-by-threads.tsx`
  - `frontend/src/components/billing/token-usage-history.tsx`
  - `frontend/src/components/thread/token-usage-display.tsx`
- **Razão:** Upstream removeu display de tokens, mas é essencial para tracking local
- **Ação:** Manter todos os componentes de token usage

### 4. **Railway Deployment**
- **Arquivos:**
  - Todo o código de autenticação Railway
  - `RAILWAY_DEPLOYMENT.md`
  - Dockerfiles customizados
  - Configs de auth/cookies
- **Razão:** Customizações específicas para deploy no Railway
- **Ação:** Nunca substituir arquivos de infraestrutura

### 5. **Documentação Custom**
- **Arquivos:**
  - `RAILWAY_DEPLOYMENT.md`
  - `ANALISE_TOOLS_AGENTE.md`
  - Este arquivo (`UPSTREAM_SYNC_WORKFLOW.md`)
- **Razão:** Documentação específica do fork
- **Ação:** Preservar sempre

### 6. **Features Removidas do Upstream**
- **CTA Card na Sidebar** - Marketing Enterprise (irrelevante)
- **ZAI Provider** - Não usado (se aplicável)
- **Simplificações de Billing** - Quebram self-hosting

---

## 🔄 Processo de Sincronização

### Fase 1: Preparação e Vínculo com Upstream

```bash
# 1. Verificar status atual
git status
git branch

# 2. Adicionar upstream remote (se não existir)
git remote add upstream https://github.com/kortix-ai/suna.git

# Verificar remotes
git remote -v
# Deve mostrar:
# origin    https://github.com/[seu-usuario]/suna.new.git (fetch)
# upstream  https://github.com/kortix-ai/suna.git (fetch)

# 3. Buscar mudanças do upstream
git fetch upstream

# 4. Verificar branches
git branch -a
```

### Fase 2: Análise de Diferenças

```bash
# 1. Comparar commits recentes (últimos 50)
git log --oneline --graph --decorate --left-right --boundary main...upstream/main | head -100

# 2. Ver estatísticas de diferenças
git diff --stat main upstream/main | head -100

# 3. Listar arquivos modificados
git diff --name-only main upstream/main

# 4. Contar commits desde janeiro
git log upstream/main --oneline --no-merges --since="2025-01-01" | wc -l
```

### Fase 3: Identificação de Mudanças Relevantes

Analisar commits por categoria:

```bash
# Features importantes
git log upstream/main --oneline --grep="feat\|feature" --no-merges | head -30

# Correções críticas
git log upstream/main --oneline --grep="fix\|critical\|hotfix" --no-merges | head -30

# Mudanças de UI
git log upstream/main --oneline --grep="ui\|UI\|icon\|color" --no-merges | head -20

# Mudanças de billing (CUIDADO!)
git log upstream/main --oneline --grep="billing\|subscription" --no-merges | head -20

# Mudanças de models
git log upstream/main --oneline --grep="model\|sonnet\|claude" --no-merges | head -20
```

### Fase 4: Análise Detalhada de Arquivos Específicos

```bash
# Comparar arquivos críticos individualmente

# 1. Context Manager
git diff main upstream/main -- backend/core/agentpress/context_manager.py

# 2. Response Processor
git diff main upstream/main -- backend/core/agentpress/response_processor.py

# 3. Model Registry (CUIDADO - 302.AI!)
git diff main upstream/main -- backend/core/ai_models/registry.py

# 4. Billing API (NUNCA SOBRESCREVER!)
git diff main upstream/main -- backend/core/billing/api.py

# 5. Tools (verificar usage_example)
git diff --stat main upstream/main -- backend/core/tools/
```

### Fase 5: Categorização de Mudanças

Criar lista de mudanças em 3 categorias:

#### ✅ PEGAR (Seguro)
- Melhorias de performance
- Novos tools úteis
- Correções de bugs
- Otimizações de prompt caching
- Novos modelos (se compatível com local)

#### ⚠️ AVALIAR (Cuidado)
- Mudanças em arquivos compartilhados (registry, billing)
- Remoção de features (verificar se usamos)
- Refatorações grandes
- Mudanças de schema/database

#### ❌ NÃO PEGAR (Perigoso)
- Remoções de LOCAL mode
- Simplificações de billing
- Remoções de token tracking
- Features Enterprise/Cloud-only

### Fase 6: Aplicação de Mudanças

#### Método 1: Cherry-pick de Commits Específicos

```bash
# Para commits isolados e seguros
git cherry-pick <commit-hash>

# Se houver conflito:
git status
# Resolver conflitos manualmente
git add <arquivos-resolvidos>
git cherry-pick --continue
```

#### Método 2: Substituição Direta de Arquivos (Usado em 2025-10-04)

```bash
# Para arquivos que podem ser totalmente substituídos
git show upstream/main:<caminho-do-arquivo> > <caminho-do-arquivo>

# Exemplo:
git show upstream/main:backend/core/agentpress/context_manager.py > backend/core/agentpress/context_manager.py
```

#### Método 3: Aplicação Manual de Mudanças Específicas

Para arquivos com customizações (como `registry.py`):

```bash
# 1. Ver diferenças
git diff main upstream/main -- <arquivo>

# 2. Aplicar manualmente apenas as partes relevantes
# Usar editor de código para copiar/colar mudanças específicas

# 3. Preservar customizações (302.AI, LOCAL mode, etc)
```

### Fase 7: Mudanças Aplicadas em 2025-10-04

As seguintes mudanças foram aplicadas com sucesso:

#### 1. Frontend do Expand Message Tool ⭐ ALTA
```bash
# Criados 3 arquivos novos:
frontend/src/components/thread/tool-views/expand-message-tool/ExpandMessageToolView.tsx
frontend/src/components/thread/tool-views/expand-message-tool/_utils.ts

# Modificado:
frontend/src/components/thread/tool-views/wrapper/ToolViewRegistry.tsx
```

#### 2. Context Manager Melhorias ⭐ ALTA
```bash
# Substituído completamente:
backend/core/agentpress/context_manager.py

# Mudanças:
- Parâmetro uncompressed_total_token_count (evita recálculo)
- Parâmetro system_prompt (precisão de contagem)
- Compressão determinística (melhora cache hits)
- Recursão otimizada
```

#### 3. Response Processor Melhorias ⭐ MÉDIA
```bash
# Substituído completamente:
backend/core/agentpress/response_processor.py

# Mudanças:
- _estimate_token_usage() (fallback em crashes)
- llm_response_id único por call
- Melhor tracking de custos
```

#### 4. Dark Mode Fix nos Icons 🎨 BAIXA
```bash
# Editado:
frontend/src/lib/model-provider-icons.tsx

# Mudanças:
- dark:brightness-0 dark:invert
- dark:bg-zinc-800, dark:border-zinc-700
```

#### 5. Remoção do decorator @usage_example 🗑️
```bash
# Modificados 39+ arquivos:
backend/core/agentpress/tool.py
backend/core/agentpress/tool_registry.py
backend/core/tools/**/*.py

# Resultado:
- Removido SchemaType.USAGE_EXAMPLE
- Removido decorator @usage_example
- Economia de milhares de tokens por request
```

### Fase 8: Verificação e Testes

```bash
# 1. Verificar que arquivos críticos não foram alterados
git diff HEAD -- backend/core/billing/api.py
# Deve estar vazio ou mostrar apenas mudanças intencionais

# 2. Verificar modelo 302.AI preservado
grep -n "302.ai\|302.AI" backend/core/ai_models/registry.py
# Deve mostrar o modelo custom

# 3. Verificar token usage components
ls -la frontend/src/components/billing/token-usage*
# Devem existir

# 4. Testar build (se aplicável)
cd frontend && npm run build
cd ../backend && python -m pytest

# 5. Verificar imports
grep -r "usage_example" backend/core/
# Deve retornar 0 resultados
```

### Fase 9: Commit e Documentação

```bash
# 1. Revisar mudanças
git status
git diff

# 2. Adicionar arquivos
git add <arquivos-modificados>

# 3. Commit com mensagem descritiva
git commit -m "Sync with upstream 2025-10-04: context manager, response processor, expand message tool, usage_example removal

- Add expand message tool frontend (ExpandMessageToolView, utils)
- Update context manager with prompt caching optimizations
- Update response processor with token estimation fallback
- Apply dark mode fixes to model provider icons
- Remove @usage_example decorator (39 files, saves tokens)

Preserved customizations:
- 302.AI model configuration
- Billing API LOCAL mode
- Token usage display components
- Railway deployment configs"

# 4. Atualizar este documento com data
# Editar UPSTREAM_SYNC_WORKFLOW.md > Última Sincronização
```

### Fase 10: Desvinculação do Upstream (Opcional)

```bash
# Se quiser remover o upstream remote após sincronização:
git remote remove upstream

# Verificar:
git remote -v
# Deve mostrar apenas origin
```

---

## 📊 Checklist de Sincronização

Use este checklist para cada sincronização:

### Preparação
- [ ] Fazer backup da branch main local
- [ ] Verificar que não há mudanças uncommitted
- [ ] Adicionar upstream remote
- [ ] Fetch upstream

### Análise
- [ ] Comparar logs de commits (últimos 50+)
- [ ] Verificar estatísticas de diff
- [ ] Identificar commits por categoria (feat, fix, ui, billing)
- [ ] Criar lista de arquivos modificados críticos

### Categorização
- [ ] Listar mudanças SEGURAS (✅ pegar)
- [ ] Listar mudanças AVALIAR (⚠️ cuidado)
- [ ] Listar mudanças PERIGOSAS (❌ não pegar)
- [ ] Verificar mudanças em arquivos customizados:
  - [ ] `billing/api.py` - Preservar LOCAL mode
  - [ ] `ai_models/registry.py` - Preservar 302.AI
  - [ ] Token usage components - Preservar
  - [ ] Railway configs - Preservar

### Aplicação
- [ ] Aplicar mudanças seguras primeiro
- [ ] Testar após cada mudança significativa
- [ ] Resolver conflitos manualmente
- [ ] Documentar cada decisão importante

### Verificação
- [ ] Modelo 302.AI ainda existe
- [ ] Billing LOCAL mode intacto
- [ ] Token usage components presentes
- [ ] Railway configs preservados
- [ ] Build passa (frontend e backend)
- [ ] Nenhum import quebrado

### Finalização
- [ ] Commit com mensagem detalhada
- [ ] Atualizar data neste documento
- [ ] Atualizar seção "Mudanças Aplicadas"
- [ ] Remover upstream remote (opcional)

---

## 🚨 Sinais de Alerta

Se encontrar estas mudanças no upstream, **PARE** e avalie cuidadosamente:

### 🔴 Perigo Crítico
- Remoção de código `if config.ENV_MODE == EnvMode.LOCAL:`
- Remoção de `ModelProvider.ZAI` (se usado)
- Simplificação de billing API
- Remoção de token tracking/usage
- Mudanças em estrutura de database/migrations

### 🟡 Atenção
- Refatorações grandes em `registry.py`
- Mudanças em `ai_models/ai_models.py`
- Novos requirements/dependencies
- Mudanças em Dockerfiles
- Alterações em auth flow

### 🟢 Geralmente Seguro
- Novos tools em `backend/core/tools/`
- Melhorias de UI/UX
- Correções de bugs isolados
- Otimizações de performance
- Novos testes

---

## 💡 Dicas e Boas Práticas

1. **Sempre faça backup antes** de começar a sincronização
2. **Teste incrementalmente** - não aplique todas mudanças de uma vez
3. **Documente decisões** - anote por que pegou ou não pegou cada mudança
4. **Preserve customizações** - sempre priorize funcionalidades self-hosted
5. **Use branches** - crie uma branch `sync-upstream-YYYY-MM-DD` para testar
6. **Compare antes e depois** - use `git diff` extensivamente
7. **Mantenha este documento atualizado** - ajuda sincronizações futuras

---

## 📚 Recursos Úteis

### Comandos Git Úteis
```bash
# Ver commit específico
git show <commit-hash>

# Ver apenas arquivos de um commit
git show --name-only <commit-hash>

# Ver diff entre commits
git diff <commit1>..<commit2>

# Ver histórico de um arquivo
git log --follow -p -- <arquivo>

# Ver quem modificou cada linha
git blame <arquivo>
```

### Atalhos para Análise Rápida
```bash
# Commits desde última sync (ajustar data)
git log upstream/main --oneline --no-merges --since="2025-10-04" | wc -l

# Arquivos mais modificados
git diff --stat main upstream/main | sort -k3 -rn | head -20

# Procurar commits por autor
git log upstream/main --author="marko-kraemer" --oneline | head -20
```

---

## 📝 Histórico de Sincronizações

### 2025-10-07 (Sincronização Completa)
- **Commits analisados:** 22 commits desde 2025-10-04
- **Mudanças aplicadas:** 5 commits
  - ✅ `ae81e8e4` - Model Preservation (preserva modelo ao editar agente)
  - ✅ `89af5949` - Remove 30min stream timeout frontend
  - ✅ `3b3b6e69` - Revert broken safe_token_counter (correção crítica)
  - ✅ `8d7e85de` - Backend Simplification/AgentLoader (elimina 450+ linhas duplicadas)
  - ✅ `0ec17b0d` - Workflow/Playbook Removal (remove 14,281 linhas, 96 arquivos)
- **Mudanças NÃO aplicadas:**
  - ❌ `89a4996d` - Trigger Fix (conflitos complexos, não essencial)
- **Problemas corrigidos:**
  - 🐛 Commit `dac29b46` importava `safe_token_counter` inexistente → Revertido
  - ✅ Voltou a usar `litellm.token_counter` corretamente
- **Refatorações aplicadas:**
  - 🏗️ Criado `AgentLoader` - consolida lógica de carregamento de agentes
  - 🗑️ Removido sistema completo de workflows/playbooks - usuário não usa
  - ✨ Novos utilitários: `icon_generator.py`, `limits_checker.py`, `mcp_helpers.py`, `project_helpers.py`, `run_management.py`
- **Conflitos resolvidos manualmente:**
  - `suna_config.py` - Removida linha `workflow_tool: True`
  - `event-config.tsx` - Removido código de workflow (43 linhas)
  - `schedule-config.tsx` - Removido código de workflow (44 linhas)
- **Customizações preservadas:** ✅ Billing LOCAL, ✅ 302.AI Model, ✅ Token Usage Components
- **Resultado:** ✅ Sucesso completo - todas refatorações upstream aplicadas, customizações intactas

### 2025-10-04
- **Commits processados:** ~2060 desde jan/2025
- **Mudanças aplicadas:** 5 categorias principais
- **Arquivos modificados:** ~110 arquivos
- **Customizações preservadas:** Billing LOCAL, 302.AI, Token Usage, Railway
- **Resultado:** ✅ Sucesso - todas mudanças seguras aplicadas

---

## 💡 Lições Aprendidas

### 2025-10-07 - AgentLoader e Workflow Removal
- **Dependências entre commits:** Upstream criou `agent_loader.py` e depois modificou no commit de remoção de workflows. Aplicar commits dependentes fora de ordem causa conflitos.
- **Solução:** Aplicar commits em sequência respeitando dependências (primeiro criar arquivo, depois modificar).
- **Conflitos simples:** Remoção de features não usadas (workflows) gera conflitos mínimos e fáceis de resolver.

---

**Última atualização deste documento:** 2025-10-07
