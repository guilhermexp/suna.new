# GLM-4.6 Anthropic API Integration

**Data**: 2025-10-07
**Status**: ✅ Funcional

## Visão Geral

Este documento descreve a integração do modelo GLM-4.6 da Zhipu AI via API Anthropic-compatible da Z.AI, permitindo comparação de performance entre os protocolos OpenAI e Anthropic.

## Configuração

### Modelos Disponíveis

O sistema agora oferece **dois modelos GLM-4.6** para comparação:

1. **GLM-4.6 (OpenAI)** - `openai/glm-4.6`
   - Endpoint: `https://api.z.ai/api/coding/paas/v4`
   - Protocolo: OpenAI-compatible
   - Provider: `ModelProvider.ZAI`

2. **GLM-4.6 (Anthropic API)** - `anthropic/GLM-4.6` ⭐ NOVO
   - Endpoint: `https://api.z.ai/api/anthropic`
   - Protocolo: Anthropic-compatible
   - Provider: `ModelProvider.ZAI` (com detecção automática de protocolo Anthropic)

### Credenciais

Ambos os modelos usam a mesma API key:

```bash
ZAI_API_KEY=your_zai_api_key_here
```

Adicione ao arquivo `.env` na raiz do projeto.

## Implementação Técnica

### 1. Registro do Modelo

**Arquivo**: `backend/core/ai_models/registry.py`

```python
# GLM-4.6 with Anthropic-compatible API (Z.AI Coding Plan)
# Using Anthropic provider prefix so LiteLLM knows to use Anthropic protocol
# Z.AI provides Anthropic-compatible endpoint at /api/anthropic
# IMPORTANT: This allows direct API compatibility comparison with OpenAI version above
self.register(
    Model(
        id="anthropic/GLM-4.6",  # Use anthropic/ prefix for LiteLLM provider detection
        name="Z.AI GLM-4.6 (Anthropic API)",
        provider=ModelProvider.ZAI,
        aliases=["glm-4.6-anthropic", "Z.AI GLM-4.6 (Anthropic)"],
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
        priority=92,  # Slightly lower priority than OpenAI version
        enabled=True,
        config=ModelConfig(
            api_base="https://api.z.ai/api/anthropic",  # Z.AI Anthropic-compatible endpoint
            # No model_name_override - let LiteLLM use anthropic/GLM-4.6
        ),
    )
)
```

### 2. Detecção de API Key

**Arquivo**: `backend/core/ai_models/ai_models.py` (linha ~122)

```python
# Apply provider-specific API key if not already in override_params
if "api_key" not in override_params or override_params.get("api_key") is None:
    if self.provider == ModelProvider.ZAI and config.ZAI_API_KEY:
        params["api_key"] = config.ZAI_API_KEY
```

### 3. Parâmetros LiteLLM Gerados

Quando o modelo `anthropic/GLM-4.6` é usado, os seguintes parâmetros são enviados ao LiteLLM:

```python
{
    "model": "anthropic/GLM-4.6",           # Provider prefix para detecção
    "api_base": "https://api.z.ai/api/anthropic",
    "api_key": "your_zai_api_key",
    "num_retries": 3,
    "messages": [...],
    "temperature": 0.7,
    # ... outros parâmetros
}
```

## Decisões de Design

### Por que usar `anthropic/` prefix no ID?

**Problema**: LiteLLM precisa saber qual protocolo usar (OpenAI vs Anthropic).

**Soluções Tentadas**:
1. ❌ `custom_llm_provider="anthropic"` + `model_name_override="GLM-4.6"` - Não funcionou
2. ❌ `provider=ModelProvider.ANTHROPIC` - Conflitava com detecção de API key
3. ✅ `id="anthropic/GLM-4.6"` + `provider=ModelProvider.ZAI` - Funciona perfeitamente

**Razão**: O LiteLLM usa o prefixo do model ID (`anthropic/`) para detectar o protocolo correto, enquanto mantemos `provider=ZAI` para a detecção correta da API key.

### Por que NÃO usar `model_name_override`?

Inicialmente tentamos usar `model_name_override` para enviar apenas `"GLM-4.6"` ao LiteLLM, mas isso causava o erro:

```
LLM Provider NOT provided. Pass in the LLM provider you are trying to call.
You passed model=GLM-4.6
```

O LiteLLM precisa receber `anthropic/GLM-4.6` (com o prefixo) para detectar corretamente que deve usar o protocolo Anthropic.

## Teste Standalone

Para verificar se o modelo funciona via API Anthropic da Z.AI:

**Arquivo**: `test_glm_anthropic.py`

```python
#!/usr/bin/env python3
"""Test GLM-4.6 via Z.AI Anthropic-compatible API"""

import os
from anthropic import Anthropic

# Get API key from environment
api_key = os.getenv("ZAI_API_KEY")
if not api_key:
    print("ERROR: ZAI_API_KEY environment variable not set!")
    exit(1)

# Initialize Anthropic client with Z.AI endpoint
client = Anthropic(
    api_key=api_key,
    base_url="https://api.z.ai/api/anthropic"
)

print("Testing GLM-4.6 via Z.AI Anthropic API...")
print(f"Base URL: https://api.z.ai/api/anthropic")
print(f"Model: GLM-4.6\n")

try:
    # Create a test message
    message = client.messages.create(
        model="GLM-4.6",
        max_tokens=100,
        messages=[
            {"role": "user", "content": "Say hello in one sentence."}
        ]
    )

    print("✅ SUCCESS!")
    print(f"\nResponse:")
    print(message.content[0].text)
    print(f"\nUsage: {message.usage}")

except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
```

**Executar**:

```bash
export ZAI_API_KEY=your_key_here
python3 test_glm_anthropic.py
```

**Resultado Esperado**:

```
Testing GLM-4.6 via Z.AI Anthropic API...
Base URL: https://api.z.ai/api/anthropic
Model: GLM-4.6

✅ SUCCESS!

Response:
Hello! I hope you're having a wonderful day.

Usage: Usage(cache_creation=None, cache_creation_input_tokens=None,
              cache_read_input_tokens=0, input_tokens=12, output_tokens=16,
              server_tool_use=None, service_tier=None)
```

## Como Usar

### No Dashboard

1. Acesse `http://localhost:3000/dashboard`
2. Clique no menu de configuração (⚙️)
3. Procure por "Z.AI GLM-4.6 (Anthropic API)"
4. Selecione o modelo
5. Envie uma mensagem

### Via API

```python
from core.ai_models import model_manager

# Obter parâmetros do modelo
params = model_manager.get_litellm_params("anthropic/GLM-4.6")

# Fazer chamada
response = await litellm.acompletion(**params)
```

## Comparação de Performance

Agora você pode comparar a performance dos dois protocolos:

| Métrica | OpenAI Protocol | Anthropic Protocol |
|---------|----------------|-------------------|
| Endpoint | `/api/coding/paas/v4` | `/api/anthropic` |
| Model ID | `openai/glm-4.6` | `anthropic/GLM-4.6` |
| Latência | ? | ? |
| Throughput | ? | ? |
| Cost | $0.50/$2.00 | $0.50/$2.00 |

*Teste ambos e compare os resultados!*

## Troubleshooting

### Erro: "LLM Provider NOT provided"

**Causa**: O model ID não tem o prefixo correto ou `model_name_override` está sendo usado incorretamente.

**Solução**: Certifique-se de que:
1. O model ID é `anthropic/GLM-4.6` (com prefixo)
2. `model_name_override` NÃO está definido
3. `api_base` está correto: `https://api.z.ai/api/anthropic`

### Erro: "404 Not Found"

**Causa**: Endpoint incorreto.

**Solução**:
- ✅ Correto: `https://api.z.ai/api/anthropic` (sem `/v1`)
- ❌ Incorreto: `https://api.z.ai/api/anthropic/v1`
- ❌ Incorreto: `https://open.bigmodel.cn/api/paas/v4`

### Erro: "Authentication failed"

**Causa**: API key incorreta ou não configurada.

**Solução**:
1. Verifique se `ZAI_API_KEY` está definida no `.env`
2. Verifique se o valor está correto
3. Reinicie o backend: `docker-compose restart backend worker`

## Logs de Debug

Para ativar logs detalhados, edite `backend/core/services/llm.py`:

```python
# Descomentar estas linhas (por volta da linha 179):
logger.debug(f"Calling LiteLLM acompletion for {resolved_model_name}")
logger.debug(f"Complete LiteLLM parameters: {params}")
```

Isso vai mostrar todos os parâmetros sendo enviados ao LiteLLM:

```
[debug] Calling LiteLLM acompletion for anthropic/GLM-4.6
[debug] Complete LiteLLM parameters: {
    'model': 'anthropic/GLM-4.6',
    'num_retries': 3,
    'api_key': '...',
    'api_base': 'https://api.z.ai/api/anthropic',
    'messages': [...]
}
```

## Arquivos Modificados

1. `backend/core/ai_models/registry.py` - Adicionado registro do modelo
2. `backend/core/ai_models/ai_models.py` - Detecção de API key para Z.AI
3. `backend/.env.example` - Documentação da variável `ZAI_API_KEY`
4. `setup.py` - Adicionado "Zhipu GLM" ao menu de providers
5. `test_glm_anthropic.py` - Script de teste standalone

## Referências

- **Z.AI Coding Plan**: https://www.z.ai/
- **Zhipu GLM-4.6**: https://open.bigmodel.cn/
- **LiteLLM Docs**: https://docs.litellm.ai/
- **Anthropic API**: https://docs.anthropic.com/

## Changelog

### 2025-10-07 - Versão Inicial
- ✅ Implementado modelo `anthropic/GLM-4.6`
- ✅ Configuração de endpoint Anthropic-compatible
- ✅ Detecção automática de API key
- ✅ Teste standalone validado
- ✅ Documentação completa
