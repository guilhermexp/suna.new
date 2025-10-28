# Finance React Query Hooks

This directory contains React Query hooks for the finance control page.

## Overview

The finance hooks provide a complete data layer for managing:
- Financial summary (total balance, accounts, variations)
- Transactions (income/expenses with filtering)
- Pending payments (bills, subscriptions, recurring payments)

## Hooks

### useFinanceSummary

Fetches and manages the financial summary including total balance across all accounts.

```typescript
import { useFinanceSummary } from '@/hooks/react-query/finance'

function Component() {
  const { data: summary, isLoading, error } = useFinanceSummary()
  
  return (
    <div>
      <h1>Total Balance: ${summary?.totalBalance}</h1>
      {summary?.accounts.map(account => (
        <div key={account.id}>{account.name}: ${account.balance}</div>
      ))}
    </div>
  )
}
```

### useUpdateBalance

Mutation hook to update account balances with optimistic updates.

```typescript
import { useUpdateBalance } from '@/hooks/react-query/finance'

function Component() {
  const updateBalance = useUpdateBalance()
  
  const handleDeposit = () => {
    updateBalance.mutate({ 
      accountId: 'acc-1', 
      amount: 1000 
    })
  }
  
  return <button onClick={handleDeposit}>Deposit $1000</button>
}
```

### useFinanceTransactions

Fetches transactions with optional filtering by type, date range, category, and tags.

```typescript
import { useFinanceTransactions } from '@/hooks/react-query/finance'

function Component() {
  const filters = {
    type: 'EXPENSE' as const,
    dateRange: {
      start: new Date('2024-10-01'),
      end: new Date('2024-10-31')
    }
  }
  
  const { data: transactions } = useFinanceTransactions(filters)
  
  return (
    <ul>
      {transactions?.map(t => (
        <li key={t.id}>{t.description}: ${t.amount}</li>
      ))}
    </ul>
  )
}
```

### useCreateTransaction

Mutation hook to create new transactions with optimistic updates.

```typescript
import { useCreateTransaction } from '@/hooks/react-query/finance'

function Component() {
  const createTransaction = useCreateTransaction()
  
  const handleSubmit = (data) => {
    createTransaction.mutate({
      type: 'EXPENSE',
      category: 'Groceries',
      description: 'Weekly shopping',
      amount: 150.00,
      date: new Date(),
      accountId: 'acc-1',
      tags: ['essential'],
    })
  }
  
  return <button onClick={handleSubmit}>Add Transaction</button>
}
```

### useFinancePendings

Fetches pending payments sorted by due date.

```typescript
import { useFinancePendings } from '@/hooks/react-query/finance'

function Component() {
  const { data: pendings } = useFinancePendings()
  
  return (
    <ul>
      {pendings?.map(p => (
        <li key={p.id}>
          {p.description}: ${p.amount} - Due: {p.dueDate.toLocaleDateString()}
          {p.status === 'OVERDUE' && <span>⚠️ Overdue</span>}
        </li>
      ))}
    </ul>
  )
}
```

### useMarkPendingPaid

Mutation hook to mark pending payments as paid with optimistic updates.

```typescript
import { useMarkPendingPaid } from '@/hooks/react-query/finance'

function Component({ pending }) {
  const markPaid = useMarkPendingPaid()
  
  const handleMarkPaid = () => {
    markPaid.mutate(pending.id)
  }
  
  return <button onClick={handleMarkPaid}>Mark as Paid</button>
}
```

## Query Keys

All query keys are exported and follow a hierarchical structure:

```typescript
// Summary
financeSummaryKeys.all           // ['finance', 'summary']
financeSummaryKeys.detail()      // ['finance', 'summary', 'detail']

// Transactions
transactionKeys.all              // ['finance', 'transactions']
transactionKeys.lists()          // ['finance', 'transactions', 'list']
transactionKeys.list(filters)    // ['finance', 'transactions', 'list', filters]

// Pendings
pendingKeys.all                  // ['finance', 'pendings']
pendingKeys.lists()              // ['finance', 'pendings', 'list']
pendingKeys.list(filters)        // ['finance', 'pendings', 'list', filters]
```

## Cache Configuration

- **Financial Summary**: 5 minute stale time, 10 minute cache time
- **Transactions**: 2 minute stale time, 10 minute cache time
- **Pendings**: 1 minute stale time, 5 minute cache time (more frequent for overdue detection)

## Optimistic Updates

All mutation hooks implement optimistic updates:

1. **onMutate**: Updates cache immediately with expected result
2. **onError**: Rolls back to previous state if mutation fails
3. **onSuccess/onSettled**: Invalidates related queries to refetch fresh data

## Cache Invalidation Strategy

When a mutation succeeds, related caches are invalidated:

- **Create/Update/Delete Transaction** → Invalidates transactions + summary
- **Mark Pending Paid** → Invalidates pendings + transactions + summary
- **Update Balance** → Invalidates summary only

## Mock Data

Currently using mock data generators from `@/lib/utils/finance/mockData`:

- `generateMockSummary()` - Generates realistic financial summary
- `generateMockTransactions(count)` - Generates multiple transactions
- `generateMockPendings(count)` - Generates pending payments

These will be replaced with real API calls in Phase 2 (Supabase integration).

## Testing

Test files are located in `__tests__` directories:
- `/lib/utils/finance/__tests__/mockData.test.ts`

Run tests:
```bash
npm test mockData.test.ts
```

## Future Enhancements

Phase 2 (Supabase Integration):
- Replace mock data with Supabase queries
- Add proper authentication headers
- Implement pagination for transactions
- Add real-time subscriptions for pending updates

Phase 3 (Subscriptions):
- Add `useFinanceSubscriptions` hook
- Add subscription calendar data fetching

Phase 4 (Credit Cards):
- Add `useFinanceCreditCards` hook
- Add credit card statement fetching
