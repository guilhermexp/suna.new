# Subscription Calendar Card

Component de calendário para visualizar e gerenciar assinaturas/subscriptions recorrentes.

## Visão Geral

O `SubscriptionCalendarCard` é um card interativo que exibe um mini calendário mensal mostrando quando cada assinatura deve ser paga. Inspirado no design da imagem de referência, ele oferece uma visão clara dos gastos mensais com assinaturas.

## Funcionalidades

- ✅ **Mini Calendário Mensal**: Visualização completa do mês atual
- ✅ **Ícones de Serviços**: Cada assinatura é representada por um emoji/ícone
- ✅ **Indicadores Visuais**: Destaque do dia atual e dias com pagamentos
- ✅ **Total Mensal**: Cálculo automático do gasto total com assinaturas
- ✅ **Navegação**: Setas para navegar entre meses
- ✅ **Legenda**: Lista das principais assinaturas ativas
- ✅ **Categorias Coloridas**: Cores diferentes por categoria (entretenimento, produtividade, etc.)
- ✅ **Modal de Adição**: Interface completa para adicionar novas assinaturas

## Estrutura de Arquivos

```
frontend/src/components/finance/
├── subscription-calendar-card.tsx    # Componente do calendário
├── subscription-modal.tsx            # Modal para adicionar/editar
└── index.ts                          # Exports

frontend/src/hooks/react-query/finance/
├── use-subscriptions.ts              # Hook de gerenciamento
└── index.ts                          # Exports

frontend/src/lib/types/finance.ts     # Tipos TypeScript (já existiam)
```

## Uso Básico

```tsx
import { SubscriptionCalendarCard, SubscriptionModal } from '@/components/finance'
import { useSubscriptions, useCreateSubscription } from '@/hooks/react-query/finance'

function MyPage() {
  const [showModal, setShowModal] = useState(false)
  const { data: subscriptions } = useSubscriptions()
  const createSubscription = useCreateSubscription()

  return (
    <>
      <SubscriptionCalendarCard
        subscriptions={subscriptions}
        onAddSubscription={() => setShowModal(true)}
      />

      <SubscriptionModal
        open={showModal}
        onOpenChange={setShowModal}
        onSubmit={async (data) => {
          await createSubscription.mutateAsync(data)
        }}
      />
    </>
  )
}
```

## Props

### SubscriptionCalendarCard

| Prop | Tipo | Descrição |
|------|------|-----------|
| `subscriptions` | `Subscription[]` | Array de assinaturas a exibir |
| `onAddSubscription` | `() => void` | Callback ao clicar no botão de adicionar |
| `className` | `string` | Classes CSS adicionais |

### SubscriptionModal

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Estado de abertura do modal |
| `onOpenChange` | `(open: boolean) => void` | Callback de mudança de estado |
| `subscription` | `Subscription \| null` | Assinatura para editar (opcional) |
| `onSubmit` | `(data: SubscriptionFormData) => Promise<void>` | Callback ao submeter |

## Tipos

### Subscription

```typescript
interface Subscription {
  id: string
  serviceName: string        // Nome do serviço (Netflix, Spotify, etc.)
  amount: number            // Valor da assinatura
  currency: string          // Moeda (EUR, USD, etc.)
  billingDay: number        // Dia do mês para cobrança (1-31)
  icon?: string             // Emoji/ícone do serviço
  category: string          // Categoria (entertainment, productivity, etc.)
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  startDate: Date           // Data de início
  nextBilling: Date         // Próxima data de cobrança
  paymentHistory?: SubscriptionPayment[]
}
```

## Hooks Disponíveis

### useSubscriptions()
Busca todas as assinaturas do usuário.

```typescript
const { data, isLoading, error } = useSubscriptions()
```

### useCreateSubscription()
Cria uma nova assinatura.

```typescript
const createSubscription = useCreateSubscription()
await createSubscription.mutateAsync(data)
```

### useUpdateSubscription()
Atualiza uma assinatura existente.

```typescript
const updateSubscription = useUpdateSubscription()
await updateSubscription.mutateAsync({ id, data })
```

### useDeleteSubscription()
Remove uma assinatura.

```typescript
const deleteSubscription = useDeleteSubscription()
await deleteSubscription.mutateAsync(id)
```

### useActiveSubscriptions()
Retorna apenas assinaturas ativas.

```typescript
const { data: activeSubscriptions } = useActiveSubscriptions()
```

### useSubscriptionTotal()
Calcula o total mensal de assinaturas ativas.

```typescript
const { total, formatted } = useSubscriptionTotal()
// total: 43.72
// formatted: "€43.72"
```

## Categorias de Serviços

O componente suporta as seguintes categorias com cores distintas:

- **Entertainment** (Entretenimento): Roxo - Netflix, Spotify, YouTube
- **Productivity** (Produtividade): Azul - Notion, ChatGPT, LinkedIn
- **Development** (Desenvolvimento): Verde - GitHub, Figma, VS Code
- **Shopping** (Compras): Laranja - Amazon Prime
- **Other** (Outros): Cinza - Outros serviços

## Serviços Populares Pré-configurados

O modal inclui botões rápidos para serviços populares:

- Spotify 🎵
- Netflix 🎬
- Amazon Prime 📦
- LinkedIn 💼
- GitHub 👨‍💻
- ChatGPT 🤖
- YouTube Premium 📺
- Notion 📝
- Figma 🎨

## Funcionalidades do Calendário

### Navegação
- **Setas Esquerda/Direita**: Navegar entre meses
- **Indicador de Mês**: Exibe mês e ano atual

### Indicadores Visuais
- **Anel Azul**: Marca o dia atual
- **Ícones Coloridos**: Cada assinatura no seu dia de cobrança
- **Contador "+N"**: Quando há mais de 3 assinaturas no mesmo dia
- **Ponto Indicador**: Pequeno ponto no canto superior direito de dias com assinaturas

### Cálculo Automático
- **Monthly Spend**: Soma automática de todas assinaturas ativas
- Atualizado em tempo real ao adicionar/remover assinaturas

## Mock Data

O hook `useSubscriptions` atualmente usa dados mock para desenvolvimento:

```typescript
const MOCK_SUBSCRIPTIONS = [
  {
    serviceName: 'Spotify',
    amount: 9.99,
    billingDay: 7,
    category: 'entertainment',
    // ...
  },
  // ... mais assinaturas
]
```

## Integração com API (Próximos Passos)

Para conectar com o backend, substitua as funções mock em `use-subscriptions.ts`:

```typescript
// Substituir:
async function fetchSubscriptions(): Promise<Subscription[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_SUBSCRIPTIONS), 500)
  })
}

// Por:
async function fetchSubscriptions(): Promise<Subscription[]> {
  const response = await fetch('/api/finance/subscriptions')
  if (!response.ok) throw new Error('Failed to fetch subscriptions')
  return response.json()
}
```

## Melhorias Futuras

- [ ] Tooltip ao hover sobre ícones de assinatura
- [ ] Click no dia para ver detalhes das assinaturas daquele dia
- [ ] Filtro por categoria
- [ ] Gráfico de gastos por categoria
- [ ] Notificações de pagamentos próximos
- [ ] Histórico de pagamentos
- [ ] Exportação de dados
- [ ] Integração com calendário (Google Calendar, iCal)
- [ ] Suporte a múltiplas moedas
- [ ] Conversão automática de moeda

## Design System

O componente utiliza:
- **shadcn/ui**: Card, Button, Badge, Dialog, Form, etc.
- **Tailwind CSS**: Estilização responsiva
- **Lucide Icons**: Ícones ChevronLeft, ChevronRight, Plus, CalendarIcon
- **React Hook Form + Zod**: Validação de formulários
- **TanStack Query**: Gerenciamento de estado assíncrono

## Responsividade

- **Mobile**: Calendário 7x6 compacto, legenda em coluna
- **Tablet**: Layout otimizado com espaçamento adequado
- **Desktop**: Visualização completa com legenda horizontal

## Acessibilidade

- Labels semânticos em todos os inputs
- Navegação por teclado
- Estados de foco visíveis
- Mensagens de erro descritivas
- ARIA labels apropriados

## Testes (TODO)

```typescript
// Exemplo de testes a serem implementados
describe('SubscriptionCalendarCard', () => {
  it('should render current month', () => {})
  it('should display subscription icons on correct days', () => {})
  it('should calculate monthly total correctly', () => {})
  it('should navigate between months', () => {})
  it('should open modal on add button click', () => {})
})
```

## Troubleshooting

### Assinaturas não aparecem no calendário
- Verifique se `subscriptions` tem dados
- Confirme que `status === 'ACTIVE'`
- Verifique se `billingDay` está entre 1-31

### Total mensal incorreto
- Confirme que todas assinaturas têm `status: 'ACTIVE'`
- Verifique se `amount` é um número válido

### Modal não abre
- Verifique se `onAddSubscription` está sendo passado
- Confirme que o estado `showModal` está sendo gerenciado

## Contribuindo

Ao adicionar novos serviços populares:

1. Adicione em `POPULAR_SERVICES` no `subscription-modal.tsx`
2. Adicione o ícone em `SERVICE_ICONS` no `subscription-calendar-card.tsx`
3. Use emojis consistentes ou considere migrar para ícones SVG

## Exemplo Completo

Ver implementação em:
- `frontend/src/app/(dashboard)/finance-control/page.tsx`
