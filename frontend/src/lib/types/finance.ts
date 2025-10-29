/**
 * Finance-related TypeScript types
 * Defines core types for finance control page
 */

// Core Enums
export type TransactionType = 'INCOME' | 'EXPENSE'
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED'
export type AccountType = 'FUNDING' | 'TRADING' | 'SAVINGS' | 'CHECKING' | 'CREDIT' | 'CASH' | 'OTHER'
export type Recurrence = 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
export type PendingStatus = 'PENDING' | 'OVERDUE' | 'PAID'

// Financial Summary
export interface FinancialSummary {
  totalBalance: number
  currency: string
  cryptoEquivalent?: {
    symbol: string // e.g., "BTC"
    amount: number
    icon?: string
  }
  accounts: Account[]
  variation: {
    amount: number
    percentage: number
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  }
  lastUpdated: Date
}

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  color?: string // For gradient theming
}

// Transaction
export interface Transaction {
  id: string
  type: TransactionType
  category: string
  description: string
  amount: number
  date: Date
  accountId: string
  tags: string[]
  status: TransactionStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Pending Payment
export interface PendingPayment {
  id: string
  description: string
  amount: number
  currency: string
  dueDate: Date
  recurrence: Recurrence
  priority: Priority
  status: PendingStatus
  categoryId: string
  accountId: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Subscription (Phase 3)
export interface Subscription {
  id: string
  serviceName: string
  amount: number
  currency: string
  billingDay: number // 1-31
  icon?: string // URL or identifier for icon
  category: string
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  startDate: Date
  nextBilling?: Date
  accountId: string
  paymentHistory?: SubscriptionPayment[]
}

export interface SubscriptionPayment {
  id: string
  date: Date
  amount: number
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
}

// Credit Card (Phase 4)
export interface CreditCard {
  id: string
  nickname: string
  brand: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER'
  lastFour: string
  totalLimit: number
  availableLimit: number
  currentBalance: number
  dueDate: Date
  minimumPayment: number
  themeColor: string // Hex color for gradient
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED'
}

// Filter Types
export interface TransactionFilters {
  dateRange?: { start: Date; end: Date }
  type?: TransactionType | 'ALL'
  tags?: string[]
  category?: string
}

// Form Types
export interface TransactionFormData {
  type: TransactionType
  category: string
  description: string
  amount: number
  date: Date
  accountId: string
  tags: string[]
  notes?: string
}

export interface PendingPaymentFormData {
  description: string
  amount: number
  dueDate: Date
  recurrence: Recurrence
  priority: Priority
  categoryId: string
  accountId: string
  notes?: string
}

// Helper function to check if payment is overdue
export function isPaymentOverdue(payment: PendingPayment): boolean {
  return payment.status === 'OVERDUE' || (
    payment.status === 'PENDING' && 
    payment.dueDate < new Date()
  )
}

// Helper function to get days until due
export function getDaysUntilDue(dueDate: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Helper function to format currency
export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount)
}

// Helper function to get transaction sign
export function getTransactionSign(type: TransactionType): '+' | '-' {
  return type === 'INCOME' ? '+' : '-'
}

// Helper function to get status color
export function getStatusColor(status: TransactionStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-500'
    case 'PENDING':
      return 'text-yellow-500'
    case 'CANCELLED':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

// Helper function to get priority color
export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'HIGH':
      return 'border-red-500'
    case 'MEDIUM':
      return 'border-yellow-500'
    case 'LOW':
      return 'border-gray-500'
    default:
      return 'border-gray-500'
  }
}
