'use client'

import { Suspense, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TransactionList,
  PendingTasksPanel,
  QuickActions,
  TransactionModal,
  PendingPaymentModal,
} from '@/components/finance'
import type { Transaction, PendingPayment } from '@/lib/types/finance'

export default function FinanceControlPage() {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedPending, setSelectedPending] = useState<PendingPayment | null>(null)

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
    <div className="flex h-full w-full flex-col">
      <div className="border-b px-4 py-4 md:px-6 lg:px-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Finance Control</h1>
          <p className="text-sm text-muted-foreground">
            Manage your financial overview, transactions, and pending payments.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-[360px] w-full" />}>
              <TransactionList
                onTransactionClick={handleTransactionClick}
                onAddTransaction={() => setShowTransactionModal(true)}
                maxHeight="22rem"
              />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[360px] w-full" />}>
              <PendingTasksPanel
                onAddPending={() => setShowPendingModal(true)}
                onPendingClick={handlePendingClick}
                maxHeight="22rem"
              />
            </Suspense>
          </div>
        </div>
      </div>

      <QuickActions
        onAddTransaction={() => setShowTransactionModal(true)}
        onAddPending={() => setShowPendingModal(true)}
      />

      <TransactionModal open={showTransactionModal} onOpenChange={setShowTransactionModal} />
      <PendingPaymentModal open={showPendingModal} onOpenChange={setShowPendingModal} />
    </div>
  )
}
