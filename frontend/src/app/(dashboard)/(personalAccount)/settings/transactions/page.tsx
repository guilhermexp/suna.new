'use client';

import CreditTransactions from '@/components/billing/credit-transactions';
import TokenUsageHistory from '@/components/billing/token-usage-history';
import { isLocalMode } from '@/lib/config';

export default function TransactionsPage() {
  // In local mode (self-hosted), show token usage instead of billing transactions
  if (isLocalMode()) {
    return (
      <div className="space-y-6">
        <TokenUsageHistory />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreditTransactions />
    </div>
  );
}
