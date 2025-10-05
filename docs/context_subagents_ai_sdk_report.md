# Relatório de Pesquisa — Engenharia de Contexto, Subagentes Assíncronos e Vercel AI SDK v5

## Sumário Executivo
- **Desafio**: reduzir saturação de contexto no Suna, habilitar execução assíncrona de subtarefas e avaliar modernização da stack de agentes.
- **Achados-chave**:
  - Contexto deve ser tratado como recurso finito com curadoria constante (Anthropic, Redis, 2025).
  - Pipelines modernos combinam seleção dinâmica (RAG + filtros), memórias isoladas e compressão hierárquica.
  - Arquiteturas assíncronas (DynTaskMAS, SagaLLM, AWS Bedrock) usam grafos dinâmicos e filas/eventos com estado isolado por agente.
  - Vercel AI SDK v5 oferece loop de agente com controle fino, tipagem end-to-end e UI de chat redesenhada, mas exige migração significativa em TypeScript.
- **Recomendações iniciais**: mapear contexto atual (feito parcialmente), prototipar fila de subagentes, rodar piloto do AI SDK v5 isolado, montar matriz de decisão com custo/esforço.

---

## 1. Engenharia de Contexto

### 1.1 Referências e tendências 2025
- **Anthropic (set/2025)**: alerta para "context rot" em sessões longas; recomenda ciclos de curadoria (sumarização + poda) e isolamento de trilhas por tarefa.
- **Redis Labs (set/2025)**: sugere divisão entre memória quente (contexto imediato), fria (sumários persistidos) e externa (RAG). Ênfase em políticas de expiração e auditoria de qualidade.
- **Guias independentes (CodeConductor, TowardsAI, Medium)**: convergem em um pipeline em camadas — seleção dinâmica, memória factual, compressão hierárquica, isolamento por agente e saída estruturada.
- **OpenAI Prompt Engineering (fev/2025)**: reforça instruções no topo, formatos explícitos e redução de descrições vagas; aplicável à seção de system prompt do Suna.

### 1.2 Boas práticas aplicáveis ao Suna
1. **Curadoria contínua do histórico**
   - Truncar ou resumir mensagens de ferramentas (`ToolResult`) logo após execução.
   - Gerar sumários de sessão ao atingir limiares (ex.: 50 mensagens ou 10k tokens) e armazenar no Supabase para reutilização.
2. **Seleção dinâmica de contexto**
   - Combinar busca vetorial (já existente via ferramentas) com filtros por metadados (data, origem).
   - Criar "score mínimo" para incluir documentos no prompt; descartar itens abaixo do threshold.
3. **Memórias isoladas por agente**
   - Para subagentes futuros, manter memória local (scratchpad/estado) e compartilhar somente resumos estruturados com o agente principal.
4. **Compressão hierárquica**
   - Aplicar estratégias "middle-out" (já iniciadas com `ContextManager.middle_out_messages`).
   - Considerar sumarização recursiva para blocos extensos (ex.: dividir em partes, resumir cada uma e depois gerar um sumário global).
5. **Monitoramento de uso**
   - Instrumentar métricas de tokens por tipo de mensagem (usuário, assistente, ferramenta) para alimentar decisões de curadoria automática.

### 1.3 Lacunas atuais
- O `ContextManager` comprime mensagens, mas não há registro persistente de **sumários de sessão** ou auditoria de relevância.
- Logs longos de ferramentas são apenas truncados; faltam versões resumidas.
- Falta camada de **validação semântica** pré-envio (ex.: checagem de duplicidade, relevância mínima).

### 1.4 Oportunidades imediatas
- Introduzir job periódico para sumarizar threads inativas e armazenar "sessão condensada".
- Adicionar metadados de relevância/score aos resultados do RAG e só promover itens qualitativos.
- Automatizar "memórias episódicas" (fatos chave) em tabela dedicada, para reduzir repetição de contexto.

---

## 2. Execução Assíncrona de Subagentes

### 2.1 Insights acadêmicos
- **DynTaskMAS (arXiv 2503.07675)**: propõe grafos de tarefas dinâmicos; cada subagente opera independentemente, reporta checkpoints, supervisor decide próximo passo.
- **SagaLLM (arXiv 2503.11951)**: adiciona validação transacional — antes de aplicar resultado de subagente, sistema verifica consistência e conflitos no estado global.

### 2.2 Referências práticas
- **AWS Bedrock (mar/2025)**: arquitetura broker/supervisor com Amazon EventBridge + Lambda. AppConfig armazena descrições de agentes; cada agente recebe evento, executa isoladamente e responde por fila.
- **Collabnix / LangGraph (2025)**: defendem orquestração explícita com checkpoints, retries e memórias dedicadas. LangGraph permite nós assíncronos e controle de dependências.

### 2.3 Padrões recomendados para Suna
1. **Fila/Eventos como backbone**
   - Opções: Redis Streams, RabbitMQ, tarefas Supabase ou fila interna (Postgres + workers).
   - Cada subagente consome uma fila específica e devolve resultado resumido.
2. **Contrato de mensagem**
   - Payload deve conter: `task_id`, contexto mínimo (instruções, dados relevantes), deadline e metadados de tracing.
   - Resposta deve retornar JSON estruturado com `status`, `resumo`, `artefatos` (links/IDs) e `confidence`.
3. **Isolamento de contexto**
   - Subagente não acessa histórico completo; recebe snapshot filtrado (ex.: apenas documentos necessários).
   - Resultado é persistido em tabela de `subagent_runs` com sumário curto; agente principal decide incorporar.
4. **Supervisor leve**
   - Componente no backend que: despacha tarefas, agrega resultados, aplica validações (ex.: deduplicação) e alimenta o contexto principal apenas com resumos.
5. **Observabilidade**
   - Registrar métricas: latência por subagente, tokens consumidos, taxa de retries, impacto no tamanho do contexto principal.

### 2.4 Roadmap sugerido
1. **PoC curta**
   - Escolher tarefa de alto custo (ex.: busca RAG pesada).
   - Criar worker assíncrono (Python ou Node) que recebe requisição via fila, executa e retorna sumário.
   - Medir redução de tokens no agente principal.
2. **Extensão incremental**
   - Adicionar mais subagentes (análise de código, geração de relatórios, consultas externas).
   - Introduzir validação transacional inspirada no SagaLLM (ex.: check de consistência antes de aplicar resultado).

---

## 3. Vercel AI SDK v5

### 3.1 Principais recursos
- **Chat redesenhado**: separa mensagens de UI (`UIMessage`) das do modelo (`ModelMessage`), facilitando persistência e replays.
- **Agentic Loop Control**: `stopWhen` para definir condições de parada, `prepareStep` para ajustar parâmetros a cada iteração, classe `Agent` para encapsular configurações.
- **Tooling avançado**: suporte a ferramentas dinâmicas (MCP), provider-executed tools, hooks de lifecycle (`onInputStart`, `onInputDelta`, etc.) e schemas com Zod 4.
- **Streaming (SSE)**: integrado com "data parts" (streaming de dados tipados) e partes transitórias (status) sem poluir histórico.
- **Integração multi-framework**: React, Vue, Svelte, Angular com paridade de recursos.

### 3.2 Impactos na arquitetura do Suna
| Área | Situação atual | Impacto da migração |
| --- | --- | --- |
| **Frontend** | Chat Next.js custom (componentes `ThreadContent`, `chat-input`, `token-usage-display`). | Reescrever fluxo de mensagens usando `useChat`/`createUIMessageStream`; adaptar UI para UIMessages e Data Parts. |
| **Backend** | Python (FastAPI) controla loop, ferramentas e billing. | Manter backend como orquestrador e expor endpoints compatíveis; ou mover loop para Node (maior esforço, risco com integrações 302.AI/billing local). |
| **Ferramentas** | Registro custom em Python (`ToolRegistry`). | Necessário definir esquema equivalente em TypeScript ou criar bridge para expor ferramentas via API. |
| **Observabilidade** | Métricas atuais (Langfuse, billing). | Precisa alinhar eventos do SDK com pipeline existente (token usage, cache). |

### 3.3 Benefícios x Riscos
**Benefícios**
- Tipagem end-to-end, menos bugs em chat e tool-calls.
- Loop de agente configurável sem reinventar controle de passos.
- UI moderna com streaming rico e fácil customização.

**Riscos/Custos**
- Migração significativa em TypeScript/React.
- Potencial duplicação de lógica (Python + TypeScript) se mantivermos orquestração híbrida.
- Necessidade de garantir compatibilidade com billing local, 302.AI e caching customizado.

### 3.4 Estratégia de adoção
1. **Piloto isolado**
   - Criar rota experimental `/labs/ai-sdk-v5` com fluxo completo usando SDK.
   - Backend atual expõe endpoint REST que responde com tool outputs; SDK consome via `fetch`. 
2. **Avaliação**
   - Comparar experiência de desenvolvimento, cobertura de recursos e métricas (tokens, latência) vs solução atual.
3. **Decisão**
   - Se aprovado, planejar migração gradual dos componentes de chat; se não, extrair apenas ideias úteis (ex.: data parts, stopWhen) para evolução interna.

---

## 4. Matriz de Decisão (Resumo)

| Opção | Benefício principal | Esforço estimado | Compatibilidade | Riscos | Próximo passo sugerido |
| --- | --- | --- | --- | --- | --- |
| **Curadoria avançada de contexto** | Reduz token usage e mantém respostas relevantes | Médio (ajustes em backend + jobs) | Alta (usa infra atual) | Complexidade de manutenção dos sumários | Detalhar plano de sumarização e monitoramento |
| **Subagentes assíncronos** | Paraleliza tarefas, isola contexto | Médio/Alto (infra filas + workers) | Alta (pode usar Redis/Supabase) | Coordenação e consistência entre agentes | PoC com tarefa RAG pesada |
| **Migração AI SDK v5** | UI/loop modernos, tipagem completa | Alto (frontend + integração) | Média (precisa bridge com Python) | Curva de aprendizado, sincronização de billing/cache | Pilotar rota isolada antes de decidir |

---

## 5. Roadmap Proposto
1. **Documentar fluxos de contexto atuais** (em andamento) e criar métricas de saturação.
2. **PoC subagente**: definir contrato de payload, escolher fila, implementar worker e medir impacto.
3. **Piloto AI SDK v5**: rota isolada + comparação objetiva (DX, performance, manutenção).
4. **Review executivo**: avaliar resultados das etapas anteriores e decidir adoções formais.
5. **Implementação incremental**: priorizar iniciativas com melhor relação benefício/esforço.

---

## 6. Referências
- Anthropic Research & Engineering Notes (2025) — práticas de contexto e caching.
- Redis Labs Whitepaper (2025) — memória hierarquizada para LLMs.
- "Context Engineering in LLM-Based Agents" — Medium, Jin Tan Ruan (jul/2025).
- OpenAI Help Center — best practices for prompt engineering (mai/2025).
- DynTaskMAS (arXiv:2503.07675) — grafos dinâmicos para multi-agentes assíncronos.
- SagaLLM (arXiv:2503.11951) — garantias transacionais em planejamento multi-agente.
- AWS Blog — "Creating asynchronous AI agents with Amazon Bedrock" (mar/2025).
- Collabnix — "Multi-Agent and Multi-LLM Architecture: Complete Guide for 2025".
- Vercel AI SDK v5 Docs e Blog (jul/2025).

---

## 7. Próximos Passos Solicitando Aprovação
- Validar se os pontos de roadmap atendem às prioridades atuais.
- Definir ordem de execução (curadoria vs subagentes vs piloto SDK).
- Caso precise de detalhamento adicional (ex.: orçamento, timelines), sinalizar tópicos específicos.
