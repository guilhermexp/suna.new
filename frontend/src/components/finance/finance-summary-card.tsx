'use client'

import { RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinanceSummary, useFinancePendings } from '@/hooks/react-query/finance'
import { formatCurrency, getDaysUntilDue, isPaymentOverdue } from '@/lib/types/finance'
import { cn } from '@/lib/utils'

export type FinanceSummarySection = 'overview' | 'pendings' | 'subscriptions' | 'cards'

interface FinanceSummaryCardProps {
  activeSection: FinanceSummarySection
  onSectionChange: (section: FinanceSummarySection) => void
}

export function FinanceSummaryCard({ activeSection, onSectionChange }: FinanceSummaryCardProps) {
  const { data: summary, isLoading, error, refetch } = useFinanceSummary()
  const { data: pendingsData, isLoading: pendingsLoading } = useFinancePendings()

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Não foi possível carregar o resumo financeiro.</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !summary) {
    return <FinanceSummaryCardSkeleton />
  }

  const pendings = pendingsData ?? []
  const activePendings = pendings.filter((pending) => pending.status !== 'PAID')
  const overduePendings = activePendings.filter((pending) => isPaymentOverdue(pending)).length
  const totalPendingAmount = activePendings.reduce((sum, pending) => sum + pending.amount, 0)

  const upcomingPendings = activePendings.slice(0, 3)
  const renderPendingsContent = (options: { showAll: boolean }) => {
    if (pendingsLoading) {
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-md border bg-card/50 p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: options.showAll ? 5 : 3 }).map((_, index) => (
              <div key={index} className="rounded-md border bg-card/50 p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (activePendings.length === 0) {
      return (
        <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center">
          <p className="text-sm font-medium text-foreground">Nenhuma pendência registrada</p>
          <p className="text-xs text-muted-foreground">
            Adicione novas cobranças para acompanhar vencimentos aqui.
          </p>
        </div>
      )
    }

    const entries = options.showAll ? activePendings : upcomingPendings

    return (
      <>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border bg-card/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">Total aberto</p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {formatCurrency(totalPendingAmount, summary.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {activePendings.length} pendência{activePendings.length === 1 ? '' : 's'} registrada{activePendings.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="rounded-md border bg-card/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">Atrasadas</p>
            <p className="mt-2 text-xl font-semibold text-destructive">{overduePendings}</p>
            <p className="text-xs text-muted-foreground">
              {overduePendings > 0 ? 'Priorize regularizar hoje' : 'Nenhuma pendência atrasada'}
            </p>
          </div>

          <div className="rounded-md border bg-card/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">Próximas</p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {entries.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {options.showAll
                ? 'Lista completa das pendências abertas'
                : `Mostrando as próximas ${Math.min(entries.length, 3)} cobranças`}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {entries.map((pending) => {
            const isOverdue = isPaymentOverdue(pending)
            const daysUntilDue = getDaysUntilDue(pending.dueDate)

            const dueLabel = isOverdue
              ? `${Math.abs(daysUntilDue)} dia${Math.abs(daysUntilDue) === 1 ? '' : 's'} em atraso`
              : daysUntilDue === 0
                ? 'Vence hoje'
                : daysUntilDue === 1
                  ? 'Vence amanhã'
                  : `Vence em ${daysUntilDue} dias`

            return (
              <div
                key={pending.id}
                className="rounded-md border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {pending.description}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(pending.amount, pending.currency)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(pending.dueDate).toLocaleDateString()}</span>
                  <span
                    className={cn(
                      isOverdue && 'text-destructive font-medium',
                      !isOverdue && daysUntilDue <= 2 && 'text-amber-600 font-medium'
                    )}
                  >
                    {dueLabel}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">
            Resumo financeiro
          </CardTitle>
          <CardDescription>Visão geral do saldo consolidado.</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          className="h-8 w-8 text-muted-foreground"
          aria-label="Refresh financial summary"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        <Tabs
          value={activeSection}
          onValueChange={(value) => onSectionChange(value as FinanceSummarySection)}
          className="space-y-4"
        >
          <TabsList className="grid w-full gap-2 sm:grid-cols-4">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="pendings">Pendências</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="cards">Cartões</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {renderPendingsContent({ showAll: false })}
          </TabsContent>

          <TabsContent value="pendings" className="space-y-4">
            {renderPendingsContent({ showAll: true })}
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center">
              <p className="text-sm font-semibold text-foreground">Assinaturas em breve</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Em desenvolvimento: acompanhe renovações, faturamento e status das suas assinaturas.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="cards">
            <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center">
              <p className="text-sm font-semibold text-foreground">Cartões em breve</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Em breve você poderá monitorar limites, faturas e gastos por cartão neste painel.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center">
          Última atualização: {new Date(summary.lastUpdated).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  )
}

function FinanceSummaryCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        <div className="grid w-full gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>

        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-md border bg-card/50 p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          ))}
        </div>

        <Skeleton className="mx-auto h-3 w-40" />
      </CardContent>
    </Card>
  )
}
