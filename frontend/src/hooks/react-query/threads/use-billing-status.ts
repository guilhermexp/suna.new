import { createQueryHook } from "@/hooks/use-query";
import { threadKeys } from "./keys";
// Billing removido: usar status permissivo local sem chamadas ao backend

export const useBillingStatusQuery = (enabled = true) =>
  createQueryHook(
    threadKeys.billingStatus,
    () => Promise.resolve({
      can_run: true,
      reason: 'billing disabled',
      tier: null,
      credits: { balance: Infinity, lifetime_used: 0, can_purchase: false },
    }),
    {
      enabled,
      retry: 1,
      staleTime: 1000 * 60 * 10, // 10 minutes - increased stale time
      gcTime: 1000 * 60 * 15, // 15 minutes cache time
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: (query: any) => {
        // Only refetch if billing is in a problematic state and at a slower rate
        if (query.state.data && !query.state.data.can_run) {
          return 1000 * 60 * 5; // 5 minutes instead of 1 minute
        }
        return false;
      },
    }
  )();
