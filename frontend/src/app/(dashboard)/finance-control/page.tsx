'use client';

import { Suspense, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TransactionList,
  PendingTasksPanel,
  QuickActions,
  TransactionModal,
  PendingPaymentModal,
  SubscriptionCalendarCard,
  SubscriptionCalendarCardSkeleton,
  SubscriptionModal,
  PaymentsCollectionCard,
  FinanceCardWallet,
  FinanceCardBillingOverview,
} from '@/components/finance'
import {
  useSubscriptions,
  useCreateSubscription,
  useFinanceTransactions,
} from '@/hooks/react-query/finance'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Transaction, PendingPayment } from '@/lib/types/finance'

type FinanceTab = 'overview' | 'transactions' | 'payments'

export default function FinanceControlPage() {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [selectedPending, setSelectedPending] = useState<PendingPayment | null>(
    null,
  )
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview')

  const { data: subscriptions } = useSubscriptions()
  const createSubscription = useCreateSubscription()
  const { data: transactions, isLoading: transactionsLoading } =
    useFinanceTransactions()

  const pendingExpenses =
    transactions?.filter(
      (transaction) =>
        transaction.type === 'EXPENSE' && transaction.status === 'PENDING',
    ) ?? []
  const pendingReceivables =
    transactions?.filter(
      (transaction) =>
        transaction.type === 'INCOME' && transaction.status === 'PENDING',
    ) ?? []

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    // Future: Open transaction detail modal
    console.log('Transaction clicked:', transaction)
  }

  const handlePendingClick = (pending: PendingPayment) => {
    setSelectedPending(pending)
    // Future: Open pending detail modal
    console.log('Pending clicked:', pending)
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as FinanceTab)}
      className="flex h-full w-full flex-col"
    >
      <div className="border-b px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              Finance Control
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your financial overview, transactions, and pending payments.
            </p>
          </div>
          <TabsList className="flex">
            <TabsTrigger value="overview" className="px-4">
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="px-4">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="payments" className="px-4">
              Payments
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
          <TabsContent value="overview" className="space-y-6">
            <Suspense fallback={<SubscriptionCalendarCardSkeleton />}>
              <SubscriptionCalendarCard
                subscriptions={subscriptions}
                transactions={transactions}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="transactions" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-[360px] w-full" />}>
              <TransactionList
                onTransactionClick={handleTransactionClick}
                onAddTransaction={() => setShowTransactionModal(true)}
                maxHeight="calc(100vh - 320px)"
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="payments" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-[360px] w-full" />}>
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                <PendingTasksPanel
                  onAddPending={() => setShowPendingModal(true)}
                  onPendingClick={handlePendingClick}
                  maxHeight="22rem"
                />
                <PaymentsCollectionCard
                  title="Pagamentos a fazer"
                  description="Despesas aguardando pagamento."
                  transactions={pendingExpenses}
                  variant="expense"
                  isLoading={transactionsLoading}
                  onAdd={() => setShowPendingModal(true)}
                  addLabel="Adicionar pagamento"
                />
                <PaymentsCollectionCard
                  title="Recebimentos"
                  description="Entradas aguardando confirmação."
                  transactions={pendingReceivables}
                  variant="income"
                  isLoading={transactionsLoading}
                  onAdd={() => setShowTransactionModal(true)}
                  addLabel="Registrar recebimento"
                />
                <FinanceCardWallet />
                <FinanceCardBillingOverview className="lg:col-span-2 xl:col-span-2" />
              </div>
            </Suspense>
          </TabsContent>
        </div>
      </div>

      <QuickActions
        onAddTransaction={() => setShowTransactionModal(true)}
        onAddPending={() => setShowPendingModal(true)}
        onAddSubscription={() => setShowSubscriptionModal(true)}
      />

      <TransactionModal
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
      />
      <PendingPaymentModal
        open={showPendingModal}
        onOpenChange={setShowPendingModal}
      />
      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        onSubmit={async (data) => {
          await createSubscription.mutateAsync(data);
        }}
      />
    </Tabs>
  );
}
