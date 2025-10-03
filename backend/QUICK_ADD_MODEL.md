# Quick Reference: Adicionar Modelo no Suna

## 🚀 5 Passos Rápidos

### 1️⃣ Config (config.py ~linha 258)
```python
PROVIDER_API_KEY: Optional[str] = None
```

### 2️⃣ Registry (registry.py ~linha 22)
```python
self.register(
    Model(
        id="provider/model-name",
        name="Display Name",
        provider=ModelProvider.PROVIDER,
        aliases=["alias1"],
        context_window=128000,
        capabilities=[ModelCapability.CHAT, ModelCapability.FUNCTION_CALLING],
        pricing=ModelPricing(input_cost_per_million_tokens=0.0, output_cost_per_million_tokens=0.0),
        tier_availability=["paid"],
        priority=100,
        enabled=True,
    )
)
```

### 3️⃣ API Key Handler (ai_models.py ~linha 115)
```python
elif self.provider == ModelProvider.PROVIDER and config.PROVIDER_API_KEY:
    params["api_key"] = config.PROVIDER_API_KEY
```

### 4️⃣ Provider List (llm.py ~linha 38)
```python
providers = [..., "PROVIDER"]
```

### 5️⃣ Environment (.env)
```bash
PROVIDER_API_KEY=your-key-here
```

---

## 🔧 Deploy

```bash
docker-compose build backend worker
docker-compose up -d backend worker
```

---

## ⚠️ Casos Especiais

### Custom Anthropic Endpoint
```python
Model(
    id="model-name",  # SEM "anthropic/" prefix
    provider=ModelProvider.ANTHROPIC,
    config=ModelConfig(
        api_base="https://api.custom.com",  # SEM /v1 no final!
        extra_headers={"anthropic-version": "2023-06-01"},
    ),
)

# Handler:
elif self.provider == ModelProvider.ANTHROPIC and "custom.com" in self.config.api_base:
    params["api_key"] = config.CUSTOM_API_KEY
```

### OpenAI-Compatible
```python
Model(
    id="openai/model-name",  # COM "openai/" prefix
    provider=ModelProvider.CUSTOM,
    config=ModelConfig(api_base="https://api.custom.com/v1"),
)
```

---

## 🐛 Debug Rápido

### Erro 404 com URL duplicada?
```python
# ❌ api_base="https://api.custom.com/v1"
# ✅ api_base="https://api.custom.com"
```

### Modelo não aparece?
```bash
docker exec sunanew-backend-1 uv run python -c "
from core.ai_models import registry
print([m.name for m in registry.get_all()])"
```

### API Key não carrega?
```bash
docker exec sunanew-backend-1 uv run python -c "
from core.utils.config import config
print(config.PROVIDER_API_KEY[:15] if config.PROVIDER_API_KEY else 'NOT FOUND')"
```

### Testar endpoint direto
```bash
curl -X POST "https://api.provider.com/v1/messages" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"model-name","messages":[{"role":"user","content":"test"}],"max_tokens":10}'
```

---

**Guia completo:** Ver `ADDING_NEW_MODELS.md`
