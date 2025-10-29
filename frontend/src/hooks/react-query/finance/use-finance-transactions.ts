import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Transaction, TransactionFilters, TransactionFormData } from '@/lib/types/finance'
import { financeSummaryKeys } from './use-finance-summary'
import {
  fetchFinanceTransactions,
  createFinanceTransaction,
  updateFinanceTransaction,
  deleteFinanceTransaction,
} from './api'

// Query keys
export const transactionKeys = {
  all: ['finance', 'transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters?: TransactionFilters) =>
    [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

/**
 * Hook to fetch transactions with optional filtering
 */
export function useFinanceTransactions(filters?: TransactionFilters) {
  return useQuery<Transaction[]>({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchFinanceTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to create a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TransactionFormData) => createFinanceTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all })
    },
  })
}

/**
 * Hook to update an existing transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TransactionFormData> & { status?: string } }) =>
      updateFinanceTransaction(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all })
    },
  })
}

/**
 * Hook to delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactionId: string) => deleteFinanceTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all })
    },
  })
}
