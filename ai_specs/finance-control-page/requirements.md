# Requirements: finance-control-page

## 1. Overview

**Goal**: Create a comprehensive Finance Control page within the existing Next.js dashboard that provides users with a unified view of their financial data including balance summary, transactions, pending payments, recurring subscriptions, and credit card management.

**User Problem**: Users currently lack a centralized interface to monitor and manage their personal finances, track spending patterns, manage recurring subscriptions, and oversee credit card usage within the application.

**Scope**: This feature focuses on the frontend presentation layer with mocked data initially, to be integrated with Supabase backend in subsequent phases.

## 2. Functional Requirements

### 2.1 Core Features

#### FR-1: Financial Summary Dashboard
**User Story**: As a user, I want to view my consolidated financial balance across different accounts, so that I can understand my current financial position at a glance.

**Acceptance Criteria**:
1. WHEN the user navigates to the finance control page THEN the system SHALL display a hero card showing total balance
2. WHEN the balance card is rendered THEN the system SHALL show tabs for different account types (Funding, Trading, etc.)
3. WHEN the user views the summary THEN the system SHALL display quick action buttons (Deposit, Withdraw)
4. WHEN balance data changes THEN the system SHALL show percentage variation with color coding (green for positive, red for negative)

#### FR-2: Transaction History
**User Story**: As a user, I want to view a chronological list of my income and expenses with filtering capabilities, so that I can track my financial activity over time.

**Acceptance Criteria**:
1. WHEN the user accesses the transactions section THEN the system SHALL display a paginated or scrollable list of all transactions
2. WHEN displaying transactions THEN the system SHALL show type (INCOME/EXPENSE), category, description, amount, date, and status
3. WHEN the user applies filters THEN the system SHALL update the list to show only matching transactions by period, type, or tags
4. WHEN a transaction row is clicked THEN the system SHALL open a detail view with complete transaction information

#### FR-3: Pending Payments Management
**User Story**: As a user, I want to track my upcoming bills and payments with due dates, so that I can avoid late fees and manage cash flow.

**Acceptance Criteria**:
1. WHEN the user views pending payments THEN the system SHALL display cards ordered by due date
2. WHEN a pending payment is displayed THEN the system SHALL show description, amount, due date, recurrence status, and priority level
3. WHEN the user marks a payment as completed THEN the system SHALL update the status and move it to transaction history
4. WHEN a payment is overdue THEN the system SHALL highlight it with visual priority indicators

#### FR-4: Subscription Calendar (MVP Exclusion - Phase 3)
**User Story**: As a user, I want to visualize my recurring subscriptions on a monthly calendar, so that I can anticipate upcoming charges and manage my subscriptions.

**Acceptance Criteria**:
1. WHEN the user views the subscriptions section THEN the system SHALL display a monthly calendar view
2. WHEN a subscription exists THEN the system SHALL show service icon, name, and amount on the corresponding day
3. WHEN the user clicks a subscription THEN the system SHALL open a modal with details and payment history
4. WHEN the user adds a new subscription THEN the system SHALL allow selection of service, amount, billing day, and optional icon

#### FR-5: Credit Card Management (MVP Exclusion - Phase 4)
**User Story**: As a user, I want to monitor my credit card limits, balances, and due dates, so that I can avoid overspending and missed payments.

**Acceptance Criteria**:
1. WHEN the user views credit cards THEN the system SHALL display card-style components with visual gradients
2. WHEN a credit card is shown THEN the system SHALL display nickname, brand, total limit, available limit, current balance, and due date
3. WHEN the card has usage THEN the system SHALL show a progress bar indicating limit utilization percentage
4. WHEN the user interacts with a card THEN the system SHALL provide actions to view statement or update card details

#### FR-6: Quick Actions
**User Story**: As a user, I want quick access to create new financial records, so that I can efficiently log transactions and manage my finances without navigation overhead.

**Acceptance Criteria**:
1. WHEN the user clicks a quick action button THEN the system SHALL open a modal dialog with the appropriate form
2. WHEN creating a transaction THEN the system SHALL require type, amount, category, and date fields
3. WHEN the user submits a form THEN the system SHALL validate inputs using Zod schema
4. WHEN a record is successfully created THEN the system SHALL invalidate relevant React Query caches and update the UI optimistically

### 2.2 Navigation and Layout

#### FR-7: Dashboard Integration
**User Story**: As a user, I want to access the finance control page from the main dashboard sidebar, so that I can easily navigate to my financial overview.

**Acceptance Criteria**:
1. WHEN the dashboard loads THEN the system SHALL display a finance control menu item in the sidebar
2. WHEN the user clicks the finance menu item THEN the system SHALL navigate to /finance-control route
3. WHEN on the finance page THEN the system SHALL highlight the corresponding sidebar item
4. WHEN the route changes THEN the system SHALL preserve scroll position on return navigation

#### FR-8: Responsive Layout
**User Story**: As a user on different devices, I want the finance page to adapt to my screen size, so that I can access my financial information on desktop, tablet, or mobile.

**Acceptance Criteria**:
1. WHEN viewed on desktop (>1024px) THEN the system SHALL display a 2-column grid layout
2. WHEN viewed on tablet (768px-1024px) THEN the system SHALL stack components with reduced spacing
3. WHEN viewed on mobile (<768px) THEN the system SHALL display single column layout with touch-optimized controls
4. WHEN resizing the viewport THEN the system SHALL smoothly transition between breakpoints

## 3. Technical Requirements

### 3.1 Performance

**TR-1**: Page initial load SHALL complete within 2 seconds on standard broadband connection
**TR-2**: Component render time for transaction list with 100 items SHALL be under 500ms
**TR-3**: React Query cache invalidation SHALL trigger optimistic UI updates within 100ms
**TR-4**: Skeleton loaders SHALL display immediately while data fetches (no blank screens)

### 3.2 Constraints

**TR-5**: Technology stack SHALL use Next.js 14+ App Router with TypeScript
**TR-6**: Styling SHALL use Tailwind CSS 4 with existing design tokens from globals.css
**TR-7**: UI components SHALL use shadcn/ui library (Card, Tabs, Button, Badge, DataTable, Dialog, Form, Progress, ScrollArea, DropdownMenu)
**TR-8**: State management SHALL use React Query for server state and local useState/context for UI state
**TR-9**: Data layer SHALL initially use TypeScript mocked data with structure compatible for Supabase migration

### 3.3 Data Structure

**TR-10**: Transaction type SHALL be defined as:
```typescript
type Transaction = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  date: Date;
  accountId: string;
  tags: string[];
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
}
```

**TR-11**: Pending payment type SHALL be defined as:
```typescript
type PendingPayment = {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  recurrence: 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'OVERDUE' | 'PAID';
  categoryId: string;
}
```

**TR-12**: Financial summary type SHALL be defined as:
```typescript
type FinancialSummary = {
  totalBalance: number;
  accounts: Array<{
    id: string;
    name: string;
    type: 'FUNDING' | 'TRADING' | 'SAVINGS';
    balance: number;
  }>;
  variation: {
    amount: number;
    percentage: number;
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  };
}
```

### 3.4 Hooks Architecture

**TR-13**: Finance hooks SHALL follow the pattern:
- `useFinanceSummary()`: Fetch and manage summary data
- `useFinanceTransactions(filters)`: Fetch and filter transactions
- `useFinancePendings(filters)`: Fetch and manage pending payments
- All hooks SHALL use React Query with appropriate cache keys and stale times

## 4. Acceptance Criteria

### Phase 1 - MVP (Resumo + Transações + Pendências)

**AC-1**: GIVEN the user is authenticated WHEN they navigate to /finance-control THEN they SHALL see the financial summary card, transaction list, and pending payments panel

**AC-2**: GIVEN mocked transaction data exists WHEN the transaction list renders THEN it SHALL display all transactions with correct formatting and styling matching the design system

**AC-3**: GIVEN the user clicks "Add Transaction" WHEN the modal opens THEN they SHALL be able to input transaction details and submit successfully with form validation

**AC-4**: GIVEN a pending payment has a due date today WHEN the pending panel renders THEN the payment SHALL be visually highlighted with appropriate urgency indicators

**AC-5**: GIVEN the user applies a date filter WHEN the filter is changed THEN the transaction list SHALL update to show only transactions within the selected period

**AC-6**: GIVEN the page loads with no data WHEN the empty state is displayed THEN the user SHALL see helpful messaging and call-to-action buttons

### Integration Tests

**AC-7**: Transaction creation flow SHALL complete end-to-end: open modal -> fill form -> validate -> submit -> see new transaction in list

**AC-8**: Pending payment completion flow SHALL work: mark as paid -> status updates -> item moves to transactions -> cache invalidates

**AC-9**: Filter persistence SHALL work: apply filters -> navigate away -> return to page -> filters SHALL be restored from URL parameters

## 5. Out of Scope

The following items are explicitly NOT included in the MVP phase:

**OS-1**: Subscription calendar visualization (deferred to Phase 3)
**OS-2**: Credit card management features (deferred to Phase 4)
**OS-3**: Data export functionality (CSV/PDF reports)
**OS-4**: Real-time collaboration or multi-user access
**OS-5**: Integration with external banking APIs or financial services
**OS-6**: Advanced analytics, charts, or spending insights dashboards
**OS-7**: Mobile native app implementation (responsive web only)
**OS-8**: Offline mode or service worker caching
**OS-9**: Custom themes or user-configurable styling beyond dark mode
**OS-10**: Automated bill payment or transaction execution
**OS-11**: Budget planning or forecasting features
**OS-12**: Integration with Supabase backend (Phase 2, after UI validation)
**OS-13**: Authentication or user management (uses existing dashboard auth)
**OS-14**: Notification system for upcoming payments or low balances

## 6. Dependencies

**DEP-1**: Existing dashboard layout with authenticated routing
**DEP-2**: shadcn/ui components must be installed and configured
**DEP-3**: React Query must be set up with proper QueryClientProvider
**DEP-4**: Tailwind CSS 4 with design tokens in globals.css
**DEP-5**: TypeScript configuration with strict mode enabled
**DEP-6**: Sidebar navigation component must support adding new menu items

## 7. Success Metrics

**SM-1**: User can view financial summary within 2 seconds of page load
**SM-2**: User can create a new transaction in under 30 seconds
**SM-3**: User can filter transactions and see results in under 1 second
**SM-4**: Page achieves 90+ Lighthouse performance score
**SM-5**: Zero critical accessibility violations detected by axe DevTools
**SM-6**: Component renders correctly across Chrome, Firefox, Safari, Edge (latest versions)