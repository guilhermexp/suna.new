'use client'

import { useState, useMemo } from 'react'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  useCreatePending,
  useCreateTransaction,
} from '@/hooks/react-query/finance'
import type {
  PendingPaymentFormData,
  Priority,
  Recurrence,
  TransactionFormData,
  TransactionType,
} from '@/lib/types/finance'

type SmartEntryType = {
  entryType: 'transaction' | 'pending'
  transaction?: {
    type?: TransactionType
    amount?: number
    currency?: string
    description?: string
    category?: string
    date?: string
    counterparty?: string
    notes?: string
    tags?: string[]
  }
  pending?: {
    amount?: number
    currency?: string
    description?: string
    dueDate?: string
    priority?: Priority
    recurrence?: Recurrence
    counterparty?: string
    notes?: string
  }
  raw?: string
}

interface SmartEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction?: () => void
  onAddPending?: () => void
}

const SUGGESTIONS = [
  'Recebi 1250 do cliente Bruno ontem',
  'Pendência 3200 aluguel vence dia 10',
  'Pagamento cartão Nubank 450 amanhã',
  'Depositar salário 5000 hoje',
]

export function SmartEntryModal({
  open,
  onOpenChange,
  onAddTransaction,
  onAddPending,
}: SmartEntryModalProps) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const createTransaction = useCreateTransaction()
  const createPending = useCreatePending()

  function resetState() {
    setInput('')
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      if (!isProcessing) {
        resetState()
        onOpenChange(false)
      }
    } else {
      onOpenChange(true)
    }
  }

  async function handleInterpretation() {
    if (!input.trim()) {
      toast.error('Escreva o que deseja registrar primeiro.')
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!baseUrl) {
      toast.error('Backend não configurado. Defina NEXT_PUBLIC_BACKEND_URL.')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`${baseUrl}/finance/interpret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.error || 'Falha ao interpretar a instrução.')
      }

      const data: SmartEntryType = await response.json()

      if (data.entryType === 'transaction' && data.transaction) {
        await createTransactionEntry(data.transaction)
      } else if (data.entryType === 'pending' && data.pending) {
        await createPendingEntry(data.pending)
      } else {
        throw new Error('Não consegui entender se é transação ou pendência.')
      }

      toast.success('Registro criado automaticamente.')
      resetState()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível criar o registro.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function createTransactionEntry(parsed: SmartEntryType['transaction']) {
    const description = parsed?.description?.trim() || input.trim()
    const amount = Math.abs(parsed?.amount ?? 0)
    if (!amount) {
      throw new Error('Não encontrei o valor da transação.')
    }

    const normalizedType = inferTransactionType(parsed?.type, input)

    const transactionData: TransactionFormData = {
      type: normalizedType,
      category: parsed?.category || 'General',
      description,
      amount,
      date: parsed?.date ? new Date(parsed.date) : new Date(),
      accountId: 'acc-1',
      tags: parsed?.tags ?? [],
      notes: parsed?.notes || parsed?.counterparty || '',
    }

    await createTransaction.mutateAsync(transactionData)
  }

  async function createPendingEntry(parsed: SmartEntryType['pending']) {
    const description = parsed?.description?.trim() || input.trim()
    const amount = Math.abs(parsed?.amount ?? 0)
    if (!amount) {
      throw new Error('Não encontrei o valor da pendência.')
    }

    const dueDate = parsed?.dueDate ? new Date(parsed.dueDate) : addDays(new Date(), 7)

    const pendingData: PendingPaymentFormData = {
      description,
      amount,
      dueDate,
      recurrence: parsed?.recurrence || 'ONCE',
      priority: parsed?.priority || 'MEDIUM',
      categoryId: 'cat-utilities',
      accountId: 'acc-1',
      notes: parsed?.notes || parsed?.counterparty || '',
    }

    await createPending.mutateAsync(pendingData)
  }

  const isActionDisabled = useMemo(
    () => isProcessing || !input.trim(),
    [isProcessing, input],
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistente inteligente
          </DialogTitle>
          <DialogDescription>
            Descreva em linguagem natural o que aconteceu. Usamos o Gemini 2.0 Flash para entender e registrar automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ex.: Recebi 1.250 do Bruno ontem"
            rows={4}
            className="resize-none"
          />

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setInput(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Precisa preencher manualmente?</span>
            {onAddTransaction && (
              <Button
                variant="link"
                onClick={() => {
                  onOpenChange(false)
                  onAddTransaction()
                }}
                className="h-auto p-0 text-xs"
              >
                Abrir formulário de transação
              </Button>
            )}
            {onAddPending && (
              <Button
                variant="link"
                onClick={() => {
                  onOpenChange(false)
                  onAddPending()
                }}
                className="h-auto p-0 text-xs"
              >
                Abrir formulário de pendência
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleInterpretation} disabled={isActionDisabled}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Interpretando
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Registrar com IA
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

function inferTransactionType(provided: TransactionType | undefined, source: string): TransactionType {
  if (provided) {
    return provided
  }

  const text = source.toLowerCase()
  const expenseHints = [
    'paguei',
    'pagar',
    'pagamento',
    'pendência',
    'pendencia',
    'boleto',
    'cartão',
    'cartao',
    'fatura',
    'aluguel',
    'transferi',
    'transferência',
    'transferencia',
    'enviei',
    'debito',
    'débito',
  ]

  const isExpense = expenseHints.some((hint) => text.includes(hint))
  return isExpense ? 'EXPENSE' : 'INCOME'
}
