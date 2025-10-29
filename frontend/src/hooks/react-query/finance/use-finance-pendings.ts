/**
 * React Query hooks for pending payments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PendingPayment, PendingPaymentFormData } from '@/lib/types/finance'
import {
  fetchFinancePendings,
  createFinancePending,
  updateFinancePending,
  deleteFinancePending,
  markFinancePending,
} from './api'
import { financeSummaryKeys } from './use-finance-summary'
import { transactionKeys } from './use-finance-transactions'

// Query keys
export const pendingKeys = {
  all: ['finance', 'pendings'] as const,
  lists: () => [...pendingKeys.all, 'list'] as const,
  list: () => [...pendingKeys.lists()] as const,
  details: () => [...pendingKeys.all, 'detail'] as const,
  detail: (id: string) => [...pendingKeys.details(), id] as const,
}

/**
 * Hook to fetch pending payments
 */
export function useFinancePendings() {
  return useQuery<PendingPayment[]>({
    queryKey: pendingKeys.list(),
    queryFn: () => fetchFinancePendings(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to mark a pending payment as paid
 */
export function useMarkPendingPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pendingId: string) => markFinancePending(pendingId, 'PAID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all })
    },
  })
}

/**
 * Hook to create a new pending payment
 */
export function useCreatePending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PendingPaymentFormData) => createFinancePending(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all })
    },
  })
}

/**
 * Hook to update a pending payment
 */
export function useUpdatePending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PendingPaymentFormData> & { status?: string } }) =>
      updateFinancePending(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pendingKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all })
    },
  })
}

/**
 * Hook to delete a pending payment
 */
export function useDeletePending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pendingId: string) => deleteFinancePending(pendingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all })
    },
  })
}

/**
 * Hook to get overdue count
 */
export function useOverdueCount() {
  const { data: pendings } = useFinancePendings()
  return pendings?.filter(p => p.status === 'OVERDUE').length ?? 0
}
