/**
 * React Query hooks for financial summary
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FinancialSummary } from '@/lib/types/finance'
import { fetchFinanceSummary } from './api'

// Query keys
export const financeSummaryKeys = {
  all: ['finance', 'summary'] as const,
  detail: () => [...financeSummaryKeys.all, 'detail'] as const,
}

/**
 * Hook to fetch financial summary
 * Returns aggregated balance across all accounts
 */
export function useFinanceSummary() {
  return useQuery<FinancialSummary>({
    queryKey: financeSummaryKeys.detail(),
    queryFn: () => fetchFinanceSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (cache time)
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to update account balance
 * Future: Will update specific account balance via API
 */
export function useUpdateBalance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { accountId: string; amount: number }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return data
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: financeSummaryKeys.detail() })
      
      // Snapshot previous value
      const previousSummary = queryClient.getQueryData<FinancialSummary>(financeSummaryKeys.detail())
      
      // Optimistically update to the new value
      if (previousSummary) {
        queryClient.setQueryData<FinancialSummary>(financeSummaryKeys.detail(), (old) => {
          if (!old) return old
          
          const updatedAccounts = old.accounts.map(account => 
            account.id === newData.accountId 
              ? { ...account, balance: account.balance + newData.amount }
              : account
          )
          
          const newTotalBalance = updatedAccounts.reduce((sum, acc) => sum + acc.balance, 0)
          
          return {
            ...old,
            totalBalance: newTotalBalance,
            accounts: updatedAccounts,
            lastUpdated: new Date(),
          }
        })
      }
      
      return { previousSummary }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousSummary) {
        queryClient.setQueryData(financeSummaryKeys.detail(), context.previousSummary)
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.detail() })
    },
  })
}

/**
 * Hook to refresh summary data
 * Useful for manual refresh after transactions
 */
export function useRefreshSummary() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: financeSummaryKeys.detail() })
  }
}
