'use client'

import { CalendarCheck2, ChevronRight, CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getDaysUntilDue } from '@/lib/types/finance'
import { cn } from '@/lib/utils'
import { useFinancePendings } from '@/hooks/react-query/finance'

interface FinanceCardBillingOverviewProps {
  className?: string
}

interface BillingEntry {
  id: string
  card: string
  brand: string
  invoiceAmount: number
  dueDate: Date
  status: 'A PAGAR' | 'PAGO' | 'ATRASADO'
}

const STATUS_STYLES: Record<BillingEntry['status'], string> = {
  'A PAGAR': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  PAGO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  ATRASADO: 'bg-red-500/10 text-red-400 border-red-500/30',
}

function getDueLabel(dueDate: Date) {
  const daysUntilDue = getDaysUntilDue(dueDate)

  if (daysUntilDue < 0) {
    const lateDays = Math.abs(daysUntilDue)
    return `${lateDays} dia${lateDays === 1 ? '' : 's'} em atraso`
  }

  if (daysUntilDue === 0) return 'Vence hoje'
  if (daysUntilDue === 1) return 'Vence amanhã'
  return `Vence em ${daysUntilDue} dias`
}

export function FinanceCardBillingOverview({ className }: FinanceCardBillingOverviewProps) {
  const { data: pendings, isLoading, error } = useFinancePendings()

  if (isLoading) {
    return (
      <Card className={cn('flex h-full flex-col min-h-[22rem]', className)}>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-foreground">Faturas e vencimentos</CardTitle>
              <CardDescription>
                Acompanhe as próximas cobranças de cartões corporativos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 pt-0">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('flex h-full flex-col min-h-[22rem]', className)}>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-foreground">Faturas e vencimentos</CardTitle>
              <CardDescription>
                Acompanhe as próximas cobranças de cartões corporativos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 pt-0">
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            Não foi possível carregar os dados de faturas.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Convert pending payments to billing entries
  const billingEntries: BillingEntry[] = (pendings || []).map((pending) => ({
    id: pending.id,
    card: pending.description || 'Pagamento Pendente',
    brand: pending.categoryId || 'Não especificado',
    invoiceAmount: pending.amount,
    dueDate: new Date(pending.dueDate),
    status: mapStatusToBilling(pending.status),
  }))

  const pendingEntries = billingEntries.filter((entry) => entry.status !== 'PAGO')
  const totalPendingAmount = pendingEntries.reduce((sum, entry) => sum + entry.invoiceAmount, 0)

  const nextDueEntry = [...pendingEntries]
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]

  function mapStatusToBilling(status: string): BillingEntry['status'] {
    switch (status) {
      case 'PENDING':
        return 'A PAGAR'
      case 'PAID':
        return 'PAGO'
      case 'OVERDUE':
        return 'ATRASADO'
      default:
        return 'A PAGAR'
    }
  }

  return (
    <Card className={cn('flex h-full flex-col min-h-[22rem]', className)}>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">Faturas e vencimentos</CardTitle>
            <CardDescription>
              Acompanhe as próximas cobranças e pagamentos pendentes.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground">
            Ver detalhes
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border bg-card/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Faturas abertas</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{pendingEntries.length}</p>
            <p className="text-[11px] text-muted-foreground">Pagamentos pendentes</p>
          </div>
          <div className="rounded-md border bg-card/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total devido</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(totalPendingAmount)}</p>
            <p className="text-[11px] text-muted-foreground">Somatório dos pendentes</p>
          </div>
          <div className="rounded-md border bg-card/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Próximo vencimento</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {nextDueEntry
                ? nextDueEntry.dueDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })
                : '--'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {nextDueEntry ? getDueLabel(nextDueEntry.dueDate) : 'Nenhuma fatura aberta'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        {billingEntries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div>
              <p>Nenhum pagamento pendente encontrado.</p>
              <p className="text-sm mt-2">Adicione novos pagamentos para visualizá-los aqui.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1.2fr,1fr,1fr] gap-2 rounded-md border bg-card/50 px-4 py-3 text-[12px] uppercase tracking-wide text-muted-foreground">
              <span className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5" /> Descrição
              </span>
              <span>Valor</span>
              <span className="flex items-center gap-2">
                <CalendarCheck2 className="h-3.5 w-3.5" /> Vencimento
              </span>
            </div>

            <div className="space-y-3">
              {billingEntries.slice(0, 6).map((entry) => {
                const dueLabel = getDueLabel(entry.dueDate)

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[1.2fr,1fr,1fr] items-center gap-2 rounded-md border bg-card/60 px-4 py-3 text-sm text-muted-foreground"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{entry.card}</span>
                      <span className="text-xs text-muted-foreground">{entry.brand}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">{formatCurrency(entry.invoiceAmount)}</span>
                      <Badge
                        variant="outline"
                        className={cn('border text-[10px] uppercase', STATUS_STYLES[entry.status])}
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col text-xs text-muted-foreground">
                      <span>{entry.dueDate.toLocaleDateString('pt-BR')}</span>
                      <span className="text-foreground/80">{dueLabel}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
