/**
 * React Query hooks for transactions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Transaction, TransactionFilters, TransactionFormData } from '@/lib/types/finance'
import { generateMockTransactions } from '@/lib/utils/finance/mockData'
import { financeSummaryKeys } from './use-finance-summary'

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
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600))
      let transactions = generateMockTransactions(15)
      
      // Apply filters
      if (filters?.type && filters.type !== 'ALL') {
        transactions = transactions.filter(t => t.type === filters.type)
      }
      
      if (filters?.dateRange) {
        transactions = transactions.filter(t => 
          t.date >= filters.dateRange!.start && 
          t.date <= filters.dateRange!.end
        )
      }
      
      if (filters?.category) {
        transactions = transactions.filter(t => 
          t.category.toLowerCase().includes(filters.category!.toLowerCase())
        )
      }
      
      if (filters?.tags && filters.tags.length > 0) {
        transactions = transactions.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        )
      }
      
      // Sort by date descending (newest first)
      return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
    },
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
    mutationFn: async (data: TransactionFormData) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const newTransaction: Transaction = {
        ...data,
        id: `txn-${Date.now()}`,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      return newTransaction
    },
    onMutate: async (newTransaction) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: transactionKeys.lists() })
      
      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData(transactionKeys.lists())
      
      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: transactionKeys.lists() },
        (old: Transaction[] | undefined) => {
          if (!old) return []
          
          const tempTransaction: Transaction = {
            ...newTransaction,
            id: 'temp',
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          return [tempTransaction, ...old]
        }
      )
      
      return { previousTransactions }
    },
    onError: (err, newTransaction, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(transactionKeys.lists(), context.previousTransactions)
      }
    },
    onSettled: () => {
      // Refetch queries after error or success
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
    mutationFn: async (data: { id: string; updates: Partial<Transaction> }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400))
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
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
    mutationFn: async (transactionId: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      return transactionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all })
    },
  })
}
