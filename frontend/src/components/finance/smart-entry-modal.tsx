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
import { createClient } from '@/lib/supabase/client'
import {
  useCreatePending,
  useCreateTransaction,
  useCreateSubscription,
  useUpdateSubscription,
  useFinanceAccounts,
} from '@/hooks/react-query/finance'
import type {
  PendingPaymentFormData,
  Priority,
  Recurrence,
  TransactionFormData,
  TransactionType,
} from '@/lib/types/finance'

type SmartEntryType = {
  entryType: 'transaction' | 'pending' | 'subscription'
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
  subscription?: {
    action?: 'create' | 'pause' | 'cancel' | 'resume'
    serviceName?: string
    amount?: number
    currency?: string
    billingDay?: number
    category?: string
    status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
    notes?: string
    id?: string
  }
  raw?: string
}

interface SmartEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction?: () => void
  onAddPending?: () => void
  onAddSubscription?: () => void
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
  onAddSubscription,
}: SmartEntryModalProps) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const createTransaction = useCreateTransaction()
  const createPending = useCreatePending()
  const createSubscription = useCreateSubscription()
  const updateSubscription = useUpdateSubscription()
  const { data: accounts } = useFinanceAccounts()

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

    // Get authentication token
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      toast.error('Você precisa estar autenticado para usar o assistente.')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`${baseUrl}/finance/interpret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
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
      } else if (data.entryType === 'subscription' && data.subscription) {
        await handleSubscriptionInstruction(data.subscription)
      } else {
        throw new Error('Não consegui entender o tipo de registro.')
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
    const accountId = accounts?.[0]?.id
    if (!accountId) {
      throw new Error('Nenhuma conta financeira disponível para registrar transações.')
    }
    const description = parsed?.description?.trim() || input.trim()
    const amount = Math.abs(parsed?.amount ?? 0)
    if (!amount) {
      throw new Error('Não encontrei o valor da transação. Exemplo: "recebi 1250 do cliente Bruno ontem"')
    }

    const normalizedType = inferTransactionType(parsed?.type, input)

    const transactionData: TransactionFormData = {
      type: normalizedType,
      category: parsed?.category || 'General',
      description,
      amount,
      date: parsed?.date ? new Date(parsed.date) : new Date(),
      accountId,
      tags: parsed?.tags ?? [],
      notes: parsed?.notes || parsed?.counterparty || '',
    }

    await createTransaction.mutateAsync(transactionData)
  }

  async function createPendingEntry(parsed: SmartEntryType['pending']) {
    const accountId = accounts?.[0]?.id
    if (!accountId) {
      throw new Error('Nenhuma conta financeira disponível para registrar pendências.')
    }
    const description = parsed?.description?.trim() || input.trim()
    const amount = Math.abs(parsed?.amount ?? 0)
    if (!amount) {
      throw new Error('Não encontrei o valor da pendência. Exemplo: "pendência 3200 aluguel vence dia 10"')
    }

    const dueDate = parsed?.dueDate ? new Date(parsed.dueDate) : addDays(new Date(), 7)

    const pendingData: PendingPaymentFormData = {
      description,
      amount,
      dueDate,
      recurrence: parsed?.recurrence || 'ONCE',
      priority: parsed?.priority || 'MEDIUM',
      categoryId: 'cat-utilities',
      accountId,
      notes: parsed?.notes || parsed?.counterparty || '',
    }

    await createPending.mutateAsync(pendingData)
  }

  async function handleSubscriptionInstruction(parsed: SmartEntryType['subscription']) {
    const action = parsed?.action ?? 'create'

    if (action === 'create') {
      await createSubscriptionEntry(parsed)
      return
    }

    if (!parsed?.id) {
      throw new Error('Informe qual assinatura devemos atualizar ou cancelar.')
    }

    const statusMap: Record<string, 'ACTIVE' | 'PAUSED' | 'CANCELLED'> = {
      pause: 'PAUSED',
      resume: 'ACTIVE',
      cancel: 'CANCELLED',
      cancelation: 'CANCELLED',
    }

    const targetStatus = statusMap[action] ?? 'CANCELLED'

    await updateSubscription.mutateAsync({
      id: parsed.id,
      data: { status: targetStatus },
    })

    toast.success(
      targetStatus === 'PAUSED'
        ? 'Assinatura pausada com sucesso.'
        : targetStatus === 'ACTIVE'
          ? 'Assinatura reativada.'
          : 'Assinatura cancelada.',
    )
  }

  async function createSubscriptionEntry(parsed: SmartEntryType['subscription']) {
    const accountId = accounts?.[0]?.id
    if (!accountId) {
      throw new Error('Nenhuma conta financeira disponível para registrar assinaturas.')
    }
    const name = parsed?.serviceName?.trim() || input.trim()
    const amount = Math.abs(parsed?.amount ?? 0)

    if (!name) {
      throw new Error('Informe o nome do serviço da assinatura.')
    }

    if (!amount) {
      throw new Error('Não encontrei o valor da assinatura. Tente adicionar o valor, por exemplo: "pagamento escola 500 todo dia 30"')
    }

    await createSubscription.mutateAsync({
      serviceName: name,
      amount,
      currency: parsed?.currency || 'BRL',
      billingDay: parsed?.billingDay || new Date().getDate(),
      category: parsed?.category || 'other',
      status: 'ACTIVE',
      notes: parsed?.notes,
      accountId,
    })
  }

  const isActionDisabled = useMemo(
    () => isProcessing || !input.trim() || !accounts?.length,
    [isProcessing, input, accounts],
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
            {onAddSubscription && (
              <Button
                variant="link"
                onClick={() => {
                  onOpenChange(false)
                  onAddSubscription()
                }}
                className="h-auto p-0 text-xs"
              >
                Abrir formulário de assinatura
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
