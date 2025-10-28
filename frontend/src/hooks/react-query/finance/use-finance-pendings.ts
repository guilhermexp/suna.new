/**
 * React Query hooks for pending payments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PendingPayment, PendingPaymentFormData } from '@/lib/types/finance'
import { generateMockPendings } from '@/lib/utils/finance/mockData'
import { financeSummaryKeys } from './use-finance-summary'
import { transactionKeys } from './use-finance-transactions'

// Query keys
export const pendingKeys = {
  all: ['finance', 'pendings'] as const,
  lists: () => [...pendingKeys.all, 'list'] as const,
  list: (filters?: { status?: string }) => 
    [...pendingKeys.lists(), filters] as const,
  details: () => [...pendingKeys.all, 'detail'] as const,
  detail: (id: string) => [...pendingKeys.details(), id] as const,
}

/**
 * Hook to fetch pending payments
 */
export function useFinancePendings() {
  return useQuery<PendingPayment[]>({
    queryKey: pendingKeys.list(),
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      const pendings = generateMockPendings(6)
      
      // Update overdue status based on current date
      const now = new Date()
      return pendings.map(pending => {
        if (pending.status === 'PENDING' && pending.dueDate < now) {
          return { ...pending, status: 'OVERDUE' as const, priority: 'HIGH' as const }
        }
        return pending
      }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // Important for overdue updates
  })
}

/**
 * Hook to mark a pending payment as paid
 */
export function useMarkPendingPaid() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (pendingId: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      return pendingId
    },
    onMutate: async (pendingId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pendingKeys.lists() })
      
      // Snapshot previous value
      const previousPendings = queryClient.getQueryData<PendingPayment[]>(pendingKeys.list())
      
      // Optimistically update
      queryClient.setQueryData<PendingPayment[]>(pendingKeys.list(), (old) => {
        if (!old) return []
        return old.map(pending => 
          pending.id === pendingId 
            ? { ...pending, status: 'PAID' as const, updatedAt: new Date() }
            : pending
        )
      })
      
      return { previousPendings }
    },
    onError: (err, pendingId, context) => {
      // Rollback on error
      if (context?.previousPendings) {
        queryClient.setQueryData(pendingKeys.list(), context.previousPendings)
      }
    },
    onSuccess: () => {
      // Create a transaction record for the paid pending
      // This will be handled by the backend in the real implementation
      
      // Invalidate related queries
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
    mutationFn: async (data: PendingPaymentFormData) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const newPending: PendingPayment = {
        ...data,
        id: `pnd-${Date.now()}`,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      return newPending
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.lists() })
    },
  })
}

/**
 * Hook to update a pending payment
 */
export function useUpdatePending() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { id: string; updates: Partial<PendingPayment> }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400))
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.lists() })
    },
  })
}

/**
 * Hook to delete a pending payment
 */
export function useDeletePending() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (pendingId: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      return pendingId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.lists() })
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
