'use client'

import { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subscription, Transaction } from '@/lib/types/finance'
import { formatCurrency } from '@/lib/types/finance'

type CalendarBadge = {
  id: string
  label: string
  amount: number
  currency: string
  variant: 'subscription' | 'income' | 'expense'
  category?: string
}

type UpcomingEntry = {
  id: string
  variant: 'subscription' | 'income' | 'expense'
  title: string
  amount: number
  currency: string
  date: Date
  helper: string
  category?: string
}

interface SubscriptionCalendarCardProps {
  subscriptions?: Subscription[]
  transactions?: Transaction[]
  className?: string
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function getInitials(serviceName: string): string {
  return serviceName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function SubscriptionCalendarCard({
  subscriptions = [],
  transactions = [],
  className,
}: SubscriptionCalendarCardProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'ACTIVE'),
    [subscriptions],
  )

  const monthTransactions = useMemo(() => {
    return transactions
      .map((transaction) => ({
        ...transaction,
        date:
          transaction.date instanceof Date
            ? transaction.date
            : new Date(transaction.date),
      }))
      .filter(
        (transaction) =>
          transaction.date.getFullYear() === year &&
          transaction.date.getMonth() === month,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [transactions, year, month])

  const monthlyTotal = useMemo(
    () => activeSubscriptions.reduce((sum, subscription) => sum + subscription.amount, 0),
    [activeSubscriptions],
  )

  const incomeTransactions = useMemo(
    () => monthTransactions.filter((transaction) => transaction.type === 'INCOME'),
    [monthTransactions],
  )

  const expenseTransactions = useMemo(
    () => monthTransactions.filter((transaction) => transaction.type === 'EXPENSE'),
    [monthTransactions],
  )

  const incomeTotal = useMemo(
    () => incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [incomeTransactions],
  )

  const expenseTotal = useMemo(
    () => expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [expenseTransactions],
  )

  const upcomingEntries = useMemo(() => {
    const entries: UpcomingEntry[] = []

    activeSubscriptions.forEach((subscription) => {
      const nextBilling =
        subscription.nextBilling instanceof Date
          ? subscription.nextBilling
          : new Date(subscription.nextBilling)

      entries.push({
        id: `subscription-${subscription.id}`,
        variant: 'subscription',
        title: subscription.serviceName,
        amount: subscription.amount,
        currency: subscription.currency,
        date: nextBilling,
        category: subscription.category,
        helper: `Assinatura • vence dia ${subscription.billingDay}`,
      })
    })

    monthTransactions.forEach((transaction) => {
      entries.push({
        id: `transaction-${transaction.id}`,
        variant: transaction.type === 'INCOME' ? 'income' : 'expense',
        title: transaction.description,
        amount: transaction.amount,
        currency: 'BRL',
        date: transaction.date,
        helper: `${transaction.type === 'INCOME' ? 'Entrada' : 'Saída'} • ${transaction.category}`,
      })
    })

    return entries
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8)
  }, [activeSubscriptions, monthTransactions])

  const daysInMonth = getDaysInMonth(year, month)
  const firstWeekday = getFirstWeekday(year, month)

  const calendarEventsByDay = useMemo(() => {
    const map: Record<number, CalendarBadge[]> = {}

    const register = (day: number, event: CalendarBadge) => {
      if (!map[day]) map[day] = []
      map[day].push(event)
    }

    activeSubscriptions.forEach((subscription) => {
      const day = Math.min(subscription.billingDay, daysInMonth)
      register(day, {
        id: `subscription-${subscription.id}`,
        label: subscription.serviceName,
        amount: subscription.amount,
        currency: subscription.currency,
        variant: 'subscription',
        category: subscription.category,
      })
    })

    monthTransactions.forEach((transaction) => {
      const day = transaction.date.getDate()
      register(day, {
        id: `transaction-${transaction.id}`,
        label: transaction.description,
        amount: transaction.amount,
        currency: 'BRL',
        variant: transaction.type === 'INCOME' ? 'income' : 'expense',
      })
    })

    Object.values(map).forEach((events) =>
      events.sort((a, b) => b.amount - a.amount),
    )

    return map
  }, [activeSubscriptions, monthTransactions, daysInMonth])

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) calendarDays.push(null)
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const currentDay = isCurrentMonth ? today.getDate() : null

  const categoryClassName = (category: string) => {
    switch (category) {
      case 'entertainment':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-300'
      case 'productivity':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-300'
      case 'development':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
      case 'shopping':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-300'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              Assinaturas
            </CardTitle>
            <CardDescription>
              Acompanhe cobranças recorrentes e planeje seus gastos mensais.
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total mensal</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(
                monthlyTotal,
                activeSubscriptions[0]?.currency ?? 'BRL',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {MONTHS[month]} {year}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <SummaryTiles
          subscriptionsTotal={formatCurrency(
            monthlyTotal,
            activeSubscriptions[0]?.currency ?? 'BRL',
          )}
          subscriptionsCount={activeSubscriptions.length}
          incomeTotal={formatCurrency(incomeTotal)}
          incomeCount={incomeTransactions.length}
          expenseTotal={formatCurrency(expenseTotal)}
          expenseCount={expenseTransactions.length}
        />

        <div className="grid grid-cols-7 gap-[3px] text-xs uppercase tracking-tight text-muted-foreground">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex h-7 items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-[3px]">
          {calendarDays.map((day, index) => {
            const eventsForDay = day ? calendarEventsByDay[day] || [] : []
            const isToday = day === currentDay

            return (
              <div
                key={`${day ?? 'empty'}-${index}`}
                className={cn(
                  'flex min-h-[72px] flex-col gap-1 rounded-md border bg-card p-2 transition-colors',
                  day
                    ? 'hover:bg-muted/60'
                    : 'pointer-events-none border-dashed bg-muted/30',
                  isToday && 'border-primary/60 shadow-sm',
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        'text-xs font-medium text-muted-foreground',
                        isToday && 'text-primary font-semibold',
                      )}
                    >
                      {day}
                    </span>

                    {eventsForDay.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {eventsForDay.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              'flex items-start gap-2 rounded-md px-2 py-1 transition-colors',
                              getEventContainerClass(event),
                            )}
                          >
                            <div
                          className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase',
                              getEventAvatarClass(event, categoryClassName),
                            )}
                        >
                          {getEventAvatarLabel(event, getInitials)}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <p className="truncate text-xs font-medium text-foreground">
                                {event.label}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {getEventAmountDisplay(event)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {eventsForDay.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{eventsForDay.length - 2} mais
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Próximos eventos</p>
            <span className="text-xs text-muted-foreground">
              {upcomingEntries.length} registro
              {upcomingEntries.length === 1 ? '' : 's'} neste período
            </span>
          </div>
          {upcomingEntries.length === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Não há eventos previstos para este mês.
            </div>
          ) : (
            <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-2">
              {upcomingEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase',
                        getEntryAvatarClass(entry, categoryClassName),
                      )}
                    >
                      {getEntryAvatarLabel(entry, getInitials)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {entry.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{entry.date.toLocaleDateString()}</span>
                        <Badge
                          variant="secondary"
                          className={cn('uppercase', getEntryBadgeClass(entry))}
                        >
                          {getEntryBadgeLabel(entry)}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {entry.helper}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatEntryAmount(entry)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryTiles({
  subscriptionsTotal,
  subscriptionsCount,
  incomeTotal,
  incomeCount,
  expenseTotal,
  expenseCount,
}: {
  subscriptionsTotal: string
  subscriptionsCount: number
  incomeTotal: string
  incomeCount: number
  expenseTotal: string
  expenseCount: number
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryTile
        label="Assinaturas ativas"
        value={subscriptionsTotal}
        helper={`${subscriptionsCount} serviço${subscriptionsCount === 1 ? '' : 's'}`}
      />
      <SummaryTile
        label="Entradas"
        value={incomeTotal}
        helper={`${incomeCount} lançamento${incomeCount === 1 ? '' : 's'}`}
        tone="positive"
      />
      <SummaryTile
        label="Saídas"
        value={expenseTotal}
        helper={`${expenseCount} lançamento${expenseCount === 1 ? '' : 's'}`}
        tone="negative"
      />
    </div>
  )
}

function SummaryTile({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone?: 'positive' | 'negative'
}) {
  const valueClass =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-300'
      : tone === 'negative'
        ? 'text-rose-600 dark:text-rose-300'
        : 'text-foreground'

  return (
    <div className="rounded-md border bg-card/60 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-2 text-lg font-semibold', valueClass)}>{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function getEventContainerClass(event: CalendarBadge) {
  switch (event.variant) {
    case 'income':
      return 'border border-emerald-500/40 bg-emerald-500/5'
    case 'expense':
      return 'border border-rose-500/40 bg-rose-500/5'
    default:
      return 'border bg-background'
  }
}

function getEventAvatarClass(
  event: CalendarBadge,
  subscriptionCategoryClass: (category: string) => string,
) {
  if (event.variant === 'subscription') {
    return subscriptionCategoryClass(event.category ?? 'other')
  }

  return event.variant === 'income'
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
    : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
}

function getEventAvatarLabel(
  event: CalendarBadge,
  initials: (label: string) => string,
) {
  if (event.variant === 'subscription') {
    return initials(event.label)
  }

  return event.variant === 'income' ? 'IN' : 'OUT'
}

function getEventAmountDisplay(event: CalendarBadge) {
  const formatted = formatCurrency(event.amount, event.currency)
  if (event.variant === 'income') {
    return `+${formatted}`
  }
  if (event.variant === 'expense') {
    return `-${formatted}`
  }
  return formatted
}

function getEntryAvatarClass(
  entry: UpcomingEntry,
  subscriptionCategoryClass: (category: string) => string,
) {
  if (entry.variant === 'subscription') {
    return subscriptionCategoryClass(entry.category ?? 'other')
  }

  return entry.variant === 'income'
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
    : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
}

function getEntryAvatarLabel(
  entry: UpcomingEntry,
  initials: (label: string) => string,
) {
  if (entry.variant === 'subscription') {
    return initials(entry.title)
  }
  return entry.variant === 'income' ? 'IN' : 'OUT'
}

function getEntryBadgeClass(entry: UpcomingEntry) {
  switch (entry.variant) {
    case 'income':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
    case 'expense':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
    default:
      return 'text-muted-foreground'
  }
}

function getEntryBadgeLabel(entry: UpcomingEntry) {
  switch (entry.variant) {
    case 'income':
      return 'Entrada'
    case 'expense':
      return 'Saída'
    default:
      return 'Assinatura'
  }
}

function formatEntryAmount(entry: UpcomingEntry) {
  const formatted = formatCurrency(entry.amount, entry.currency)
  if (entry.variant === 'income') {
    return `+${formatted}`
  }
  if (entry.variant === 'expense') {
    return `-${formatted}`
  }
  return formatted
}

export function SubscriptionCalendarCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-8 w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-md border bg-card/60 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-5 w-20" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-7 gap-[3px]">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton key={index} className="h-[72px] w-full rounded-md" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
