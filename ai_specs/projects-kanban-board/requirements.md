# Requirements Document

## Introduction

Este documento define os requisitos para a implementação da página de Projetos (Kanban) no sistema Suna, baseada na funcionalidade existente no deer-flow-New. A página permitirá que usuários criem, gerenciem e organizem projetos em um quadro Kanban com colunas de tarefas arrastáveis, oferecendo tanto uma visualização em colunas quanto uma visualização semanal.

## Requirements

### Requirement 1

**User Story:** Como um usuário, quero acessar uma página de projetos através do sidebar para poder gerenciar meus projetos e tarefas de forma visual e organizada.

#### Acceptance Criteria

1. WHEN o usuário clica no item "Projetos" no sidebar THEN o sistema SHALL exibir a página de projetos
2. WHEN a página de projetos carrega THEN o sistema SHALL exibir uma lista de projetos existentes
3. WHEN não existem projetos THEN o sistema SHALL exibir uma mensagem convidando a criar o primeiro projeto
4. WHEN o usuário navega para /projects THEN o sistema SHALL redirecionar para a página de projetos

### Requirement 2

**User Story:** Como um usuário, quero criar novos projetos para organizar minhas tarefas em quadros separados.

#### Acceptance Criteria

1. WHEN o usuário clica no botão "Novo Projeto" THEN o sistema SHALL exibir um diálogo de criação
2. WHEN o usuário preenche nome do projeto e confirma THEN o sistema SHALL criar o projeto no banco de dados
3. WHEN o projeto é criado com sucesso THEN o sistema SHALL adicionar à lista de projetos
4. WHEN o usuário não preenche nome obrigatório THEN o sistema SHALL exibir mensagem de erro

### Requirement 3

**User Story:** Como um usuário, quero visualizar meus projetos em formato Kanban com colunas de status para poder arrastar tarefas entre diferentes estágios.

#### Acceptance Criteria

1. WHEN o usuário seleciona um projeto THEN o sistema SHALL exibir o quadro Kanban com 4 colunas: Backlog, To Do, In Progress, Done
2. WHEN existem tarefas no projeto THEN o sistema SHALL exibi-las como cards nas colunas correspondentes
3. WHEN o usuário arrasta uma tarefa entre colunas THEN o sistema SHALL atualizar o status da tarefa
4. WHEN o usuário solta a tarefa THEN o sistema SHALL persistir a nova posição no banco de dados

### Requirement 4

**User Story:** Como um usuário, quero gerenciar tarefas dentro de um projeto incluindo criação, edição e exclusão.

#### Acceptance Criteria

1. WHEN o usuário clica no botão "+" em uma coluna THEN o sistema SHALL exibir diálogo para criar nova tarefa
2. WHEN o usuário clica em uma tarefa existente THEN o sistema SHALL exibir diálogo de edição
3. WHEN o usuário confirma exclusão de tarefa THEN o sistema SHALL remover a tarefa do projeto
4. WHEN uma tarefa é criada/editada THEN o sistema SHALL atualizar a interface imediatamente

### Requirement 5

**User Story:** Como um usuário, quero visualizar minhas tarefas em formato semanal para poder planejar atividades por dia.

#### Acceptance Criteria

1. WHEN o usuário seleciona a aba "Quadro Semanal" THEN o sistema SHALL exibir timeline semanal
2. WHEN existem tarefas THEN o sistema SHALL distribuí-las pelos dias da semana
3. WHEN o usuário ajusta o número de dias visíveis THEN o sistema SHALL atualizar a visualização
4. WHEN não há tarefas para um dia THEN o sistema SHALL exibir o dia vazio

### Requirement 6

**User Story:** Como um usuário, quero buscar projetos e tarefas para encontrar rapidamente o que procuro.

#### Acceptance Criteria

1. WHEN o usuário digita na barra de busca THEN o sistema SHALL filtrar projetos/tarefas em tempo real
2. WHEN o texto da busca corresponde a nomes de projetos THEN o sistema SHALL destacar os correspondentes
3. WHEN o texto da busca corresponde a títulos de tarefas THEN o sistema SHALL destacar os correspondentes
4. WHEN a busca está vazia THEN o sistema SHALL exibir todos os projetos/tarefas

### Requirement 7

**User Story:** Como um usuário, quero que minhas operações sejam persistidas imediatamente para não perder dados.

#### Acceptance Criteria

1. WHEN qualquer operação é realizada THEN o sistema SHALL persistir no Supabase
2. WHEN ocorre erro de persistência THEN o sistema SHALL exibir mensagem de erro
3. WHEN a operação é concluída com sucesso THEN o sistema SHALL atualizar a interface
4. WHEN a conexão falha THEN o sistema SHALL exibir mensagem de erro de rede

### Requirement 8

**User Story:** Como um usuário, quero uma interface responsiva que funcione bem em dispositivos móveis.

#### Acceptance Criteria

1. WHEN acessado em dispositivo móvel THEN o sistema SHALL adaptar layout para tela pequena
2. WHEN o sidebar está colapsado THEN o sistema SHALL manter funcionalidade completa
3. WHEN o usuário arrasta tarefas em mobile THEN o sistema SHALL suportar touch gestures
4. WHEN a tela é pequena THEN o sistema SHALL otimizar uso de espaço vertical

### Requirement 9

**User Story:** Como um usuário, quero visualizar informações adicionais das tarefas como prioridade e descrição.

#### Acceptance Criteria

1. WHEN uma tarefa tem prioridade alta THEN o sistema SHALL exibir indicador visual
2. WHEN uma tarefa tem descrição THEN o sistema SHALL exibir preview na card
3. WHEN o usuário passa o mouse sobre a tarefa THEN o sistema SHALL exibir detalhes adicionais
4. WHEN a tarefa não tem descrição THEN o sistema SHALL exibir apenas o título

### Requirement 10

**User Story:** Como um usuário, quero personalizar meus projetos seguindo o padrão visual do Suna com avatar e cores consistentes.

#### Acceptance Criteria

1. WHEN criando/editando projeto THEN o sistema SHALL permitir selecionar avatar (VARCHAR(10) - emoji/ícone)
2. WHEN criando/editando projeto THEN o sistema SHALL permitir selecionar avatar_color (VARCHAR(7) - formato hex #RRGGBB)
3. WHEN criando/editando projeto THEN o sistema SHALL gerar automaticamente icon_background seguindo o padrão dos agentes
4. WHEN exibindo lista de projetos THEN o sistema SHALL mostrar avatar e avatar_color personalizados
5. WHEN não definido avatar/avatar_color THEN o sistema SHALL usar valores padrão consistentes com agentes
6. WHEN gerando ícone automaticamente THEN o sistema SHALL usar a mesma API de geração de ícone dos agentes