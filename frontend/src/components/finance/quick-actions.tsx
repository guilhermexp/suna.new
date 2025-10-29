'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SmartEntryModal } from './smart-entry-modal'

interface QuickActionsProps {
  onAddTransaction?: () => void
  onAddPending?: () => void
  onAddSubscription?: () => void
}

export function QuickActions({
  onAddTransaction,
  onAddPending,
  onAddSubscription,
}: QuickActionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 z-50"
        aria-label="Abrir assistente inteligente"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <SmartEntryModal
        open={open}
        onOpenChange={setOpen}
        onAddTransaction={onAddTransaction}
        onAddPending={onAddPending}
        onAddSubscription={onAddSubscription}
      />
    </>
  )
}
