'use client'

import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Filter, Plus, Search, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinanceTransactions } from '@/hooks/react-query/finance'
import type { Transaction, TransactionFilters, TransactionType } from '@/lib/types/finance'
import { formatCurrency, getTransactionSign, getStatusColor } from '@/lib/types/finance'
import { cn } from '@/lib/utils'

interface TransactionListProps {
  onTransactionClick?: (transaction: Transaction) => void
  onAddTransaction?: () => void
  maxHeight?: string
}

export function TransactionList({
  onTransactionClick,
  onAddTransaction,
  maxHeight = '22rem',
}: TransactionListProps) {
  const [filters, setFilters] = useState<TransactionFilters>({ type: 'ALL' })
  const [searchQuery, setSearchQuery] = useState('')

  const { data: transactions, isLoading, error } = useFinanceTransactions(filters)

  const filteredTransactions = transactions?.filter((transaction) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      transaction.description.toLowerCase().includes(query) ||
      transaction.category.toLowerCase().includes(query)
    )
  })

  const handleTypeFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      type: value as TransactionType | 'ALL',
    }))
  }

  const clearFilters = () => {
    setFilters({ type: 'ALL' })
    setSearchQuery('')
  }

  const hasActiveFilters = filters.type !== 'ALL' || searchQuery.length > 0

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="space-y-3 text-center">
            <p className="text-sm text-destructive">Failed to load transactions.</p>
            {onAddTransaction && (
              <Button onClick={onAddTransaction} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add transaction
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Recent transactions</CardTitle>
            <CardDescription>Review your latest income and expenses.</CardDescription>
          </div>
          {onAddTransaction && (
            <Button onClick={onAddTransaction} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add transaction
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filters.type} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-0">
        {isLoading ? (
          <TransactionListSkeleton />
        ) : !filteredTransactions || filteredTransactions.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onAddTransaction={onAddTransaction} />
        ) : (
          <ScrollArea style={{ height: maxHeight }} className="h-full pr-4">
            <div className="space-y-3 pb-2">
              {filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => onTransactionClick?.(transaction)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

interface TransactionRowProps {
  transaction: Transaction
  onClick?: () => void
}

function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const isIncome = transaction.type === 'INCOME'
  const sign = getTransactionSign(transaction.type)
  const amountColor = isIncome
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-destructive'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-md border bg-background p-4 text-left transition-colors',
        onClick
          ? 'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          : 'cursor-default'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          isIncome
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 text-destructive'
        )}
      >
        {isIncome ? (
          <ArrowDownCircle className="h-5 w-5" />
        ) : (
          <ArrowUpCircle className="h-5 w-5" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {transaction.description}
          </p>
          <Badge variant="secondary" className="flex-shrink-0 text-[10px] uppercase">
            {transaction.category}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{new Date(transaction.date).toLocaleDateString()}</span>
          {transaction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {transaction.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
              {transaction.tags.length > 2 && (
                <Badge variant="outline" className="text-[10px]">
                  +{transaction.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <p className={cn('text-sm font-semibold', amountColor)}>
          {sign}
          {formatCurrency(transaction.amount, 'USD')}
        </p>
        <Badge
          variant="outline"
          className={cn('text-[10px] uppercase', getStatusColor(transaction.status))}
        >
          {transaction.status}
        </Badge>
      </div>
    </button>
  )
}

function TransactionListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-md border p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  hasFilters: boolean
  onAddTransaction?: () => void
}

function EmptyState({ hasFilters, onAddTransaction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <ArrowUpCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {hasFilters ? 'No Transactions Match Your Filters' : 'No Transactions Yet'}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? 'Try adjusting or clearing the filters to see more transactions.'
          : 'Start tracking your cash flow by adding your first transaction.'}
      </p>
      {onAddTransaction && (
        <Button onClick={onAddTransaction} className="mt-6 gap-2" variant="secondary">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      )}
    </div>
  )
}
