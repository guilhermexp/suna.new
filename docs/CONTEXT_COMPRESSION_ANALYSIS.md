# Análise: Compressão de Contexto nas Sessões

## 🔄 QUANDO Acontece

**A compressão é executada ANTES de CADA chamada ao LLM.**

Toda vez que você envia uma mensagem:
1. Sistema carrega todo o histórico do banco de dados
2. **Compressão de contexto é aplicada** ← acontece aqui
3. Prompt caching é aplicado
4. Chamada ao LLM é feita
5. Agente começa a responder

## ⏱️ FREQUÊNCIA

**100% das vezes** que o agente vai responder algo.

- Nova mensagem do usuário? → Compressão
- Agente executou uma ferramenta e vai processar o resultado? → Compressão
- Auto-continue (agente continua pensando)? → Compressão

Não tem exceção. Sempre roda.

## 🎭 ESTADO DO Agente

**O agente NÃO está "running" ainda durante a compressão.**

A compressão acontece na fase de preparação, antes do status "running":

```
Timeline:
├─ Você envia mensagem
├─ [Carregando histórico do banco...]
├─ [COMPRESSÃO DE CONTEXTO] ← você está aqui
├─ [Aplicando cache...]
├─ Status muda para "running" ← só agora
└─ Agente começa a responder
```

Durante a compressão, o agente está em estado de "preparação" - invisível ao usuário em conversas normais.

## 🔧 COMO Funciona

### Estratégia: Remove/trunca mensagens antigas

**Ordem de processão:**

1. **Remove metadados desnecessários** de tool executions
2. **Comprime tool results antigos** (mas mantém o mais recente intacto)
3. **Comprime mensagens antigas do usuário** (mas mantém a mais recente intacta)
4. **Comprime respostas antigas do assistente** (mas mantém a mais recente intacta)

### O que significa "comprimir"?

**Para mensagens antigas:**
```
ANTES:
[Conteúdo longo com 5000 tokens...]

DEPOIS:
[Primeiros 3000 caracteres]... (truncated)
Use expand-message tool with message_id "xyz" to see full content
```

**Para a mensagem mais recente:**
```
Mantém início + fim, remove o meio se necessário
```

## 📏 Limites por Modelo

Cada modelo tem um limite diferente baseado no context window:

| Modelo | Context Window | Limite Usado | Margem Reservada |
|--------|----------------|--------------|------------------|
| Claude Sonnet 4.5 | 200k | 168k tokens | 32k para resposta |
| GPT-5 Codex | 400k | 336k tokens | 64k para resposta |
| Gemini 2.5 Pro | 2M | 1.7M tokens | 300k para resposta |

**Se ultrapassar o limite mesmo após compressão:**
- Tenta comprimir mais agressivamente (até 5 tentativas)
- Se ainda não couber: começa a **remover mensagens do meio** da conversa
- Preserva sempre: início da conversa + mensagens recentes

## ⚡ Impacto de Performance

**Em conversas normais (< 50 mensagens):**
- Imperceptível (< 150ms)

**Em conversas longas (200-500 mensagens):**
- Pode adicionar 400ms-1s de latência
- Você percebe um delay mínimo antes do agente começar a responder

**Em conversas muito longas (500+ mensagens):**
- 1-2.5 segundos de overhead
- Notável, mas necessário para caber no contexto

## 💰 Economia

Com compressão + caching juntos:
- **70-90% redução de custo** em conversas longas
- **70-90% redução de latência LLM** (tempo que o modelo leva para processar)

## 🔍 Detalhes Técnicos

### Implementação

**Localização do código:**
- `backend/core/agentpress/context_manager.py` - Lógica de compressão
- `backend/core/agentpress/thread_manager.py:304-317` - Ativação automática

**Configuração:**
```python
# backend/core/agentpress/thread_manager.py
ENABLE_CONTEXT_MANAGER = True   # Compressão SEMPRE ativa
ENABLE_PROMPT_CACHING = True    # Cache SEMPRE ativo
```

### Thresholds de Compressão

**Threshold inicial:** 1000 tokens por mensagem

Se uma mensagem ultrapassar 1000 tokens e não for a mais recente:
- É comprimida para ~3000 caracteres
- Adiciona referência para `expand-message` tool

**Compressão recursiva:**
Se mesmo após compressão inicial ainda ultrapassar o limite:
1. Iteração 1: Threshold = 1000 tokens
2. Iteração 2: Threshold = 500 tokens
3. Iteração 3: Threshold = 250 tokens
4. Iteração 4: Threshold = 125 tokens
5. Iteração 5: Threshold = 62 tokens

### Fallback: Remoção de Mensagens

Se após 5 iterações ainda não couber, remove mensagens do meio:

**Estratégia Middle-Out:**
```
ANTES (100 mensagens):
[1, 2, 3, ..., 48, 49, 50, 51, 52, ..., 98, 99, 100]

DEPOIS (60 mensagens):
[1, 2, 3, ..., 28, 29, 30] + [71, 72, 73, ..., 98, 99, 100]
         ↑ 30 primeiras          ↑ 30 últimas
```

**Parâmetros:**
- `removal_batch_size`: 10 mensagens por vez
- `min_messages_to_keep`: Mínimo de 10 mensagens

## 📊 Prompt Caching (Segunda Camada)

Após compressão, o sistema aplica prompt caching da Anthropic:

**Blocos de cache:**
1. **Bloco 1**: System prompt (se ≥1024 tokens)
2. **Blocos 2-4**: Chunks da conversa (dinâmicos)

**Thresholds dinâmicos por estágio:**

| Estágio | Mensagens | Multiplier | Threshold (Claude Sonnet 4) |
|---------|-----------|------------|---------------------------|
| Early | ≤20 | 0.3x | 7.5k tokens |
| Growing | 21-100 | 0.6x | 15k tokens |
| Mature | 101-500 | 1.0x | 25k tokens |
| Very Long | 500+ | 1.8x | 45k tokens |

**Economia de cache:**
- Cache write: 1.25x custo base
- Cache hit: 0.1x custo base (90% economia!)
- Break-even: 2-3 reutilizações

## 🔧 Monitoramento

### Logs Disponíveis

```bash
# Backend logs - compressão
tail -f backend/logs/app.log | grep "Context compression"

# Backend logs - caching
tail -f backend/logs/app.log | grep "🔥 Block"
```

**Exemplo de log:**
```
Context compression: 150000 -> 85000 tokens
🔥 Block 1: Cached chunk (25000 tokens, 45 messages)
🔥 Block 2: Cached chunk (30000 tokens, 60 messages)
🎯 Total cache blocks used: 2/4
```

## 📝 Resumo Executivo

**Resumo em 1 frase:**
A compressão roda automaticamente antes de toda chamada LLM, durante a fase de preparação (antes do "running"), e funciona truncando/removendo mensagens antigas para caber no limite do modelo.

**Pontos-chave:**
- ✅ Executada em 100% das interações
- ✅ Invisível ao usuário em conversas normais
- ✅ Preserva sempre as mensagens mais recentes intactas
- ✅ Economiza 70-90% de custo + latência
- ✅ Escalável para threads de 1000+ mensagens
- ✅ Configuração zero - funciona automaticamente
