# Plano de Implementação — Página de Controle Financeiro

Este documento descreve a análise inicial e o plano para criar uma nova página de **Controle Financeiro** no frontend Next.js do projeto. A intenção é entregar uma visão rica de entradas, saídas, pendências, assinaturas recorrentes e cartões de crédito, inspirando-se nos componentes escuros e com gradientes exibidos nas referências visuais compartilhadas.

---

## 1. Contexto e Stack Existente
- App Router (`src/app/(dashboard)`) com layout autenticado já integrado ao sidebar esquerdo.
- UI construída com **Tailwind CSS 4**, tokens do tema em `globals.css` e componentes de **shadcn/ui** (cards, tabs, data-table, calendar, etc.).
- Estado global distribuído via hooks customizados + **React Query** para dados vindos da API (Supabase).
- Sidebar existente (`src/components/sidebar/sidebar-left.tsx`) controla as entradas de navegação dentro do dashboard.

---

## 2. Objetivos da Página
1. **Resumo financeiro** tipo “wallet card” (saldo total, contas, ações rápidas).
2. **Timeline de entradas e saídas** com filtros (período, tipo, tags).
3. **Pendências** (contas a pagar/receber) com status e datas.
4. **Assinaturas recorrentes** com calendário mensal estilizado (ícones das marcas, valores).
5. **Cartões de crédito** com limite, fatura atual, vencimento e botões de ação.
6. **Ações rápidas**: registrar entrada/saída, agendar pendência, adicionar assinatura, adicionar cartão.

---

## 3. Arquitetura de Navegação
- Criar rota em `src/app/(dashboard)/finance-control/page.tsx`.
- Incluir botão dedicado na sidebar (`SidebarLeft`) agrupado junto das seções financeiras (ícone sugerido: `Wallet`, `PieChart`, `LineChart` ou similar).
- Ajustar analytics/PostHog se necessário (seguir padrão `posthog.capture` já usado).

---

## 4. Layout Proposto
| Região | Conteúdo | Observações |
| --- | --- | --- |
| **Hero** (full width) | Card de saldo total com tabs para “Funding / Trading / ...”, ações “Depositar / Retirar”, variação de saldo e ícone da moeda. | Usar `Card`, `Tabs`, gradientes com `bg-[radial-gradient(...)]` ou CSS custom. |
| **Grid 1 (2 colunas)** | (A) Lista de entradas/saídas recentes <br> (B) Pendências iminentes + ações rápidas | Priorizar scroll suave (`ScrollArea`). |
| **Grid 2 (2 colunas)** | (A) Calendário mensal de assinaturas <br> (B) Cards de cartões de crédito com status | Calendar pode ser versão custom do `ui/calendar.tsx` em modo mensal. |
| **Footer opcional** | Relatórios/exportar (CSV/PDF) ou link p/ tela de analytics futuramente. | Pode ficar como backlog. |

Layout base: `Container` com `max-w-7xl`, `mx-auto`, `px-6`. Utilizar `lg:grid-cols-2` com `gap-6/8` seguindo padrões existentes nas páginas do dashboard.

---

## 5. Domínios de Dados e Modelagem

### 5.1 Transações (Entradas/Saídas)
- Campos: `id`, `tipo` (`INCOME`/`EXPENSE`), `categoria`, `descricao`, `valor`, `data`, `contaId`, `tags`, `status`.
- Reuso possível: `DataTable` + `Badge` para status + botão `Detalhes`.
- API: criar hook `useFinanceTransactions` com `react-query`.

### 5.2 Pendências
- Estrutura parecida com transações, porém com `dueDate`, `recorrencia`, `prioridade`, `status`.
- Podem aparecer em cards pequenos (estilo `Card` com `border` + ícones) e permitir ação “Marcar como pago”.

### 5.3 Assinaturas
- Campos: `id`, `nomeServico`, `valor`, `moeda`, `diaCobranca`, `icone` (SVG/URL), `categoria`.
- Necessário transformar em eventos para o calendário (por dia do mês). Utilizar `Calendar` com slots customizados via CSS (bolinhas coloridas).
- Considerar modal de detalhe com histórico de pagamentos.

### 5.4 Cartões de Crédito
- Campos: `id`, `apelido`, `bandeira`, `limiteTotal`, `limiteDisponivel`, `faturaAtual`, `vencimento`, `corTema`.
- Renderizar cards 3D leves (`transform-gpu`, `shadow-xl`, gradientes). Opção de usar `framer-motion` para hover.

---

## 6. Componentização Planejada

| Componente | Responsabilidade | Observações |
| --- | --- | --- |
| `FinanceSummaryCard` | Exibir saldo consolidado, contas selecionáveis e botões `Depositar/Retirar`. | Reaproveitar `Card`, `Tabs`, `Button`. Considerar hook `useFinanceSummary`. |
| `TransactionList` | Lista paginada ou scrollável de entradas/saídas. | Usar `DataTable` existente (check `src/components/ui/data-table.tsx`). |
| `PendingTasksPanel` | Cards empilhados de pendências + CTA “Criar pendência”. | Pode usar `Accordion` caso lista longa. |
| `SubscriptionsCalendar` | Calendário mensal dark com ícones (inspirado na referência). | Extender `Calendar` com tema escuro, ícones via `Image` ou `Avatar`. |
| `CreditCardStack` | Renderizar cards com limitações e status. | `Card` + gradientes + `Progress` para uso do limite. |
| `QuickActions` | Botões de criar registros (modal). | Conectar com `Dialog` + `Form` (React Hook Form + Zod). |

---

## 7. Interações e Fluxos
1. **Adicionar Transação**: Botão abre `Dialog` com formulário (campos: tipo, valor, categoria, data, tags). Ao salvar, invalidar query de transações/saldo.
2. **Marcar Pendência como Resolvida**: Toggle ou menu de contexto (`DropdownMenu`) que atualiza status.
3. **Adicionar/Editar Assinatura**: Modal com escolha de dia do mês e ícone (seleção de logotipos mais usados ou upload manual).
4. **Gerenciar Cartão**: Modal para atualizar limite/fatura; atalho para “ver fatura detalhada” (link futuro).
5. **Filtros Globais**: Chip selectors (mês/ano, conta). Aplicar no resumo, lista e calendário. Estados mantidos em `useState` local + `URLSearchParams` se for necessário persistir.

---

## 8. Roadmap de Implementação
1. **Fase 0 – Preparação**
   - Confirmar endpoints necessários no backend / Supabase.
   - Definir esquema TypeScript compartilhado (pasta `src/lib/types/finance.ts`).
2. **Fase 1 – Estrutura**
   - Criar rota `finance-control`.
   - Configurar sidebar + breadcrumb/page header (`PageHeader`).
   - Renderizar skeletons estáticos (sem dados) para validar layout.
3. **Fase 2 – Dados e Hooks**
   - Implementar hooks `useFinanceSummary`, `useFinanceTransactions`, `useFinancePendings`, `useFinanceSubscriptions`, `useFinanceCards`.
   - Integrar React Query com loaders/skeletons e estados vazios.
4. **Fase 3 – Interações**
   - Criar modais/diálogos de criação/edição (React Hook Form + Zod).
   - Implementar filtros globais e atualizações otimistas.
5. **Fase 4 – Visual Refinement**
   - Ajustar gradientes, sombras, animações (`framer-motion`/`tailwind`).
   - Garantir responsividade (breakpoints `sm`/`md`/`lg`).
   - Acessibilidade (ARIA, contraste, teclado).
6. **Fase 5 – QA e Documentação**
   - Escrever testes de componente cruciais (se aplicável) e verificar integração.
   - Atualizar documentação (README da feature ou storybook interno).

---

## 9. Riscos e Pontos em Aberto
- **Fonte de dados**: confirmar se já existe backend para finanças ou se começará com mock/local state.
- **Ícones de serviços**: definir estratégia (biblioteca existente, assets no `public`, ou upload pelo usuário).
- **Performance**: potencial alto volume de transações; talvez necessário virtualização (avaliar após protótipo).
- **Tema escuro avançado**: garantir coerência de gradientes com tokens existentes (`bg-card`, `text-muted-foreground`, etc.).

---

## 10. Próximos Passos
1. Validar requisitos com stakeholders (campos obrigatórios, fluxo de criação).
2. Priorizar quais seções entram no MVP inicial (ex.: resumo + transações + pendências).
3. Confirmar disponibilidade de endpoints ou organizar mocks.
4. Após aprovação deste plano, iniciar Fase 1 conforme roadmap.

---

Documento elaborado para orientar o desenvolvimento da página de Controle Financeiro mantendo consistência com a base de código atual e com a direção visual desejada.
