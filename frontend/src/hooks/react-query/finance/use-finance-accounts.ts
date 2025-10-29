import { useQuery } from '@tanstack/react-query'
import type { Account } from '@/lib/types/finance'
import { fetchFinanceAccounts } from './api'

export const financeAccountKeys = {
  all: ['finance', 'accounts'] as const,
}

export function useFinanceAccounts() {
  return useQuery<Account[]>({
    queryKey: financeAccountKeys.all,
    queryFn: () => fetchFinanceAccounts(),
    staleTime: 5 * 60 * 1000,
  })
}
