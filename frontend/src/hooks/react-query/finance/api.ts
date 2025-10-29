import { createClient } from '@/lib/supabase/client';
import {
  Account,
  FinancialSummary,
  PendingPayment,
  PendingPaymentFormData,
  Subscription,
  Transaction,
  TransactionFilters,
  TransactionFormData,
} from '@/lib/types/finance';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No authentication token available');
  }

  return session.access_token;
}

async function makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || response.statusText);
  }

  return response.json();
}

function parseDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value);
}

function transformTransaction(payload: any): Transaction {
  return {
    id: payload.id,
    type: payload.type,
    category: payload.category || 'General',
    description: payload.description || '',
    amount: Number(payload.amount ?? 0),
    date: parseDate(payload.date ?? payload.transaction_date),
    accountId: payload.financeAccountId || payload.accountId,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    status: payload.status || 'COMPLETED',
    notes: payload.notes ?? undefined,
    createdAt: parseDate(payload.createdAt ?? payload.created_at),
    updatedAt: parseDate(payload.updatedAt ?? payload.updated_at),
  };
}

function transformPending(payload: any): PendingPayment {
  return {
    id: payload.id,
    description: payload.description || '',
    amount: Number(payload.amount ?? 0),
    currency: payload.currency || 'BRL',
    dueDate: parseDate(payload.dueDate ?? payload.due_date),
    recurrence: payload.recurrence || 'ONCE',
    priority: payload.priority || 'MEDIUM',
    status: payload.status || 'PENDING',
    categoryId: payload.category || 'general',
    accountId: payload.financeAccountId || payload.accountId,
    notes: payload.notes ?? undefined,
    createdAt: parseDate(payload.createdAt ?? payload.created_at),
    updatedAt: parseDate(payload.updatedAt ?? payload.updated_at),
  };
}

function transformSubscription(payload: any): Subscription {
  const nextBillingRaw = payload.nextBilling ?? payload.next_billing;
  return {
    id: payload.id,
    serviceName: payload.serviceName || payload.service_name || '',
    amount: Number(payload.amount ?? 0),
    currency: payload.currency || 'BRL',
    billingDay: payload.billingDay ?? payload.billing_day ?? 1,
    icon: payload.icon ?? undefined,
    category: payload.category || 'general',
    status: payload.status || 'ACTIVE',
    startDate: parseDate(payload.startDate ?? payload.start_date),
    nextBilling: nextBillingRaw ? parseDate(nextBillingRaw) : undefined,
    accountId: payload.financeAccountId || payload.accountId,
    paymentHistory: payload.paymentHistory ?? [],
  };
}

function transformAccount(payload: any): Account {
  return {
    id: payload.id,
    name: payload.name || 'Conta',
    type: payload.account_type || 'OTHER',
    balance: payload.balance ?? payload.opening_balance ?? 0,
    currency: payload.currency || 'BRL',
    color: payload.color ?? undefined,
  };
}

function transformSummary(payload: any): FinancialSummary {
  const accounts = Array.isArray(payload.accounts)
    ? payload.accounts.map(transformAccount)
    : [];

  return {
    totalBalance: payload.totalBalance ?? payload.total_balance ?? 0,
    currency: payload.currency || 'BRL',
    accounts,
    variation: {
      amount: Number(payload.variation?.amount ?? 0),
      percentage: payload.variation?.percentage ?? 0,
      period: payload.variation?.period ?? 'MONTHLY',
    },
    cryptoEquivalent: payload.cryptoEquivalent
      ? {
          symbol: payload.cryptoEquivalent.symbol,
          amount: Number(payload.cryptoEquivalent.amount ?? 0),
          icon: payload.cryptoEquivalent.icon,
        }
      : undefined,
    lastUpdated: parseDate(payload.lastUpdated ?? payload.last_updated ?? new Date().toISOString()),
  };
}

// ---------------------------------------------------------------------------
// Summary & Accounts
// ---------------------------------------------------------------------------

export async function fetchFinanceSummary(accountId?: string): Promise<FinancialSummary> {
  const params = accountId ? `?accountId=${encodeURIComponent(accountId)}` : '';
  const payload = await makeRequest(`/finance/summary${params}`);
  return transformSummary(payload);
}

export async function fetchFinanceAccounts(accountId?: string): Promise<Account[]> {
  const params = accountId ? `?accountId=${encodeURIComponent(accountId)}` : '';
  const payload = await makeRequest(`/finance/accounts${params}`);
  return Array.isArray(payload) ? payload.map(transformAccount) : [];
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

function buildTransactionQuery(filters?: TransactionFilters): string {
  const searchParams = new URLSearchParams();

  if (filters?.type && filters.type !== 'ALL') {
    searchParams.append('type', filters.type);
  }

  if (filters?.dateRange?.start) {
    searchParams.append('startDate', filters.dateRange.start.toISOString());
  }

  if (filters?.dateRange?.end) {
    searchParams.append('endDate', filters.dateRange.end.toISOString());
  }

  if (filters?.category) {
    searchParams.append('category', filters.category);
  }

  if (filters?.tags && filters.tags.length > 0) {
    searchParams.append('tags', filters.tags.join(','));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function fetchFinanceTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const query = buildTransactionQuery(filters);
  const payload = await makeRequest(`/finance/transactions${query}`);
  return Array.isArray(payload) ? payload.map(transformTransaction) : [];
}

export async function createFinanceTransaction(data: TransactionFormData): Promise<Transaction> {
  if (!data.accountId) {
    throw new Error('Account is required for creating a transaction');
  }
  const body = {
    accountId: data.accountId,
    type: data.type,
    amount: data.amount,
    currency: 'BRL',
    description: data.description,
    category: data.category,
    date: data.date.toISOString().split('T')[0],
    tags: data.tags,
    notes: data.notes,
  };

  const payload = await makeRequest('/finance/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return transformTransaction(payload);
}

export async function updateFinanceTransaction(
  transactionId: string,
  updates: Partial<TransactionFormData> & { status?: string },
): Promise<Transaction> {
  const body: Record<string, unknown> = {};

  if (updates.description !== undefined) body.description = updates.description;
  if (updates.category !== undefined) body.category = updates.category;
  if (updates.amount !== undefined) body.amount = updates.amount;
  if (updates.notes !== undefined) body.notes = updates.notes;
  if (updates.date !== undefined) body.date = updates.date.toISOString().split('T')[0];
  if (updates.tags !== undefined) body.tags = updates.tags;
  if (updates.status !== undefined) body.status = updates.status;

  const payload = await makeRequest(`/finance/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  return transformTransaction(payload);
}

export async function deleteFinanceTransaction(transactionId: string): Promise<void> {
  await makeRequest(`/finance/transactions/${transactionId}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Pending Payments
// ---------------------------------------------------------------------------

export async function fetchFinancePendings(): Promise<PendingPayment[]> {
  const payload = await makeRequest('/finance/pendings');
  return Array.isArray(payload) ? payload.map(transformPending) : [];
}

export async function createFinancePending(data: PendingPaymentFormData): Promise<PendingPayment> {
  if (!data.accountId) {
    throw new Error('Account is required for creating a pending payment');
  }
  const body = {
    accountId: data.accountId,
    description: data.description,
    amount: data.amount,
    currency: 'BRL',
    dueDate: data.dueDate.toISOString().split('T')[0],
    recurrence: data.recurrence,
    priority: data.priority,
    status: 'PENDING',
    category: data.categoryId,
    notes: data.notes,
  };

  const payload = await makeRequest('/finance/pendings', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return transformPending(payload);
}

export async function updateFinancePending(
  pendingId: string,
  updates: Partial<PendingPaymentFormData> & { status?: string },
): Promise<PendingPayment> {
  const body: Record<string, unknown> = {};

  if (updates.description !== undefined) body.description = updates.description;
  if (updates.amount !== undefined) body.amount = updates.amount;
  if (updates.dueDate !== undefined) body.dueDate = updates.dueDate.toISOString().split('T')[0];
  if (updates.recurrence !== undefined) body.recurrence = updates.recurrence;
  if (updates.priority !== undefined) body.priority = updates.priority;
  if (updates.status !== undefined) body.status = updates.status;
  if (updates.categoryId !== undefined) body.category = updates.categoryId;
  if (updates.notes !== undefined) body.notes = updates.notes;

  const payload = await makeRequest(`/finance/pendings/${pendingId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  return transformPending(payload);
}

export async function markFinancePending(pendingId: string, status: 'PENDING' | 'OVERDUE' | 'PAID'): Promise<PendingPayment> {
  const payload = await makeRequest(`/finance/pendings/${pendingId}/mark`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });

  return transformPending(payload);
}

export async function deleteFinancePending(pendingId: string): Promise<void> {
  await makeRequest(`/finance/pendings/${pendingId}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export async function fetchFinanceSubscriptions(): Promise<Subscription[]> {
  const payload = await makeRequest('/finance/subscriptions');
  return Array.isArray(payload) ? payload.map(transformSubscription) : [];
}

export async function createFinanceSubscription(data: Partial<Subscription>): Promise<Subscription> {
  if (!data.accountId) {
    throw new Error('Account is required for creating a subscription');
  }
  const body = {
    accountId: data.accountId,
    serviceName: data.serviceName,
    amount: data.amount,
    currency: data.currency ?? 'BRL',
    billingDay: data.billingDay ?? 1,
    category: data.category,
    status: data.status ?? 'ACTIVE',
    startDate: (data.startDate ?? new Date()).toISOString().split('T')[0],
    nextBilling: data.nextBilling ? data.nextBilling.toISOString().split('T')[0] : undefined,
    notes: data.notes,
  };

  const payload = await makeRequest('/finance/subscriptions', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return transformSubscription(payload);
}

export async function updateFinanceSubscription(
  subscriptionId: string,
  updates: Partial<Subscription>,
): Promise<Subscription> {
  const body: Record<string, unknown> = {};

  if (updates.serviceName !== undefined) body.serviceName = updates.serviceName;
  if (updates.amount !== undefined) body.amount = updates.amount;
  if (updates.currency !== undefined) body.currency = updates.currency;
  if (updates.billingDay !== undefined) body.billingDay = updates.billingDay;
  if (updates.category !== undefined) body.category = updates.category;
  if (updates.status !== undefined) body.status = updates.status;
  if (updates.startDate !== undefined) body.startDate = updates.startDate.toISOString().split('T')[0];
  if (updates.nextBilling !== undefined) body.nextBilling = updates.nextBilling.toISOString().split('T')[0];
  if (updates.notes !== undefined) body.notes = updates.notes;

  const payload = await makeRequest(`/finance/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  return transformSubscription(payload);
}

export async function deleteFinanceSubscription(subscriptionId: string): Promise<void> {
  await makeRequest(`/finance/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
}
