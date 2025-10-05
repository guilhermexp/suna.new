# Análise de Páginas de Upgrade para Self-Hosting

## Visão Geral

Este documento analisa todas as páginas e componentes de upgrade/billing encontrados no sistema Suna, avaliando os riscos de remoção para ambientes self-hosted e propondo um plano de implementação seguro.

## Componentes e Páginas Identificados

### 1. Diálogos de Upgrade (Alto Impacto)

#### `/components/ui/upgrade-dialog.tsx`
- **Descrição**: Componente genérico de diálogo de upgrade
- **Função**: Base para outros diálogos de upgrade
- **Uso em Self-Hosting**: Pode ser adaptado para mensagens informativas
- **Risco de Remoção**: **ALTO** - Múltiplos componentes dependem dele

#### `/app/(dashboard)/projects/[projectId]/thread/_components/UpgradeDialog.tsx`
- **Descrição**: Diálogo específico de upgrade dentro de threads
- **Função**: Oferece upgrade durante uso do sistema
- **Uso em Self-Hosting**: Desnecessário, mas pode mostrar informações de limites
- **Risco de Remoção**: **MÉDIO** - Usado apenas em contextos específicos

### 2. Modal de Cobrança (Alto Impacto)

#### `/components/billing/billing-modal.tsx`
- **Descrição**: Modal principal para gerenciamento de cobrança
- **Função**: Assinaturas, compra de créditos, gerenciamento
- **Proteções**: Já verifica `isLocalMode()` e desabilita funcionalidades
- **Uso em Self-Hosting**: Pode mostrar informações de uso local
- **Risco de Remoção**: **ALTO** - Central para sistema de billing

### 3. Seções de Preços (Médio Impacto)

#### `/components/home/sections/pricing-section.tsx`
- **Descrição**: Seção de preços na página inicial
- **Função**: Mostrar planos e preços para upgrade
- **Proteções**: Verifica `isLocalMode()` para desabilitar compras
- **Uso em Self-Hosting**: Pode ser mantido para fins informativos
- **Risco de Remoção**: **BAIXO** - Principalmente visual

#### `/app/(dashboard)/model-pricing/page.tsx`
- **Descrição**: Página detalhada de preços por modelo
- **Função**: Informar custos de tokens por modelo
- **Uso em Self-Hosting**: **MUITO ÚTIL** para controle de custos
- **Risco de Remoção**: **BAIXO** - Informação valiosa para self-hosting

### 4. Páginas Enterprise (Baixo Impacto)

#### `/app/(home)/enterprise/page.tsx`
- **Descrição**: Página de serviços enterprise
- **Função**: Oferecer serviços de implementação enterprise
- **Uso em Self-Hosting**: Completamente desnecessário
- **Risco de Remoção**: **MUITO BAIXO** - Não afeta self-hosting

#### Páginas de Billing (Substituem a antiga “subscription”)
- `frontend/src/app/(dashboard)/(personalAccount)/settings/billing/page.tsx`
  - **Descrição**: Billing da conta pessoal
  - **Função**: Status, créditos e gerenciamento via modal
  - **Uso em Self-Hosting**: Desnecessário para compra/gestão; útil para exibir status local
  - **Risco de Remoção**: **MÉDIO** — diversas referências/links
- `frontend/src/app/(dashboard)/(teamAccount)/[accountSlug]/settings/billing/page.tsx`
  - **Descrição**: Billing por equipe
  - **Função**: Status e atalho para modal
  - **Uso em Self-Hosting**: Desnecessário para compra/gestão; útil para status
  - **Risco de Remoção**: **MÉDIO**

### 5. Navegação e Layout (Baixo Impacto)

#### `/app/(dashboard)/(personalAccount)/settings/layout.tsx`
- **Descrição**: Layout das configurações da conta pessoal
- **Função**: Navegação para billing e transações
- **Modificação Necessária**: Remover link "Billing"
- **Risco de Modificação**: **MUITO BAIXO**

## Proteções Existentes para Self-Hosting

### Função `isLocalMode()`
A função `isLocalMode()` em `/lib/config.ts` já protege muitas funcionalidades:

```typescript
export const isLocalMode = (): boolean => {
  return config.IS_LOCAL;
};
```

### Verificações Existentes
- **Billing pages**: Já mostram "Local development mode - billing features are disabled"
- **Model selector**: Mostra todos os modelos em modo local
- **Thread components**: Desabilitam diálogos de upgrade
- **Usage previews**: Escondidos em modo local

## Plano de Implementação Faseado

### Fase 1: Modificações Seguras (Baixo Risco)

#### 1.1 Remover Navegação de Billing
- **Arquivo**: `/app/(dashboard)/(personalAccount)/settings/layout.tsx`
- **Alteração**: Remover item "Billing" da navegação
- **Justificativa**: Billing não se aplica a self-hosting
- **Risco**: **MUITO BAIXO**

```typescript
// Remover do array items:
{ name: 'Billing', href: '/settings/billing' },
```

#### 1.2 Modificar UpgradeDialog Thread
- **Arquivo**: `/app/(dashboard)/projects/[projectId]/thread/_components/UpgradeDialog.tsx`
- **Alteração**: Mostrar mensagem informativa sobre self-hosting
- **Justificativa**: Manter funcionalidade sem confundir usuários
- **Risco**: **BAIXO**

#### 1.3 Modificar PricingSection
- **Arquivo**: `/components/home/sections/pricing-section.tsx`
- **Alteração**: Mudar foco para informações educativas sobre modelos
- **Justificativa**: Manter informações úteis sem promover upgrade
- **Risco**: **BAIXO**

### Fase 2: Adaptações (Risco Médio)

#### 2.1 Simplificar BillingModal
- **Arquivo**: `/components/billing/billing-modal.tsx`
- **Alteração**: Mostrar apenas informações de uso local e controle de custos
- **Justificativa**: Manter estrutura útil para self-hosting
- **Risco**: **MÉDIO** - Componente complexo

#### 2.2 Modificar Página de Model Pricing
- **Arquivo**: `/app/(dashboard)/model-pricing/page.tsx`
- **Alteração**: Remover referências a upgrade, focar em informações técnicas
- **Justificativa**: Informação valiosa para controle de custos
- **Risco**: **BAIXO** - Apenas conteúdo

### Fase 3: Remoções Opcionais (Risco Alto - Apenas se Necessário)

#### 3.1 Remover Página Enterprise
- **Arquivo**: `/app/(home)/enterprise/page.tsx`
- **Alteração**: Remover completamente
- **Justificativa**: Enterprise não se aplica a self-hosting
- **Risco**: **BAIXO** - Poucas dependências

#### 3.2 Remover Página Subscription
- **Arquivo**: `/app/(subscription/page.tsx`
- **Alteração**: Remover completamente
- **Justificativa**: Assinaturas não existem em self-hosting
- **Risco**: **MÉDIO** - Pode ter links externos

## Riscos e Mitigações

### Riscos Principais

1. **Quebra de Navegação**
   - **Descrição**: Links quebrados se páginas removidas
   - **Mitigação**: Mapear todas as referências antes da remoção
   - **Verificação**: Testar todos os links após alterações

2. **Dependências Ocultas**
   - **Descrição**: Componentes inesperados dependendo dos diálogos
   - **Mitigação**: Buscar por todas as importações dos componentes
   - **Verificação**: Testar funcionalidades relacionadas

3. **Perda de Informações Úteis**
   - **Descrição**: Remover informações que poderiam ajudar usuários
   - **Mitigação**: Preservar dados educacionais sobre custos
   - **Verificação**: Avaliar valor de cada informação

### Estratégias de Mitigação

1. **Fallback Seguro**
   ```typescript
   // Exemplo: Modificar UpgradeDialog para mostrar mensagem apropriada
   if (isLocalMode()) {
     return <SelfHostedInfoDialog />;
   }
   ```

2. **Teste Gradual**
   - Implementar uma fase por vez
   - Testar completamente cada fase
   - Reverter se problemas detectados

3. **Preservação de Informações Úteis**
   - Manter dados de preços de modelos
   - Preservar informações de controle de custos
   - Manter estrutura básica para futuras modificações

## Recomendações

### Componentes a Modificar (Não Remover)
1. **BillingModal** - Adaptar para controle de custos local
2. **Model Pricing Page** - Manter como ferramenta informativa
3. **UpgradeDialog genérico** - Manter para reutilização

### Componentes a Remover
1. **Enterprise Page** - Sem relevância para self-hosting
2. **Subscription Page** - Assinaturas não se aplicam
3. **Links de Billing** - Navegação desnecessária

### Melhores Práticas
1. **Sempre preservar informações úteis sobre custos**
2. **Manter estrutura básica para futuras implementações**
3. **Testar completamente cada modificação**
4. **Documentar todas as alterações feitas**

## Conclusão

A remoção de funcionalidades de upgrade pode ser feita de forma segura seguindo um plano faseado. O sistema já possui boas proteções para self-hosting através da função `isLocalMode()`, mas ainda mostra elementos desnecessários de upgrade.

A abordagem recomendada é **adaptar** em vez de **remover** sempre que possível, preservando informações úteis enquanto elimina confusão sobre funcionalidades não disponíveis em self-hosting.

---

**Data**: 4 de Outubro de 2024  
**Análise**: Baseada no código fonte v0.1.0  
**Ambiente**: Self-hosting local mode

---

## Validação Técnica — 05 de Outubro de 2025

Esta seção consolida caminhos reais, pontos de uso e proteções detectadas no código atual, para reduzir risco de erro ao executar remoções/ajustes.

### Componentes/Páginas Confirmados (com caminhos)

- Diálogo genérico de upgrade (reutilizado amplamente)
  - `frontend/src/components/ui/upgrade-dialog.tsx`

- Diálogo de upgrade (dentro de thread)
  - `frontend/src/app/(dashboard)/projects/[projectId]/thread/_components/UpgradeDialog.tsx`
  - Exibição gated por `!isLocalMode()` no thread:
    - `frontend/src/components/thread/ThreadComponent.tsx:765`

- Modal de Billing (centraliza planos/gestão/portal)
  - `frontend/src/components/billing/billing-modal.tsx`
  - Em modo local, retorna conteúdo informativo (desabilitado):
    - `frontend/src/components/billing/billing-modal.tsx:210-229`

- Seção de Preços (homepage/diálogos)
  - `frontend/src/components/home/sections/pricing-section.tsx`
  - Em modo local, exibe aviso e desabilita billing:
    - `frontend/src/components/home/sections/pricing-section.tsx:674-682`

- Página de preços por modelo (recomendado manter)
  - `frontend/src/app/(dashboard)/model-pricing/page.tsx`

- Página Enterprise (pouco relevante para self-hosting)
  - `frontend/src/app/(home)/enterprise/page.tsx`
  - Link na home: `frontend/src/lib/home.tsx:80`

- Layout de Settings (conta pessoal) — contém link “Billing”
  - `frontend/src/app/(dashboard)/(personalAccount)/settings/layout.tsx`
  - Item atual: `Billing` em `items` (linha ~15)

- Páginas de Billing (substituem “subscription” genérica)
  - Pessoal: `frontend/src/app/(dashboard)/(personalAccount)/settings/billing/page.tsx`
  - Time: `frontend/src/app/(dashboard)/(teamAccount)/[accountSlug]/settings/billing/page.tsx`

### Mapa de Usos — Onde Upgrade/Billing aparece

- UpgradeDialog usado em:
  - `frontend/src/components/agents/agent-count-limit-dialog.tsx`
  - `frontend/src/app/(dashboard)/projects/[projectId]/thread/_components/UpgradeDialog.tsx`
  - `frontend/src/components/thread/agent-run-limit-dialog.tsx`

- BillingModal referenciado em:
  - `frontend/src/app/(dashboard)/(personalAccount)/settings/billing/page.tsx`
  - `frontend/src/app/(dashboard)/(teamAccount)/[accountSlug]/settings/billing/page.tsx`
  - `frontend/src/app/(dashboard)/projects/[projectId]/thread/_components/UpgradeDialog.tsx`
  - `frontend/src/components/home/sections/hero-section.tsx`
  - `frontend/src/components/thread/chat-input/chat-input.tsx`
  - `frontend/src/components/agents/config/model-selector.tsx`
  - `frontend/src/components/sidebar/nav-user-with-teams.tsx`

### Pontos de Navegação que Precisam de Condicional (Local)

- Menu do usuário (header/sidebar):
  - “Upgrade” abre BillingModal — ocultar em `isLocalMode()`
    - `frontend/src/components/sidebar/nav-user-with-teams.tsx:323-326`
  - “Billing” (link para settings/billing) — ocultar em `isLocalMode()`
    - `frontend/src/components/sidebar/nav-user-with-teams.tsx:327-332`

- Layout de Settings (conta pessoal):
  - Remover/condicionar item `Billing` do array `items`
    - `frontend/src/app/(dashboard)/(personalAccount)/settings/layout.tsx:14-17`

### Proteções/Comportamento em Modo Local

- Frontend:
  - `isLocalMode()` definido em `frontend/src/lib/config.ts`
  - Desabilita pricing/billing na UI (PricingSection, BillingModal), evita mostrar UpgradeDialog no thread

- Backend:
  - `EnvMode.LOCAL` retorna permissões/creditos “infinito” e ignora cobranças:
    - `backend/core/billing/api.py` (handlers `/billing/check` e `/billing/check-status`)
  - Checagens unificadas de billing/modelos respeitam LOCAL:
    - `backend/core/agent_runs.py` e `backend/core/triggers/execution_service.py`

### Plano Atualizado (Preciso e com Caminhos)

Fase 1 — Modificações seguras (sem quebrar UX):
1) Ocultar navegação “Billing” no settings (local)
   - Editar `frontend/src/app/(dashboard)/(personalAccount)/settings/layout.tsx`
   - Remover ou condicionar `{ name: 'Billing', href: '/settings/billing' }`
2) Ocultar “Upgrade” e “Billing” no menu do usuário (local)
   - Editar `frontend/src/components/sidebar/nav-user-with-teams.tsx`
   - Condicionar itens das linhas 323–332 a `!isLocalMode()`
3) Manter `BillingModal` e `UpgradeDialog` (já possuem gating/UX informativa em local)
4) Manter “Model Pricing” e garantir link de acesso via settings ou dashboard

Fase 2 — Adaptações opcionais:
5) Tornar o conteúdo do UpgradeDialog informativo em self-host (sem CTA de compra)
   - `frontend/src/app/(dashboard)/projects/[projectId]/thread/_components/UpgradeDialog.tsx`
6) Simplificar `BillingModal` em local (já faz early-return; opcional ajustar texto)
7) Ajustar copy na PricingSection para foco educativo (já mostra aviso em local)

Fase 3 — Remoções opcionais:
8) Remover página Enterprise e/ou link da home
   - Página: `frontend/src/app/(home)/enterprise/page.tsx`
   - Link: `frontend/src/lib/home.tsx:80`

### Checklist de Execução

Antes de aplicar remoções/condicionais:
- [ ] Buscar por usos de `UpgradeDialog` e `BillingModal` e confirmar que não há renderizações sem gating
- [ ] Validar todos os links para `/settings/billing` e botões que abrem BillingModal
- [ ] Confirmar que PricingSection e BillingModal exibem aviso em local
- [ ] Rodar smoke test de navegação: menu usuário, settings, thread, home
- [ ] Em produção/staging, confirmar que gating não oculta nada por engano

### Comandos de Verificação (ripgrep)

```
rg -n --hidden -S "components/ui/upgrade-dialog|UpgradeDialog" frontend
rg -n --hidden -S "components/billing/billing-modal" frontend
rg -n --hidden -S "isLocalMode\(\)" frontend
rg -n --hidden -S "settings/billing|/model-pricing|/enterprise" frontend
```

### Notas

- O documento original mencionava uma página genérica “subscription”; os paths corretos hoje são as páginas de settings/billing (pessoal e time).
- Preferir “adaptar” em vez de “remover”, mantendo estruturas úteis para futuros ajustes.
