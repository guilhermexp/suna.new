/**
 * Mock data generators for finance control page
 * Used for development and testing before Supabase integration
 */

import {
  Transaction,
  PendingPayment,
  FinancialSummary,
  Account,
  TransactionType,
  TransactionStatus,
  Recurrence,
  Priority,
  PendingStatus,
} from '@/lib/types/finance'

// Helper function to generate random number in range
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// Helper function to generate random integer in range
function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max))
}

// Helper function to pick random item from array
function randomItem<T>(array: T[]): T {
  return array[randomIntInRange(0, array.length)]
}

// Helper function to generate random date in the past
function randomPastDate(daysAgo: number): Date {
  const now = Date.now()
  const pastTime = now - randomInRange(0, daysAgo) * 24 * 60 * 60 * 1000
  return new Date(pastTime)
}

// Helper function to generate future date
function randomFutureDate(daysAhead: number): Date {
  const now = Date.now()
  const futureTime = now + randomInRange(0, daysAhead) * 24 * 60 * 60 * 1000
  return new Date(futureTime)
}

// Transaction categories by type
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Gift', 'Refund', 'Other Income']
const EXPENSE_CATEGORIES = ['Rent', 'Groceries', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Dining', 'Education', 'Insurance']

// Transaction descriptions by category
const TRANSACTION_DESCRIPTIONS: Record<string, string[]> = {
  'Salary': ['Monthly Salary Payment', 'Salary Deposit', 'Payroll'],
  'Freelance': ['Freelance Project Payment', 'Consulting Fee', 'Design Work Payment'],
  'Investment': ['Stock Dividend', 'Crypto Gain', 'Investment Return'],
  'Bonus': ['Performance Bonus', 'Year-End Bonus', 'Quarterly Bonus'],
  'Gift': ['Birthday Gift', 'Holiday Gift', 'Family Gift'],
  'Refund': ['Purchase Refund', 'Tax Refund', 'Insurance Refund'],
  'Rent': ['Monthly Rent Payment', 'Apartment Rent', 'House Rent'],
  'Groceries': ['Supermarket Shopping', 'Weekly Groceries', 'Food Shopping'],
  'Transport': ['Gas Station', 'Uber Ride', 'Metro Card', 'Car Maintenance'],
  'Entertainment': ['Movie Tickets', 'Concert', 'Streaming Service', 'Gaming'],
  'Utilities': ['Electricity Bill', 'Water Bill', 'Internet Bill', 'Phone Bill'],
  'Healthcare': ['Medical Appointment', 'Pharmacy', 'Health Insurance'],
  'Shopping': ['Clothing Purchase', 'Electronics', 'Home Supplies'],
  'Dining': ['Restaurant', 'Coffee Shop', 'Takeout', 'Food Delivery'],
  'Education': ['Course Fee', 'Book Purchase', 'Online Learning'],
  'Insurance': ['Car Insurance', 'Health Insurance', 'Life Insurance'],
}

// Tags for transactions
const TRANSACTION_TAGS = ['essential', 'discretionary', 'investment', 'recurring', 'one-time', 'tax-deductible']

// Pending payment descriptions
const PENDING_DESCRIPTIONS = [
  'Internet Bill',
  'Phone Bill',
  'Electricity',
  'Water Bill',
  'Car Insurance',
  'Health Insurance',
  'Netflix Subscription',
  'Spotify Premium',
  'Gym Membership',
  'Credit Card Payment',
  'Loan Payment',
  'Rent Payment',
]

/**
 * Generate mock financial summary
 */
export function generateMockSummary(): FinancialSummary {
  const fundingBalance = randomInRange(100000, 300000)
  const tradingBalance = randomInRange(200000, 400000)
  const savingsBalance = randomInRange(50000, 150000)
  const totalBalance = fundingBalance + tradingBalance + savingsBalance

  const accounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Funding',
      type: 'FUNDING',
      balance: fundingBalance,
      currency: 'USD',
      color: 'from-pink-400 to-pink-600',
    },
    {
      id: 'acc-2',
      name: 'Unified Trading',
      type: 'TRADING',
      balance: tradingBalance,
      currency: 'USD',
      color: 'from-purple-400 to-purple-600',
    },
    {
      id: 'acc-3',
      name: 'Savings',
      type: 'SAVINGS',
      balance: savingsBalance,
      currency: 'USD',
      color: 'from-blue-400 to-blue-600',
    },
  ]

  return {
    totalBalance: parseFloat(totalBalance.toFixed(2)),
    currency: 'USD',
    cryptoEquivalent: {
      symbol: 'BTC',
      amount: parseFloat((totalBalance / 57000).toFixed(6)), // Mock BTC price at $57,000
      icon: '₿',
    },
    accounts,
    variation: {
      amount: parseFloat(randomInRange(-5000, 5000).toFixed(2)),
      percentage: parseFloat(randomInRange(-5, 5).toFixed(2)),
      period: 'MONTHLY',
    },
    lastUpdated: new Date(),
  }
}

/**
 * Generate mock transactions
 */
export function generateMockTransactions(count: number = 20): Transaction[] {
  const transactions: Transaction[] = []
  const accountIds = ['acc-1', 'acc-2', 'acc-3']

  for (let i = 0; i < count; i++) {
    const type: TransactionType = randomItem(['INCOME', 'EXPENSE', 'EXPENSE']) // More expenses than income
    const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    const category = randomItem(categories)
    const descriptions = TRANSACTION_DESCRIPTIONS[category] || [`${category} Transaction`]
    const description = randomItem(descriptions)

    const amount = type === 'INCOME' 
      ? randomInRange(1000, 5000) 
      : randomInRange(10, 1000)

    const date = randomPastDate(30)
    const status: TransactionStatus = randomItem(['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING']) // Most completed

    const numTags = randomIntInRange(0, 3)
    const tags: string[] = []
    for (let j = 0; j < numTags; j++) {
      const tag = randomItem(TRANSACTION_TAGS)
      if (!tags.includes(tag)) {
        tags.push(tag)
      }
    }

    transactions.push({
      id: `txn-${i + 1}`,
      type,
      category,
      description,
      amount: parseFloat(amount.toFixed(2)),
      date,
      accountId: randomItem(accountIds),
      tags,
      status,
      notes: Math.random() > 0.8 ? 'Sample note for this transaction' : undefined,
      createdAt: date,
      updatedAt: date,
    })
  }

  // Sort by date descending (newest first)
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Generate mock pending payments
 */
export function generateMockPendings(count: number = 8): PendingPayment[] {
  const pendings: PendingPayment[] = []
  const categoryIds = ['cat-utilities', 'cat-insurance', 'cat-subscriptions', 'cat-loans']
  const accountIds = ['acc-1', 'acc-2', 'acc-3']

  for (let i = 0; i < count; i++) {
    // Generate due dates: some past (overdue), some future
    const daysOffset = randomIntInRange(-5, 30)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysOffset)
    dueDate.setHours(0, 0, 0, 0)

    const isPastDue = daysOffset < 0
    const status: PendingStatus = isPastDue ? 'OVERDUE' : 'PENDING'
    const priority: Priority = isPastDue 
      ? 'HIGH' 
      : daysOffset <= 7 
        ? 'MEDIUM' 
        : 'LOW'

    const description = randomItem(PENDING_DESCRIPTIONS)
    const amount = randomInRange(30, 500)
    const recurrence: Recurrence = randomItem(['MONTHLY', 'MONTHLY', 'YEARLY']) // Most monthly

    const createdDate = randomPastDate(60)

    pendings.push({
      id: `pnd-${i + 1}`,
      description,
      amount: parseFloat(amount.toFixed(2)),
      currency: 'USD',
      dueDate,
      recurrence,
      priority,
      status,
      categoryId: randomItem(categoryIds),
      accountId: randomItem(accountIds),
      notes: Math.random() > 0.7 ? 'Payment reminder note' : undefined,
      createdAt: createdDate,
      updatedAt: createdDate,
    })
  }

  // Sort by due date (nearest first)
  return pendings.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

/**
 * Validate mock data structure
 */
export function validateMockData() {
  try {
    const summary = generateMockSummary()
    const transactions = generateMockTransactions(5)
    const pendings = generateMockPendings(3)

    // Basic validation checks
    if (!summary.totalBalance || summary.accounts.length === 0) {
      throw new Error('Invalid summary data')
    }

    if (transactions.length === 0 || !transactions[0].id) {
      throw new Error('Invalid transactions data')
    }

    if (pendings.length === 0 || !pendings[0].id) {
      throw new Error('Invalid pendings data')
    }

    return { valid: true, summary, transactions, pendings }
  } catch (error) {
    console.error('Mock data validation failed:', error)
    return { valid: false, error }
  }
}
