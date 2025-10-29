'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { Transaction } from '@/lib/types/finance'
import { formatCurrency, getStatusColor, getTransactionSign } from '@/lib/types/finance'
import { cn } from '@/lib/utils'

interface PaymentsCollectionCardProps {
  title: string
  description: string
  transactions?: Transaction[]
  variant: 'expense' | 'income'
  isLoading?: boolean
  maxHeight?: string
  onAdd?: () => void
  addLabel?: string
}

const VARIANT_STYLES = {
  expense: {
    iconWrapper: 'bg-destructive/10 text-destructive',
    amountColor: 'text-destructive',
    emptyTitle: 'Nenhum pagamento agendado',
    emptyDescription: 'Cadastre novos pagamentos para acompanhar aqui.',
    defaultAddLabel: 'Novo pagamento',
  },
  income: {
    iconWrapper: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amountColor: 'text-emerald-600 dark:text-emerald-400',
    emptyTitle: 'Nenhum recebimento pendente',
    emptyDescription: 'Cadastre novos recebimentos para visualizar aqui.',
    defaultAddLabel: 'Novo recebimento',
  },
}

const ICON_BY_VARIANT = {
  expense: ArrowUpCircle,
  income: ArrowDownCircle,
}

const DEFAULT_MAX_HEIGHT = '22rem'

export function PaymentsCollectionCard({
  title,
  description,
  transactions = [],
  variant,
  isLoading = false,
  maxHeight = DEFAULT_MAX_HEIGHT,
  onAdd,
  addLabel,
}: PaymentsCollectionCardProps) {
  const variantStyles = VARIANT_STYLES[variant]
  const Icon = ICON_BY_VARIANT[variant]

  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onAdd && (
            <Button onClick={onAdd} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {addLabel ?? variantStyles.defaultAddLabel}
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border bg-card/50 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">Total</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Considera os valores cadastrados neste painel.
            </p>
          </div>
          <div className="rounded-md border bg-card/50 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">Lançamentos</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {transactions.length}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Quantidade de registros listados abaixo.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-0">
        {isLoading ? (
          <PaymentsCollectionCardSkeleton />
        ) : transactions.length === 0 ? (
          <EmptyState
            title={variantStyles.emptyTitle}
            description={variantStyles.emptyDescription}
            onAdd={onAdd}
            addLabel={addLabel ?? variantStyles.defaultAddLabel}
            icon={Icon}
          />
        ) : (
          <ScrollArea style={{ height: maxHeight }} className="h-full pr-4">
            <div className="space-y-3 pb-2">
              {transactions.map((transaction) => {
                const sign = getTransactionSign(transaction.type)

                return (
                  <div
                    key={transaction.id}
                    className="rounded-md border bg-card/50 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                            variantStyles.iconWrapper
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className={cn('text-sm font-semibold', variantStyles.amountColor)}>
                          {sign}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] uppercase',
                            getStatusColor(transaction.status)
                          )}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                      {transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {transaction.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] capitalize">
                              {tag}
                            </Badge>
                          ))}
                          {transaction.tags.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{transaction.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

function PaymentsCollectionCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-md border bg-card/50 p-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-2 h-5 w-24" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-md border bg-card/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  onAdd?: () => void
  addLabel: string
  icon: LucideIcon
}

function EmptyState({ title, description, onAdd, addLabel, icon: Icon }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-10 text-center">
      <div className="mb-4 rounded-full bg-muted p-5">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onAdd && (
        <Button onClick={onAdd} variant="secondary" className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}
