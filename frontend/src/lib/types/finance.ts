// Finance Types

// Type aliases for string literal unions
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type Recurrence = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type PendingStatus = 'PENDING' | 'OVERDUE' | 'PAID';
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'CASH' | 'FUNDING' | 'TRADING' | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
}

export interface FinancialSummary {
  totalBalance: number;
  currency: string;
  accounts: Account[];
  variation: {
    amount: number;
    percentage: number;
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  };
  cryptoEquivalent?: {
    symbol: string;
    amount: number;
    icon?: string;
  };
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  description: string;
  amount: number;
  date: Date;
  accountId: string;
  tags: string[];
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionFormData {
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  description: string;
  amount: number;
  date: Date;
  accountId: string;
  tags: string[];
  notes?: string;
}

export interface TransactionFilters {
  type?: 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  category?: string;
  tags?: string[];
}

export interface PendingPayment {
  id: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  recurrence: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'OVERDUE' | 'PAID';
  categoryId: string;
  accountId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingPaymentFormData {
  description: string;
  amount: number;
  dueDate: Date;
  recurrence: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  categoryId: string;
  accountId: string;
  notes?: string;
}

export interface Subscription {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  billingDay: number;
  icon?: string;
  category: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: Date;
  nextBilling?: Date;
  accountId: string;
  paymentHistory: Array<{
    date: Date;
    amount: number;
    status: string;
  }>;
}
