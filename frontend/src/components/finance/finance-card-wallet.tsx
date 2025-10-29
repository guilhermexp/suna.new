'use client'

import { Bitcoin, CreditCard, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/types/finance'
import { cn } from '@/lib/utils'
import { useFinanceSummary } from '@/hooks/react-query/finance'

interface FinanceCardWalletProps {
  className?: string
}

export function FinanceCardWallet({ className }: FinanceCardWalletProps) {
  const { data: financeData, isLoading, error } = useFinanceSummary()

  if (isLoading) {
    return (
      <Card className={cn('flex h-full flex-col min-h-[22rem]', className)}>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Saldos por carteira
            </CardTitle>
            <Badge variant="outline" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Carregando...
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 pt-0">
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !financeData) {
    return (
      <Card className={cn('flex h-full flex-col min-h-[22rem]', className)}>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Saldos por carteira
            </CardTitle>
            <Badge variant="outline" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Erro
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 pt-0">
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            Não foi possível carregar os dados financeiros.
          </div>
        </CardContent>
      </Card>
    )
  }

  const getAccountAccent = (accountType: string) => {
    switch (accountType) {
      case 'FUNDING':
        return 'bg-rose-500/15 text-rose-500'
      case 'TRADING':
        return 'bg-indigo-500/15 text-indigo-500'
      case 'SAVINGS':
        return 'bg-emerald-500/15 text-emerald-500'
      case 'CHECKING':
        return 'bg-blue-500/15 text-blue-500'
      default:
        return 'bg-slate-500/15 text-slate-500'
    }
  }

  const getAccountLabel = (accountType: string) => {
    switch (accountType) {
      case 'FUNDING':
        return 'Funding'
      case 'TRADING':
        return 'Trading'
      case 'SAVINGS':
        return 'Poupança'
      case 'CHECKING':
        return 'Conta Corrente'
      case 'CREDIT':
        return 'Cartão de Crédito'
      default:
        return accountType
    }
  }

  return (
    <Card className={cn('flex h-full flex-col min-h-[22rem]', className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Saldos por carteira
          </CardTitle>
          <Badge variant="outline" className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {financeData.accounts.length} contas
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {financeData.accounts.slice(0, 4).map((account) => (
            <div
              key={account.id}
              className="flex h-full flex-col justify-between gap-3 rounded-md border bg-card/40 p-4"
            >
              <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {getAccountLabel(account.type)}
                </span>
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', getAccountAccent(account.type))}>
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-xl font-semibold text-foreground">
                {formatCurrency(account.balance)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {account.currency}
              </p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border bg-card/60 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Saldo total</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {formatCurrency(financeData.totalBalance)}
            </p>
          </div>
          {financeData.cryptoEquivalent && (
            <div className="flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-sm text-muted-foreground">
              <Bitcoin className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-foreground">
                {financeData.cryptoEquivalent.amount.toLocaleString('pt-BR', {
                  minimumFractionDigits: 6,
                  maximumFractionDigits: 6,
                })}{' '}
                {financeData.cryptoEquivalent.symbol}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card/60 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">Atualizado</span>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-foreground">
            {new Date(financeData.lastUpdated).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
