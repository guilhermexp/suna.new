import { useMutation, useQuery } from '@tanstack/react-query';

interface CreditAdjustmentRequest {
  account_id: string;
  amount: number;
  reason: string;
  is_expiring: boolean;
  notify_user: boolean;
}

interface RefundRequest {
  account_id: string;
  amount: number;
  reason: string;
  is_expiring: boolean;
  stripe_refund: boolean;
  payment_intent_id?: string;
}

interface UserSearchRequest {
  email?: string;
  account_id?: string;
}

interface GrantCreditsRequest {
  account_ids: string[];
  amount: number;
  reason: string;
  is_expiring: boolean;
  notify_users: boolean;
}

export function useSearchUser() {
  return useMutation({
    mutationFn: async (request: UserSearchRequest) => ([]),
  });
}

export function useUserBillingSummary(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'billing', 'user', userId],
    queryFn: async () => (null),
    enabled: !!userId,
  });
}

export function useUserTransactions(userId: string | null, limit = 100, offset = 0, typeFilter?: string) {
  return useQuery({
    queryKey: ['admin', 'billing', 'transactions', userId, limit, offset, typeFilter],
    queryFn: async () => ([]),
    enabled: !!userId,
  });
}

export function useAdjustCredits() {
  return useMutation({
    mutationFn: async (request: CreditAdjustmentRequest) => ({ new_balance: 0 }),
  });
}

export function useProcessRefund() {
  return useMutation({
    mutationFn: async (request: RefundRequest) => ({ new_balance: 0 }),
  });
}

export function useGrantBulkCredits() {
  return useMutation({
    mutationFn: async (request: GrantCreditsRequest) => ({ success: true }),
  });
}

export function useMigrateUserToCredits() {
  return useMutation({
    mutationFn: async (userId: string) => ({ success: true }),
  });
}