'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Subscription } from '@/lib/types/finance';
import {
  fetchFinanceSubscriptions,
  createFinanceSubscription,
  updateFinanceSubscription,
  deleteFinanceSubscription,
} from './api';
import { financeSummaryKeys } from './use-finance-summary';

const QUERY_KEY = 'subscriptions';

export function useSubscriptions() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchFinanceSubscriptions,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Subscription>) => createFinanceSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subscription> }) =>
      updateFinanceSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFinanceSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: financeSummaryKeys.all });
    },
  });
}
