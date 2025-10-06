# Guia de Integração do Claude Code via Ponte no Suna

Este guia explica, em português, como a camada de processamento do Suna foi adaptada para aceitar modelos Anthropic (incluindo Claude Code) consumidos por meio de uma ponte (`bridge`). O objetivo é usar o "cérebro" do Claude Code, mas continuar aproveitando todas as ferramentas nativas do Suna.

## 1. Visão Geral da Arquitetura

1. **Claude Code/Bridge** intercepta as requisições originadas do CLI local (autenticado via token de subscription) *antes* que elas tentem alcançar a API pública da Anthropic e as encaminha diretamente para o Suna.
2. **Runner do Suna (`backend/core/run.py`)** identifica se o modelo é da Anthropic e habilita o suporte a chamadas nativas de ferramentas.
3. **Response Processor (`backend/core/agentpress/response_processor.py`)** interpreta as mensagens no formato Anthropic, converte os blocos `tool_use` em chamadas de ferramentas do Suna e orquestra sua execução.
4. **Tool Registry** executa as ferramentas reais (sandbox, web, MCP etc.) e devolve o resultado em um formato que o Claude Code entende.

Esse fluxo garante que o Claude continue respondendo via ponte, mas com acesso completo às ferramentas registradas no Suna.

## 2. Como o Runner habilita o suporte Anthropic

No `AgentRunner.setup` verificamos o provedor do modelo e, se for Anthropic, forçamos `model_supports_native_tools = True`. Depois, ao criar a configuração do `ResponseProcessor`, essa flag ativa `native_tool_calling`, permitindo que os blocos `tool_use` sejam interpretados e executados automaticamente.

Trecho relevante: `backend/core/run.py`, linhas 589-640.

## 3. Processamento de Streaming

Quando o Claude envia respostas em streaming:

1. O método `process_streaming_response` mantém um `anthropic_state` com buffers por `tool_use_id`.
2. Cada chunk é normalizado por `_normalize_content_block` para garantir que tenhamos um dicionário padronizado.
3. `_process_anthropic_content` entende diferentes tipos de delta (`text_delta`, `tool_use`, `input_json_delta` etc.), junta JSONs parciais e registra o nome + argumentos da ferramenta.
4. Assim que um `tool_use` fica completo, `_maybe_collect_tool_call` gera uma estrutura no formato OpenAI (`function.name` + `arguments`).
5. Se `execute_on_stream` estiver ativo, o Suna envia um status `tool_call_chunk`, dispara a execução imediata da ferramenta e publica um `tool_started` para o front-end.

Esses passos estão descritos em `backend/core/agentpress/response_processor.py`, linhas 112-330 e 440-720.

## 4. Processamento Não-Streaming

Para respostas completas (sem streaming), `_process_anthropic_content` é reutilizado:

1. Percorremos os blocos de conteúdo retornados pelo Claude.
2. Extraímos texto e chamadas de ferramentas.
3. Agendamos a execução das ferramentas antes de salvar a mensagem final.

Referência: `backend/core/agentpress/response_processor.py`, linhas 1334-1410.

## 5. Execução das Ferramentas

Depois que as chamadas são coletadas:

1. `_create_tool_context` monta o contexto (índice, mensagem do assistente etc.).
2. `_execute_tool` usa o `ToolRegistry` para invocar a ferramenta correspondente.
3. Os resultados são salvos e emitidos como mensagens `tool_result`, permitindo que o Claude consuma o retorno e continue a conversa.

## 6. Como testar

1. Configure a ponte do Claude Code para redirecionar as requisições capturadas no CLI local para o endpoint do Suna (sem contactar a API pública da Anthropic).
2. Certifique-se de que o modelo configurado no projeto do Suna é um modelo Anthropic.
3. Faça uma requisição que invoque uma ferramenta (por exemplo, `sb_shell_tool`).
4. Observe os eventos `tool_call_chunk`, `tool_started` e `tool_result` chegando via SSE; isso confirma que a tradução e execução funcionam.

## 7. Boas práticas

- Garanta que o bridge preserve os campos `id`, `name` e `input`/`delta.partial_json` dos blocos `tool_use`.
- Caso o Claude envie JSON parcial, `_append_partial_json` reconstrói o payload automaticamente.
- Se a ponte inserir providers adicionais, mantenha o `model` contendo palavras-chave como `anthropic` ou `claude` para ativar a detecção automática.

Com essas peças, o Claude Code passa a funcionar como "provider" dentro do Suna, usando as ferramentas nativas através da ponte.

## 8. Sobre `CLAUDE.md` e prompts de sistema

- O arquivo `CLAUDE.md` na raiz do repositório continua servindo como guia de contexto sempre que o Claude Code é executado dentro desse projeto. A ponte não altera esse comportamento; o CLI local lê o arquivo antes de gerar respostas, exatamente como faria sem o redirecionamento para o Suna.
- Para cada agente criado no Suna você ainda pode definir (ou editar) o prompt de sistema diretamente pela interface web. Esse prompt é enviado na chamada inicial ao modelo Anthropic e complementa as instruções do `CLAUDE.md`.
- Caso precise de orientações específicas apenas para um agente, ajuste o prompt de sistema desse agente no frontend. Utilize o `CLAUDE.md` para instruções globais compartilhadas entre todos os fluxos de trabalho que usam esse repositório.
- Não é necessário duplicar instruções: mantenha no `CLAUDE.md` aquilo que deve valer para todo desenvolvimento com o Claude Code e, no prompt do agente, apenas o que for particular daquele fluxo.

## 9. Agente padrão dedicado ao Claude Code

Para evitar que configurações de sistema sejam removidas ou sobrescritas por engano, recomendamos criar (ou manter) um agente padrão exclusivo para o fluxo do Claude Code CLI:

1. **Crie um agente "Claude Code CLI"** com o provider configurado para usar a ponte do Claude Code.
2. **Defina o prompt de sistema desse agente** de modo a referenciar ou incorporar o conteúdo do `CLAUDE.md`. Assim, qualquer ajuste global continua centralizado no arquivo versionado, mas o agente fica protegido com um prompt mínimo obrigatório.
3. **Restrinja a edição/exclusão** desse agente (por exemplo, desabilitando o botão de deletar ou exigindo permissões administrativas) para que a equipe mantenha uma configuração base sempre disponível.
4. **Permita que novos agentes sejam criados normalmente** para outros provedores ou variações, reutilizando o mesmo conjunto de ferramentas do Suna. Esses agentes podem ter prompts totalmente customizados sem interferir no fluxo padrão do Claude Code.

Com esse agente padrão "congelado", o time evita conflitos de configuração e garante que o CLI do Claude Code continue recebendo as instruções corretas sempre que for disparado via ponte.
