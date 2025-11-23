# PRD — Migração das Tools de Imagem para Gemini 2.5 Image Flash (Gemini API)

Status: Draft v1
Owner: Platform/AI
Data: 2025-10-27

## Contexto e Objetivo

Hoje as tools `sb_image_edit_tool` e `sb_designer_tool` usam DALL·E (OpenAI gpt-image-1) via LiteLLM.
Queremos migrar “criação” e “edição” para o novo modelo de imagens da Google denominado “Gemini 2.5 Image Flash”, descontinuando o uso do provedor da OpenAI nessas tools.

Manter a `sb_vision_tool` como está (análise/otimização/upload), sem alteração de provedor.

## Escopo

- Substituir geração e edição de imagens por Google AI Images API.
- Suportar: geração a partir de prompt, edição com máscara, variações (multi-imagens), controle de tamanho flexível, seed (opcional), formato de saída e qualidade.
- Reaproveitar os mesmos fluxos de sandbox e salvamento de arquivos em `/workspace` (e `/workspace/designs` para Designer).
- Tornar o modelo configurável por env (ex.: `GEMINI_IMAGE_MODEL`).
- Remover dependência de `OPENAI_API_KEY` para essas duas tools (mantém-se para outras partes do sistema, se houver).

Fora de escopo: alterar `sb_vision_tool`.

## Referências (Docs)

- Gemini API — Image generation: https://ai.google.dev/gemini-api/docs/image-generation

Observação: o identificador do modelo “Gemini 2.5 Image Flash” será definido via variável de ambiente e não será hardcoded neste PRD.

## Requisitos Funcionais

1) Geração
- Input: `prompt`, `width`, `height`, `n` (1–4), `format` (png|jpeg|webp), `background` (ex.: `transparent|white`), `quality`/`safety` (opcional), `seed` (opcional).
- Output: 1..n imagens salvas no sandbox com nomes determinísticos (UUID) e retorno com lista de caminhos/URLs do sandbox.

2) Edição com máscara
- Input: `image_path` (local URL/sandbox), `mask_path` (áreas brancas = edita, pretas = preserva), `prompt`, tamanhos (default = manter dimensões da base), `format`/`quality`, `n`, `seed`.
- Output: 1..n imagens editadas, nomes claros e paths retornados.

3) Variações
- Input: `image_path`, `n`, parâmetros opcionais de tamanho/estilo.
- Output: 1..n variações mantendo semântica visual.

4) Limites/Validações
- Tamanho de saída até 4096 px por lado (configurável), `n` até 4.
- Bloqueios de segurança (conteúdo sensível) retornam erro estruturado indicando a razão.

## Requisitos Não Funcionais

- Confiabilidade: timeouts e retries razoáveis; mensagens de erro claras.
- Observabilidade: logs contendo `model`, `latência`, `tamanho` e `n`.
- Custos: permitir reduzir `n` e dimensões por padrão para economizar.

## Design de API (Tools)

### 1) sb_image_edit_tool (substitui gpt-image-1)

Assinatura proposta (OpenAPI schema interno):

```
image_generate_edit_variations(
  mode: "generate" | "edit" | "variations",
  prompt?: string,
  image_path?: string,
  mask_path?: string,
  width?: number,
  height?: number,
  n?: number,
  seed?: number,
  format?: "png"|"jpeg"|"webp",
  background?: "transparent"|"white",
  quality?: "high"|"standard",
)
```

Respostas:
- Sucesso: `{ images: Array<{ filename, url, width, height, format }>, message }`
- Erro: `{ error, safety?: { categories, reasons } }`

Observações:
- `edit` requer `image_path`. `mask_path` é opcional; se ausente, edição global.
- `variations` requer `image_path`; `prompt` opcional.

### 2) sb_designer_tool (usa o mesmo motor)

Mudanças principais:
- Respeitar `width`/`height` reais (sem “1024 fixo”).
- Permitir `n` variações.
- Reuso do cliente Google (mesmo backend da tool acima) para manter consistência.
- Output mantém pasta `/workspace/designs`.

Parâmetros extras preservados: `platform_preset`, `design_style`, `quality`.

## Arquitetura Técnica

### Novo cliente de imagens (Gemini API)

Criar um wrapper interno para o modelo “Gemini 2.5 Image Flash” via Gemini API (Google AI Studio):

Arquivo novo: `backend/core/services/images_provider/google_images_client.py`

Interface:
- `async generate(prompt, width, height, n, format, background, quality, seed) -> List[bytes]`
- `async edit(image_bytes, mask_bytes|None, prompt, width|None, height|None, n, format, background, quality, seed) -> List[bytes]`

Implementação:
- Google AI Studio (API Key) via SDK Python `google-genai`.
  - Modelo configurável por env:
    - `GEMINI_IMAGE_MODEL` (ex.: `gemini-2.5-image-flash`, a ser confirmado no provisionamento da conta)

Pseudo (Gemini API — Python):

```python
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])  # chave do Gemini API

def gen_images(prompt, width, height, n, fmt, bg, quality, seed):
    result = client.images.generate(
        model=os.getenv("GEMINI_IMAGE_MODEL"),  # ex.: gemini-2.5-image-flash
        prompt=prompt,
        # Exemplos de campos conforme SDK:
        # size={"width": width, "height": height},
        # number_of_images=n,
        # background=bg,
        # output_mime=f"image/{fmt}",
        # seed=seed,
        # safety_filter_level="...",
        # quality=quality,
    )
    return [img.image_bytes for img in result.images]

def edit_image(image_bytes, mask_bytes, prompt, width, height, n, fmt, bg, quality, seed):
    base = genai.types.Image(data=image_bytes)
    mask = genai.types.Image(data=mask_bytes) if mask_bytes else None
    result = client.images.edits(
        model=os.getenv("GEMINI_IMAGE_MODEL"),  # mesmo modelo para criar/editar
        image=base,
        mask=mask,
        prompt=prompt,
        # size={"width": width, "height": height} if width and height else None,
        # number_of_images=n,
        # output_mime=f"image/{fmt}",
        # seed=seed,
    )
    return [img.image_bytes for img in result.images]
```

Nota: este PRD não cobre Vertex AI. O escopo aqui é apenas Gemini API (Google AI Studio).

### Alterações de Código (arquivos)

- `backend/core/tools/sb_image_edit_tool.py`
  - Substituir imports de `litellm aimage_generation/aimage_edit` pelo cliente novo.
  - Expandir schema para `mode=[generate|edit|variations]`, aceitar `mask_path`, `width`, `height`, `n`, `seed`, `format`, `background`, `quality`.
  - Implementar leitura de imagem/máscara do sandbox/URL e repassar bytes ao cliente.
  - Salvar cada saída com padrão: `generated_{W}x{H}_{uuid}_{idx}.{ext}`.

- `backend/core/tools/sb_designer_tool.py`
  - Trocar chamadas de geração/edição para o cliente Google.
  - Respeitar exatamente as dimensões do preset ou custom (sem “auto”).
  - Adicionar parâmetro `n` para múltiplas variações; retornar lista de paths.
  - Manter pasta `"/workspace/designs"`.

- `backend/core/services/images_provider/google_images_client.py` (novo)
  - Implementações descritas acima.

- `backend/core/config_helper.py` e `backend/core/suna_config.py`
  - Adicionar novas envs:
    - `GEMINI_API_KEY`
    - `GEMINI_IMAGE_MODEL` (sem default hardcoded; definir no ambiente como “gemini-2.5-image-flash” quando disponível)

- `backend/pyproject.toml`
  - Adicionar dependência: `google-genai` (SDK Gemini API)
  - Remover uso de geração/edição de imagem via `litellm` dessas tools (não remover litellm global).

- Frontend
  - `frontend/src/components/agents/tools.ts` — atualizar descrição (“Google Images API / Gemini 2.5 Image Flash”).
  - `frontend/src/components/thread/tool-views/image-edit-generate-tool/*` — expor novos controles: máscara (upload), `width`/`height`, `n`, `seed`, `format` e múltiplos resultados.
  - `frontend/src/components/thread/tool-views/designer-tool/*` — permitir `n` e resultados múltiplos; deixar presets inalterados, mas respeitar dimensões reais.

- Docs
  - Este PRD (docs/PRD_GEMINI_IMAGE_MIGRATION.md)
  - Guia de Migração (docs/IMAGES_PROVIDER_MIGRATION_GUIDE.md) — opcional.

## Configuração e Env Vars

- `GEMINI_API_KEY`
- `GEMINI_IMAGE_MODEL` (ex.: `gemini-2.5-image-flash`, definido no ambiente)

## Fluxo de Dados

1. Tool recebe input (prompt, params e paths).
2. Se necessário, baixa arquivos do sandbox/URL e carrega bytes.
3. Chama o `google_images_client` (generate/edits).
4. Recebe uma lista de imagens (bytes), salva em `/workspace` ou `/workspace/designs`.
5. Retorna JSON com paths e URLs de sandbox para UI.

## Tratamento de Erros e Segurança

- Mapeamento de erros de rede/timeouts para mensagens amigáveis.
- Captura de “safety blocks” do provedor e inclusão em `ToolResult` com categorias/motivos.
- Validação de parâmetros: limites de dimensões, `n` máximo, formatos suportados.

## Plano de Migração

Fase 0 — Preparação
- Adicionar dependências e cliente Google.
- Parametrizar model IDs por env.

Fase 1 — Implementação paralela (curta)
- Alterar as duas tools para usar o cliente novo.
- Manter feature flag (env) para fácil rollback.

Fase 2 — Switch-over
- `GEMINI_IMAGE_MODEL` definido e utilizado para geração e edição (mesmo modelo).
- Validar em staging; smoke tests manuais (generate, edit com máscara, variações, multi-output, dimensões > 1024).

Fase 3 — Limpeza
- Remover chamadas de `aimage_generation/aimage_edit` (OpenAI) dessas tools.
- Atualizar docs/UX (descrições e exemplos).

Rollback
- Reverter envs para provedor anterior e restaurar commit que mantinha DALL·E (se necessário).

## Critérios de Aceite

- Geração: cria imagens em dimensões arbitrárias (> 1024), `n` de 1 a 4, formatos png/jpeg/webp, salvando no sandbox e exibindo na UI.
- Edição: aplica máscara corretamente (branco = editar, preto = preservar) e retorna múltiplas variações quando solicitado.
- Designer: respeita exatamente as dimensões dos presets/custom; consegue produzir mais de uma variação por chamada.
- Nenhuma dependência de `OPENAI_API_KEY` nas duas tools.
- Logs mostram `model`, `width/height`, `n`, latência e resultado.

## Riscos e Mitigações

- Mudança de nomes de modelos (ex.: “2.5 image flash” vs “imagen-3.x”): mitigar via env `GEMINI_IMAGE_MODEL`.
- Limites e safety: propagar erros bem formatados à UI e sugerir ajustes de prompt.
- Custos: defaults conservadores (ex.: 1024–1536px, `n=1`).

## Perguntas em Aberto

- ID exato do modelo “Gemini 2.5 Image Flash” a ser informado via env durante o provisionamento da conta.
- Suporte a `seed`/`background` conforme documentação final do Gemini API; mapear no cliente quando disponível.
