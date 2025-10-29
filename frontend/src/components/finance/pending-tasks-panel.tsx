'use client'

import { AlertCircle, Check, Clock, Plus, Repeat } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useFinancePendings, useMarkPendingPaid } from '@/hooks/react-query/finance'
import type { PendingPayment } from '@/lib/types/finance'
import { formatCurrency, getDaysUntilDue, isPaymentOverdue } from '@/lib/types/finance'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PendingTasksPanelProps {
  onAddPending?: () => void
  onPendingClick?: (pending: PendingPayment) => void
  maxHeight?: string
}

export function PendingTasksPanel({
  onAddPending,
  onPendingClick,
  maxHeight = '22rem',
}: PendingTasksPanelProps) {
  const { data: pendings, isLoading, error } = useFinancePendings()
  const markPaid = useMarkPendingPaid()

  const handleMarkPaid = async (pending: PendingPayment) => {
    try {
      await markPaid.mutateAsync(pending.id)
      toast.success(`Marked "${pending.description}" as paid`)
    } catch (err) {
      toast.error('Failed to mark payment as paid')
    }
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="space-y-3 text-center">
            <p className="text-sm text-destructive">Failed to load pending payments.</p>
            {onAddPending && (
              <Button onClick={onAddPending} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add payment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const activePendings = pendings?.filter((pending) => pending.status !== 'PAID') ?? []
  const overduePendings = activePendings.filter(isPaymentOverdue)

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Pending payments</CardTitle>
            <CardDescription>Track upcoming bills and outstanding commitments.</CardDescription>
          </div>
          {onAddPending && (
            <Button onClick={onAddPending} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add payment
            </Button>
          )}
        </div>
        {overduePendings.length > 0 && (
          <p className="text-sm font-medium text-destructive">
            {overduePendings.length} overdue payment{overduePendings.length > 1 ? 's' : ''}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-0">
        {isLoading ? (
          <PendingTasksPanelSkeleton />
        ) : activePendings.length === 0 ? (
          <EmptyState onAddPending={onAddPending} />
        ) : (
          <ScrollArea style={{ height: maxHeight }} className="h-full pr-4">
            <div className="space-y-3 pb-2">
              {activePendings.map((pending) => (
                <PendingCard
                  key={pending.id}
                  pending={pending}
                  onMarkPaid={handleMarkPaid}
                  onClick={() => onPendingClick?.(pending)}
                  isMarking={markPaid.isPending}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

interface PendingCardProps {
  pending: PendingPayment
  onMarkPaid: (pending: PendingPayment) => void
  onClick?: () => void
  isMarking: boolean
}

function PendingCard({ pending, onMarkPaid, onClick, isMarking }: PendingCardProps) {
  const daysUntilDue = getDaysUntilDue(pending.dueDate)
  const overdue = isPaymentOverdue(pending)
  const dueSoon = !overdue && daysUntilDue <= 3

  const accentClasses = overdue
    ? 'border-destructive bg-destructive/5'
    : dueSoon
    ? 'border-amber-500/60 bg-amber-500/10'
    : 'border-border'

  return (
    <div
      className={cn(
        'group rounded-md border p-4 transition-colors hover:bg-muted/40',
        accentClasses
      )}
    >
      <button
        type="button"
        onClick={() => onClick?.()}
        className={cn(
          'flex w-full flex-col gap-3 text-left',
          onClick ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {pending.description}
              </h4>
              {overdue && <AlertCircle className="h-4 w-4 text-destructive" />}
            </div>
            <p className="text-xl font-semibold text-foreground">
              {formatCurrency(pending.amount, pending.currency)}
            </p>
          </div>
          <Badge
            variant={pending.priority === 'HIGH' ? 'destructive' : 'secondary'}
            className="text-xs uppercase"
          >
            {pending.priority}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span
            className={cn(
              overdue && 'text-destructive font-semibold',
              dueSoon && 'text-amber-600 font-medium'
            )}
          >
            Due {new Date(pending.dueDate).toLocaleDateString()}
          </span>
          {overdue && (
            <span className="text-destructive">
              ({Math.abs(daysUntilDue)} days ago)
            </span>
          )}
          {!overdue && daysUntilDue === 0 && (
            <span className="text-amber-600 font-medium">(Today)</span>
          )}
          {!overdue && daysUntilDue === 1 && (
            <span className="text-amber-600 font-medium">(Tomorrow)</span>
          )}
          {!overdue && daysUntilDue > 1 && daysUntilDue <= 7 && (
            <span>({daysUntilDue} days)</span>
          )}
        </div>

        {pending.recurrence !== 'ONCE' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Repeat className="h-3.5 w-3.5" />
            <span className="capitalize">{pending.recurrence.toLowerCase()}</span>
          </div>
        )}
      </button>

      <Button
        size="sm"
        variant="secondary"
        className="mt-4 w-full gap-2"
        onClick={(event) => {
          event.stopPropagation()
          onMarkPaid(pending)
        }}
        disabled={isMarking}
      >
        <Check className="h-4 w-4" />
        {isMarking ? 'Marking...' : 'Mark as Paid'}
      </Button>
    </div>
  )
}

function PendingTasksPanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-md border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onAddPending }: { onAddPending?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <Check className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">All Caught Up!</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        You have no pending payments right now.
      </p>
      {onAddPending && (
        <Button onClick={onAddPending} variant="secondary" className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          Add Payment
        </Button>
      )}
    </div>
  )
}
