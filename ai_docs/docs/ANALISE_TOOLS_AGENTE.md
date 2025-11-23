# Análise Completa: Tools e Consumo de Contexto do Agente

## 📊 Resumo Executivo

**Data da Análise:** 2025-10-04
**Sistema Analisado:** Suna Agent Workers
**Arquivo Principal:** `backend/core/run.py`

---

## 1. Inventário Completo de Tools

### 🔧 Core Tools (sempre habilitadas)
- **Total:** 3 tools, 12 funções
- **Principais:**
  - `message_tool.py`: 6 funções
  - `task_list_tool.py`: 5 funções
  - `expand_msg_tool`: 1 função

### 🛠️ Sandbox Tools
- **Total:** 18 tools, 75 funções
- **Top 5:**
  1. `sb_browser_tool.py`: **18 funções** ⚠️ (maior consumo)
  2. `sb_kb_tool.py`: 10 funções
  3. `sb_files_tool.py`: 6 funções
  4. `sb_sheets_tool.py`: 6 funções
  5. `sb_presentation_tool.py`: 5 funções

### 🔌 Utility Tools (condicionais - dependem de API keys)
- **Total:** 6 tools, 8 funções
- Incluem: data providers, search tools (people, company, paper)

### 🤖 Agent Builder Tools (apenas se agent_id fornecido)
- **Total:** 5 tools, 21 funções
- **Principais:**
  - `trigger_tool.py`: 7 funções
  - `workflow_tool.py`: 5 funções
  - `credential_profile_tool.py`: 4 funções

### 🎯 Suna-specific Tools
- **Total:** 1 tool, 3 funções
- `agent_creation_tool`

---

## 2. Consumo de Contexto/Tokens

### 📝 System Prompt Base
```
Caracteres: 102,813
Tokens:     ~25,703
Arquivo:    core/prompts/prompt.py
```

### 🛠️ Agent Builder Prompt (quando habilitado)
```
Caracteres: 20,651
Tokens:     ~5,162
Arquivo:    core/prompts/agent_builder_prompt.py
```

### 🔧 Schemas OpenAPI das Funções
```
Total de funções:        119
Tokens por função:       ~350 (média)
Total de tokens:         ~41,650
```

### 🌐 MCP Tools (variável por agente)
```
Servidores típicos:      0-10
Funções por servidor:    5-50
Estimativa (3 servers):  ~9,000 tokens
```

### 📚 Knowledge Base (quando habilitada)
```
Estimativa:             5,000-20,000 tokens
```

---

## 3. Estimativas Totais de Consumo

| Configuração | Tokens Estimados |
|-------------|------------------|
| **Mínima** (prompt + tools) | ~67,353 |
| **+ Builder Tools** | ~72,515 |
| **+ MCPs (3 servers)** | ~81,515 |
| **+ Knowledge Base (avg)** | ~91,515 |
| **🔴 MÁXIMO ESTIMADO** | **~91,515 tokens** |

> ⚠️ **ATENÇÃO:** Isso NÃO inclui:
> - Histórico de mensagens da thread
> - Exemplos de uso de tools (usage_examples)
> - Contexto adicional de conversação

---

## 4. Análise Detalhada por Categoria

### Top 10 Tools com Mais Funções

| # | Tool | Funções | Tokens Estimados |
|---|------|---------|------------------|
| 1 | sb_browser_tool.py | 18 | ~6,300 |
| 2 | sb_kb_tool.py | 10 | ~3,500 |
| 3 | trigger_tool.py | 7 | ~2,450 |
| 4 | message_tool.py | 6 | ~2,100 |
| 5 | sb_files_tool.py | 6 | ~2,100 |
| 6 | sb_sheets_tool.py | 6 | ~2,100 |
| 7 | task_list_tool.py | 5 | ~1,750 |
| 8 | sb_presentation_tool.py | 5 | ~1,750 |
| 9 | sb_docs_tool.py | 5 | ~1,750 |
| 10 | sb_web_dev_tool.py | 5 | ~1,750 |

---

## 5. Fluxo de Inicialização (Logs)

### Localização no Código
```python
# backend/core/run.py
class AgentRunner:
    async def setup_tools(self):
        tool_manager = ToolManager(...)
        tool_manager.register_all_tools(agent_id=agent_id, disabled_tools=disabled_tools)
```

### Sequência de Registro de Tools

1. **Core Tools** (linha 100-104)
   ```python
   - ExpandMessageTool
   - MessageTool
   - TaskListTool
   ```

2. **Sandbox Tools** (linha 106-140)
   - Verifica se tool está em `disabled_tools`
   - Checa se há controle granular de métodos
   - Registra via `thread_manager.add_tool()`

3. **Utility Tools** (linha 142-182)
   - Condicionais baseadas em API keys
   - `config.RAPID_API_KEY` → data_providers_tool
   - `config.EXA_API_KEY` → search tools

4. **Agent Builder Tools** (linha 184-215)
   - Apenas se `agent_id` fornecido
   - Requer `DBConnection`

5. **MCP Tools** (linha 269-346)
   ```python
   await mcp_wrapper_instance.initialize_and_register_tools()
   # Log: "⚡ Registered X MCP tools (Redis cache enabled)"
   ```

### Log Típico de Inicialização
```
📝 System message built once: 102813 chars
⚡ Registered 119 MCP tools (Redis cache enabled)
✅ Registered agent_config_tool with methods: [...]
```

---

## 6. Descobertas Importantes

### ✅ Pontos Positivos
- Sistema modular com controle granular por agente
- Cache Redis para MCPs (reduz latência)
- Possibilidade de desabilitar tools não utilizadas
- Método `_get_enabled_methods_for_tool()` permite controle fino

### ⚠️ Pontos de Atenção
- **System prompt muito grande:** 102,813 chars (~25k tokens)
- **sb_browser_tool sozinha:** 18 funções (6,300 tokens)
- **Total de funções:** 100+ na configuração completa
- **Risco de ultrapassar window:** Com MCPs e KB pode chegar a 90k+ tokens

### 🔍 Observações Técnicas
1. Tools são registradas via decoradores `@openapi_schema`
2. Cada schema tem ~200-500 tokens (média 350)
3. System prompt é construído uma única vez no início
4. MCPs são inicializados em paralelo (performance)
5. Knowledge base é adicionada dinamicamente ao prompt

---

## 7. Recomendações

### 🚀 Otimizações Imediatas
1. **Reduzir System Prompt**
   - Meta: 50k-60k chars (redução de 40-50%)
   - Remover seções redundantes
   - Mover exemplos para usage_examples separados

2. **Lazy Loading de Tools**
   - Carregar tools sob demanda
   - Priorizar top 20 tools mais usadas

3. **Consolidação de Funções**
   - `sb_browser_tool`: agrupar funções similares
   - Criar "tool sets" por tipo de tarefa

### 📊 Telemetria Necessária
1. Adicionar logging de:
   - Quais tools são realmente usadas
   - Frequência de chamadas por função
   - Tempo de inicialização por tool

2. Métricas a coletar:
   - Token usage por categoria
   - Cache hit rate dos MCPs
   - Tempo de resposta com/sem tools

### 🎯 Abordagem Futura
- **Tool Sets Predefinidos:**
  - "Developer Set" (shell, files, deploy)
  - "Content Creator Set" (vision, presentation, docs)
  - "Research Set" (search, kb, web)
  - "Builder Set" (agent config, mcp, workflows)

---

## 8. Arquivos Importantes

### Código Principal
```
backend/core/run.py                    # Orchestração principal
backend/core/agentpress/tool_registry.py  # Registro de tools
backend/core/prompts/prompt.py         # System prompt base
backend/core/prompts/agent_builder_prompt.py  # Builder prompt
```

### Tools Directory
```
backend/core/tools/                    # All tool implementations
backend/core/tools/agent_builder_tools/  # Builder-specific tools
backend/core/tools/mcp_tool_wrapper.py   # MCP integration
```

### Workers
```
backend/run_agent_background.py        # Background execution
backend/worker_health.py               # Health checks
```

---

## 📈 Métricas Finais

```
TOTAL DE TOOLS:     33
TOTAL DE FUNÇÕES:   119
TOKEN CONSUMPTION:  67k-91k (varia por config)
SYSTEM PROMPT:      25k tokens
TOOLS SCHEMAS:      41k tokens
MCP TOOLS:          0-9k tokens
KNOWLEDGE BASE:     0-20k tokens
```

---

**Gerado em:** 2025-10-04
**Comando usado:** Análise do código-fonte + contagem via grep
**Base de dados:** `core/run.py`, `core/tools/*.py`
