# Guia Completo: Adicionar Novos Modelos no Suna

Este guia documenta o processo completo para adicionar novos modelos LLM no Suna, incluindo casos especiais e troubleshooting.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Processo Padrão](#processo-padrão)
3. [Casos Especiais](#casos-especiais)
4. [Troubleshooting LiteLLM](#troubleshooting-litellm)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Checklist Final](#checklist-final)

---

## Visão Geral

### Arquitetura do Sistema de Modelos

O Suna usa uma arquitetura em 3 camadas:

```
┌─────────────────────────────────────────────┐
│  Frontend (Model Selector)                  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Model Registry (registry.py)               │
│  - Model definitions                        │
│  - Pricing, capabilities, config            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Model Manager (manager.py)                 │
│  - get_litellm_params()                     │
│  - API key injection                        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  LLM Service (llm.py)                       │
│  - make_llm_api_call()                      │
│  - LiteLLM router                           │
└─────────────────────────────────────────────┘
```

### Arquivos Importantes

- `backend/core/ai_models/registry.py` - Registro de modelos
- `backend/core/ai_models/ai_models.py` - Definições e config
- `backend/core/services/llm.py` - Interface LiteLLM
- `backend/core/utils/config.py` - Variáveis de ambiente
- `backend/.env` - API keys
- `backend/.env.example` - Documentação de env vars

---

## Processo Padrão

### 1. Adicionar Variável de Ambiente (config.py)

**Arquivo:** `backend/core/utils/config.py`

```python
# Localizar seção de API keys (linha ~258)
# Adicionar após as outras keys:

NOME_PROVIDER_API_KEY: Optional[str] = None  # Descrição opcional
```

**Exemplo:**
```python
AI302_API_KEY: Optional[str] = None  # 302.AI discounted Claude pricing
OPENROUTER_API_KEY: Optional[str] = None
```

### 2. Registrar Modelo (registry.py)

**Arquivo:** `backend/core/ai_models/registry.py`

**Localizar:** Método `_initialize_models()` (linha ~22)

**Template básico:**
```python
self.register(
    Model(
        id="provider/model-name",  # Ex: anthropic/claude-3-opus
        name="Display Name",       # Ex: "Claude 3 Opus"
        provider=ModelProvider.PROVIDER_NAME,
        aliases=[
            "alias1",
            "alias2",
            "Display Name",
        ],
        context_window=128000,
        max_output_tokens=4096,  # Opcional
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.VISION,  # Se suportar
            ModelCapability.THINKING,  # Se suportar
        ],
        pricing=ModelPricing(
            input_cost_per_million_tokens=3.00,
            output_cost_per_million_tokens=15.00,
        ),
        tier_availability=["paid"],  # ou ["free", "paid"]
        priority=100,  # Maior = aparece primeiro
        recommended=False,  # True para marcar como recomendado
        enabled=True,
    )
)
```

### 3. Configurar API Key (ai_models.py)

**Arquivo:** `backend/core/ai_models/ai_models.py`

**Localizar:** Método `get_litellm_params()`, seção de API keys (linha ~115)

```python
# Apply provider-specific API key if not already in override_params
if "api_key" not in override_params or override_params.get("api_key") is None:
    if self.provider == ModelProvider.ZAI and config.ZAI_API_KEY:
        params["api_key"] = config.ZAI_API_KEY
    # Adicionar aqui:
    elif self.provider == ModelProvider.SEU_PROVIDER and config.SEU_PROVIDER_API_KEY:
        params["api_key"] = config.SEU_PROVIDER_API_KEY
```

### 4. Adicionar Provider na Lista (llm.py)

**Arquivo:** `backend/core/services/llm.py`

**Localizar:** Função `setup_api_keys()` (linha ~38)

```python
def setup_api_keys() -> None:
    """Set up API keys from environment variables."""
    providers = [
        "OPENAI",
        "ANTHROPIC",
        # ... outros ...
        "SEU_PROVIDER",  # Adicionar aqui
    ]
```

### 5. Documentar no .env.example

**Arquivo:** `backend/.env.example`

**Localizar:** Seção "LLM PROVIDERS" (linha ~21)

```bash
##### LLM PROVIDERS (At least one is functionally REQUIRED)
# ...
SEU_PROVIDER_API_KEY=  # Descrição do provider
```

### 6. Configurar .env Local

**Arquivo:** `backend/.env`

```bash
SEU_PROVIDER_API_KEY=sua-api-key-aqui
```

### 7. Rebuild e Restart

```bash
cd /caminho/para/suna.new
docker-compose build backend worker
docker-compose up -d backend worker
```

---

## Casos Especiais

### Caso 1: Custom API Endpoint (Exemplo: Z.AI, 302.AI)

Quando o provider usa um endpoint customizado diferente do padrão.

**Problema:** LiteLLM adiciona automaticamente paths ao `api_base`.

**Solução:**

```python
self.register(
    Model(
        # IMPORTANTE: Para Anthropic-compatible, use o model ID sem "anthropic/" prefix
        id="claude-model-name",  # Não "anthropic/claude-model-name"
        name="Model Name",
        provider=ModelProvider.ANTHROPIC,
        # ...
        config=ModelConfig(
            # LiteLLM adiciona "/v1/messages" automaticamente
            # Se endpoint completo é https://api.custom.com/v1/messages
            # Então api_base deve ser https://api.custom.com
            api_base="https://api.custom.com",  # SEM /v1 no final!
            extra_headers={
                "anthropic-beta": "context-1m-2025-08-07",
                "anthropic-version": "2023-06-01",
            },
        ),
    )
)
```

**Detecção de API key para custom endpoint:**

```python
# Em ai_models.py, get_litellm_params()
elif self.provider == ModelProvider.ANTHROPIC and self.config and self.config.api_base and "custom.com" in self.config.api_base and config.CUSTOM_API_KEY:
    params["api_key"] = config.CUSTOM_API_KEY
```

### Caso 2: OpenAI-Compatible Provider (Exemplo: Z.AI)

Para providers que implementam API compatível com OpenAI.

```python
self.register(
    Model(
        id="openai/model-name",  # Usa prefix openai/
        name="Model Display Name",
        provider=ModelProvider.CUSTOM_PROVIDER,  # Provider interno diferente
        # ...
        config=ModelConfig(
            api_base="https://api.custom.com/path",
        ),
    )
)
```

### Caso 3: Múltiplas Versões do Mesmo Modelo

Quando você quer oferecer o mesmo modelo de diferentes providers.

```python
# Versão normal
self.register(
    Model(
        id="anthropic/claude-sonnet-4-5-20250929",
        name="Sonnet 4.5",
        # ... configuração normal
        priority=101,
        recommended=False,
    )
)

# Versão com desconto
self.register(
    Model(
        id="claude-sonnet-4-5-20250929",  # ID diferente
        name="Sonnet 4.5 (Discount)",     # Nome diferente
        aliases=["anthropic/claude-sonnet-4-5-20250929-discount"],  # Alias para compatibilidade
        # ... mesmas capabilities
        pricing=ModelPricing(
            input_cost_per_million_tokens=0.90,  # Preço diferente
            output_cost_per_million_tokens=4.50,
        ),
        priority=102,  # Maior prioridade
        recommended=True,  # Marcar como recomendado
        config=ModelConfig(
            api_base="https://api.discount-provider.com",
            # ...
        ),
    )
)
```

---

## Troubleshooting LiteLLM

### Problema 1: URL Duplicada

**Sintoma:**
```
Error: 404 Not Found for url 'https://api.custom.com/v1/v1/messages'
```

**Causa:** LiteLLM adiciona `/v1/messages` ao `api_base` automaticamente.

**Solução:**
```python
# ❌ ERRADO
api_base="https://api.custom.com/v1"

# ✅ CORRETO
api_base="https://api.custom.com"
```

### Problema 2: "No Available Channels"

**Sintoma:**
```json
{"error": {"err_code": -10008, "message": "No available channels currently"}}
```

**Causas possíveis:**
1. API key inválida ou sem crédito
2. Endpoint incorreto
3. Headers faltando

**Debug:**
```bash
# Testar endpoint direto com curl
curl -X POST "https://api.custom.com/v1/messages" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "model-name",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
  }'
```

### Problema 3: API Key Não Detectada

**Sintoma:** Model call fails com "unauthorized" mas .env tem a key.

**Debug:**
```python
# Criar script de teste: test_api_key.py
from core.utils.config import config

print(f"API Key loaded: {config.YOUR_API_KEY[:15] if config.YOUR_API_KEY else 'NOT FOUND'}...")
```

**Possíveis causas:**
1. .env não foi lido pelo container (precisa rebuild)
2. Nome da variável diferente em config.py vs .env
3. API key handler não foi adicionado em `get_litellm_params()`

### Problema 4: Model ID Inválido

**Sintoma:** LiteLLM não reconhece o provider pelo ID.

**Regras de ID:**
- **Anthropic:** Pode usar `anthropic/model` OU `model` (para custom endpoints)
- **OpenAI:** Use `openai/model` sempre
- **Custom OpenAI-compatible:** Use `openai/model` com `api_base`
- **Outros:** Siga convenção `provider/model`

### Ativando Debug Logs

**Temporário (para debug):**

```python
# Em llm.py, descomentar:
os.environ['LITELLM_LOG'] = 'DEBUG'
litellm.set_verbose = True

# Rebuild e verificar logs:
docker logs sunanew-backend-1 2>&1 | grep -i litellm
```

---

## Exemplos Práticos

### Exemplo 1: 302.AI (Custom Anthropic Endpoint)

```python
# 1. config.py
AI302_API_KEY: Optional[str] = None

# 2. registry.py
self.register(
    Model(
        id="claude-sonnet-4-5-20250929",  # Sem "anthropic/" prefix
        name="Sonnet 4.5 (302.AI)",
        provider=ModelProvider.ANTHROPIC,
        aliases=["302ai/claude-sonnet-4.5", "anthropic/claude-sonnet-4-5-20250929-302ai"],
        context_window=1_000_000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.VISION,
            ModelCapability.THINKING,
        ],
        pricing=ModelPricing(
            input_cost_per_million_tokens=0.90,
            output_cost_per_million_tokens=4.50,
        ),
        tier_availability=["paid"],
        priority=102,
        recommended=True,
        enabled=True,
        config=ModelConfig(
            api_base="https://api.302.ai/cc",  # LiteLLM adiciona /v1/messages
            extra_headers={
                "anthropic-beta": "context-1m-2025-08-07",
                "anthropic-version": "2023-06-01",
            },
        ),
    )
)

# 3. ai_models.py
elif self.provider == ModelProvider.ANTHROPIC and self.config and self.config.api_base and "302.ai" in self.config.api_base and config.AI302_API_KEY:
    params["api_key"] = config.AI302_API_KEY

# 4. llm.py
providers = [
    # ...
    "AI302",
]

# 5. .env
AI302_API_KEY=sk-your-key-here
```

### Exemplo 2: Z.AI GLM-4.6 (OpenAI-Compatible)

```python
# 1. config.py
ZAI_API_KEY: Optional[str] = None

# 2. registry.py
self.register(
    Model(
        id="openai/glm-4.6",  # Usa openai/ prefix
        name="Z.AI GLM-4.6",
        provider=ModelProvider.ZAI,  # Provider interno diferente
        aliases=["glm-4.6", "zai/glm-4.6"],
        context_window=200_000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.THINKING,
        ],
        pricing=ModelPricing(
            input_cost_per_million_tokens=0.50,
            output_cost_per_million_tokens=2.00,
        ),
        tier_availability=["paid"],
        priority=93,
        enabled=True,
        config=ModelConfig(
            api_base="https://api.z.ai/api/coding/paas/v4"
        ),
    )
)

# 3. ai_models.py
if self.provider == ModelProvider.ZAI and config.ZAI_API_KEY:
    params["api_key"] = config.ZAI_API_KEY

# 4. .env
ZAI_API_KEY=your-zai-key
```

### Exemplo 3: Modelo Padrão (Google Gemini)

```python
# 1. config.py (já existe)
GEMINI_API_KEY: Optional[str] = None

# 2. registry.py
self.register(
    Model(
        id="gemini/gemini-2.5-pro",
        name="Gemini 2.5 Pro",
        provider=ModelProvider.GOOGLE,
        aliases=["gemini-2.5-pro", "Gemini 2.5 Pro"],
        context_window=2_000_000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.VISION,
            ModelCapability.STRUCTURED_OUTPUT,
        ],
        pricing=ModelPricing(
            input_cost_per_million_tokens=1.25,
            output_cost_per_million_tokens=10.00,
        ),
        tier_availability=["paid"],
        priority=102,
        recommended=True,
        enabled=True,
    )
)

# 3. LiteLLM usa GEMINI_API_KEY automaticamente
# 4. .env
GEMINI_API_KEY=your-google-api-key
```

---

## Checklist Final

Antes de considerar o modelo pronto, verifique:

### Pré-Deploy
- [ ] Variável adicionada em `config.py`
- [ ] Modelo registrado em `registry.py`
- [ ] API key handler em `ai_models.py` (se necessário)
- [ ] Provider adicionado em `llm.py`
- [ ] Documentado em `.env.example`
- [ ] API key configurada em `.env`

### Configuração
- [ ] `id` correto para o tipo de provider
- [ ] `name` descritivo e único
- [ ] `aliases` incluem variações comuns
- [ ] `context_window` correto
- [ ] `capabilities` completas e corretas
- [ ] `pricing` atualizado
- [ ] `priority` adequado (maior = aparece primeiro)
- [ ] `recommended` marcado se apropriado
- [ ] `api_base` SEM paths que LiteLLM adiciona (se custom endpoint)
- [ ] `extra_headers` incluem todos headers necessários

### Testing
- [ ] Build sem erros: `docker-compose build backend worker`
- [ ] Modelo aparece no registry:
  ```bash
  docker exec sunanew-backend-1 uv run python -c "
  from core.ai_models import registry
  model = registry.get('seu-model-id')
  print(f'Found: {model.name if model else \"NOT FOUND\"}')"
  ```
- [ ] API key carregada:
  ```bash
  docker exec sunanew-backend-1 uv run python -c "
  from core.utils.config import config
  print(f'Key: {config.YOUR_API_KEY[:15] if config.YOUR_API_KEY else \"NOT FOUND\"}...')"
  ```
- [ ] LiteLLM params corretos:
  ```bash
  docker exec sunanew-backend-1 uv run python -c "
  from core.ai_models import registry
  model = registry.get('seu-model-id')
  params = model.get_litellm_params()
  print(f'api_base: {params.get(\"api_base\")}')"
  ```
- [ ] Teste direto do endpoint com curl (antes de testar no Suna)
- [ ] Teste no frontend do Suna
- [ ] Modelo aparece no seletor
- [ ] Consegue enviar mensagem e receber resposta
- [ ] Pricing aparece corretamente
- [ ] Recommended badge aparece (se marcado)

### Debug (se falhar)
- [ ] Logs do backend: `docker logs sunanew-backend-1 2>&1 | grep -i "model-name"`
- [ ] Logs do worker: `docker logs sunanew-worker-1 2>&1 | grep -i "error"`
- [ ] Ativar debug LiteLLM temporariamente em `llm.py`
- [ ] Verificar URL completa que LiteLLM está chamando
- [ ] Testar endpoint direto com curl usando mesmos headers
- [ ] Comparar request curl (que funciona) vs request LiteLLM (que falha)

---

## Comandos Úteis

```bash
# Rebuild apenas backend
docker-compose build backend worker

# Restart rápido
docker-compose restart backend worker

# Rebuild completo
docker-compose down
docker-compose build --no-cache backend worker
docker-compose up -d

# Ver logs em tempo real
docker logs -f sunanew-backend-1

# Buscar erro específico
docker logs sunanew-backend-1 2>&1 | grep -i "error"

# Testar dentro do container
docker exec sunanew-backend-1 uv run python -c "seu código aqui"

# Copiar arquivo para container (para testes)
docker cp local-file.py sunanew-backend-1:/app/test.py

# Ver modelos registrados
docker exec sunanew-backend-1 uv run python -c "
from core.ai_models import registry
for m in registry.get_all():
    print(f'{m.id} - {m.name}')"
```

---

## Notas Importantes

1. **LiteLLM Path Injection:** LiteLLM automaticamente adiciona paths ao `api_base`. Para Anthropic, adiciona `/v1/messages`. Sempre teste a URL final!

2. **Provider Detection:** O LiteLLM detecta o provider pelo prefix do `id` (ex: `anthropic/`, `openai/`). Para custom endpoints, pode ser necessário usar o ID sem prefix.

3. **API Key Priority:** API key pode vir de 3 lugares (em ordem):
   - `override_params` no make_llm_api_call
   - Model config em `get_litellm_params()`
   - Environment variable (PROVIDER_API_KEY)

4. **Cache Invalidation:** Mudanças em `registry.py` requerem rebuild do Docker image, não apenas restart.

5. **Aliases:** São úteis para:
   - Compatibilidade com código antigo
   - Permitir múltiplas formas de referenciar o modelo
   - Migration entre versões

6. **Priority:** Controla ordem no frontend. Use gaps (100, 102, 105) para permitir inserções futuras.

7. **Recommended:** Apenas 1-2 modelos devem ser "recommended" por vez. É o que aparece com badge especial no frontend.

---

## Template Rápido

Para adicionar um modelo rapidamente, copie e preencha:

```python
# 1. config.py - Linha ~258
PROVIDER_API_KEY: Optional[str] = None

# 2. registry.py - Dentro de _initialize_models()
self.register(
    Model(
        id="provider/model-id",
        name="Model Display Name",
        provider=ModelProvider.PROVIDER,
        aliases=["alias1", "alias2"],
        context_window=128000,
        capabilities=[ModelCapability.CHAT, ModelCapability.FUNCTION_CALLING],
        pricing=ModelPricing(
            input_cost_per_million_tokens=0.00,
            output_cost_per_million_tokens=0.00,
        ),
        tier_availability=["paid"],
        priority=100,
        recommended=False,
        enabled=True,
    )
)

# 3. ai_models.py - get_litellm_params(), linha ~115
elif self.provider == ModelProvider.PROVIDER and config.PROVIDER_API_KEY:
    params["api_key"] = config.PROVIDER_API_KEY

# 4. llm.py - setup_api_keys(), linha ~38
providers = [..., "PROVIDER"]

# 5. .env
PROVIDER_API_KEY=your-key-here

# 6. Rebuild
docker-compose build backend worker
docker-compose up -d backend worker
```

---

**Última atualização:** 2025-10-03
**Casos testados:** 302.AI, Z.AI, Gemini, Grok, GPT-5
**LiteLLM Version:** Latest (com Router)
