# Finance Control Page - Testing Guide

**Quick reference for testing the Finance Control Page implementation**

---

## 🚀 Quick Start

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

### 2. Navigate to Page
Open browser: http://localhost:3000 (or your dev server port)
- Click on sidebar: **Finance Control** (DollarSign icon)
- URL should be: `/finance-control`

---

## ✅ Feature Testing Checklist

### Financial Summary Card

**Test Items**:
- [ ] Card displays with total balance
- [ ] Account tabs show: "All Accounts", "Funding", "Unified Trading", "Savings"
- [ ] Click each tab - balance updates
- [ ] Crypto equivalent displays (₿ 9.300554 BTC)
- [ ] Variation percentage shows with green/red color
- [ ] 4 action buttons: Deposit, Withdraw, Transfer, History
- [ ] Click Deposit button → Transaction modal opens
- [ ] Click Refresh icon → Data reloads
- [ ] Skeleton loader shows briefly on initial load

**Expected Data**:
- Total Balance: $350K-$850K range
- Funding: $100K-$300K
- Trading: $200K-$400K
- Savings: $50K-$150K
- Variation: -5% to +5%

---

### Transaction List

**Test Items**:
- [ ] List displays with multiple transactions
- [ ] Search box filters transactions
  - Type "Salary" → shows only salary transactions
  - Clear search → all transactions return
- [ ] Type filter dropdown works
  - Select "Income" → only green income transactions
  - Select "Expense" → only red expense transactions
  - Select "All Types" → all transactions
- [ ] Clear filters button appears when filters active
- [ ] Transaction rows show:
  - Green circle icon for INCOME
  - Red circle icon for EXPENSE
  - Description, category badge
  - Date, tags (if any)
  - Amount with +/- sign
  - Status badge (COMPLETED/PENDING)
- [ ] Click transaction row → console logs transaction (callback)
- [ ] Click "Add" button → Transaction modal opens
- [ ] Empty state shows when no transactions
- [ ] Skeleton loader shows on initial load

**Expected Behavior**:
- 50 mock transactions generated
- Sorted by date (newest first)
- Scroll area if list exceeds 600px

---

### Pending Payments Panel

**Test Items**:
- [ ] Panel displays pending payments
- [ ] Cards ordered by due date (nearest first)
- [ ] Overdue payments show:
  - Red border on left
  - "X days ago" text in red
  - Alert icon
  - Pulsing animation
- [ ] Upcoming payments show days until due
- [ ] Each card displays:
  - Description
  - Amount
  - Due date
  - Recurrence icon (if monthly/yearly)
  - Priority badge (HIGH/MEDIUM/LOW)
  - "Mark as Paid" button
- [ ] Click "Mark as Paid" →
  - Button shows "Marking..."
  - Toast notification appears
  - Card disappears from list
- [ ] Click card → console logs pending (callback)
- [ ] Click "Add" button → Pending Payment modal opens
- [ ] Empty state shows when all caught up
- [ ] Skeleton loader shows on initial load

**Expected Data**:
- 8-10 pending payments
- Mix of overdue and future dates
- Various priorities

---

### Quick Actions (Floating Button)

**Test Items**:
- [ ] Floating button visible in bottom-right corner
- [ ] Button has plus icon
- [ ] Click button → dropdown menu opens
- [ ] Menu shows 4 options:
  - Add Transaction
  - Add Pending Payment
  - Add Subscription (Soon)
  - Add Credit Card (Soon)
- [ ] Click "Add Transaction" → Transaction modal opens
- [ ] Click "Add Pending Payment" → Pending modal opens
- [ ] Subscript/Card options show "Soon" label
- [ ] Keyboard navigation works (Tab, Enter)

---

### Transaction Modal

**Test Items**:
- [ ] Modal opens with title "Add Transaction"
- [ ] All form fields present:
  - Transaction Type (dropdown): INCOME/EXPENSE
  - Category (dropdown): Changes based on type
  - Description (text input)
  - Amount (number input)
  - Date (date picker with calendar)
  - Account (dropdown): 3 accounts
  - Tags (tag input - optional)
  - Notes (textarea - optional)
- [ ] Change type to INCOME →
  - Categories: Salary, Freelance, Investment, Bonus, Gift, Refund
- [ ] Change type to EXPENSE →
  - Categories: Rent, Groceries, Transport, Entertainment, etc.
- [ ] Click date field → calendar picker opens
- [ ] Type in tags field → tags appear as chips
- [ ] Click submit with empty fields → validation errors show
- [ ] Fill all required fields → submit
  - Loading state: "Creating..." button disabled
  - Success toast: "Transaction created successfully"
  - Modal closes
  - Transaction appears in list immediately (optimistic)
- [ ] Click Cancel → Modal closes without saving
- [ ] Click outside modal → Modal closes (if enabled)

**Validation Testing**:
- [ ] Description required
- [ ] Amount must be positive number
- [ ] Amount max: $1,000,000
- [ ] Date required
- [ ] Date can't be future
- [ ] Category required
- [ ] Account required

---

### Pending Payment Modal

**Test Items**:
- [ ] Modal opens with title "Add Pending Payment"
- [ ] All form fields present:
  - Description (text input)
  - Amount (number input)
  - Due Date (date picker)
  - Recurrence (dropdown): ONCE, WEEKLY, MONTHLY, YEARLY
  - Priority (dropdown): LOW, MEDIUM, HIGH
  - Category (dropdown): Utilities, Insurance, etc.
  - Account (dropdown): 3 accounts
  - Notes (textarea - optional)
- [ ] Click due date → calendar opens (allows future dates)
- [ ] Select recurrence → value updates
- [ ] Select priority → value updates
- [ ] Categories show: Utilities, Insurance, Subscriptions, Loans, Rent, Other
- [ ] Click submit with empty fields → validation errors
- [ ] Fill all required fields → submit
  - Loading: "Adding..." button disabled
  - Success toast: "Pending payment added successfully"
  - Modal closes
  - Pending appears in panel
- [ ] Click Cancel → Modal closes

**Validation Testing**:
- [ ] Description required (1-200 chars)
- [ ] Amount positive, max $1M
- [ ] Due date required
- [ ] Recurrence required
- [ ] Priority required
- [ ] Category required
- [ ] Account required

---

## 📱 Responsive Design Testing

### Desktop (> 1024px)
- [ ] 2-column grid layout
- [ ] Transactions and Pendings side-by-side
- [ ] All features fully visible
- [ ] Spacing appropriate

### Tablet (768px - 1024px)
- [ ] Single column layout
- [ ] Components stack vertically
- [ ] Increased spacing
- [ ] Touch-friendly buttons

### Mobile (< 768px)
- [ ] Single column stacked
- [ ] Reduced padding
- [ ] Touch targets min 44px
- [ ] Modal covers full width
- [ ] Sidebar closes on navigation

**Test Steps**:
1. Open Chrome DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Test at: 375px (mobile), 768px (tablet), 1920px (desktop)

---

## 🎨 Visual Testing

### Colors & Theming

**Light Mode**:
- [ ] Card backgrounds white/light gray
- [ ] Text readable (dark on light)
- [ ] Income transactions green
- [ ] Expense transactions red
- [ ] Pending yellow/orange

**Dark Mode**:
- [ ] Toggle dark mode in settings
- [ ] Card backgrounds dark
- [ ] Text readable (light on dark)
- [ ] Income/Expense/Pending colors adjusted
- [ ] All components readable

### Animations
- [ ] Overdue payments pulse (red border)
- [ ] Skeleton loaders animate
- [ ] Hover states on buttons
- [ ] Toast notifications slide in
- [ ] Modal open/close smooth

---

## 🔄 Data Flow Testing

### Optimistic Updates

**Test Transaction Creation**:
1. Open Transaction modal
2. Fill form quickly
3. Submit
4. **Expected**: Transaction appears in list IMMEDIATELY
5. After ~400ms: Toast confirms success
6. Transaction stays in list (not removed)

**Test Mark Pending Paid**:
1. Find pending payment
2. Click "Mark as Paid"
3. **Expected**: Card disappears IMMEDIATELY
4. Button shows "Marking..."
5. After ~300ms: Toast confirms success
6. Card stays removed

### Cache Management

**Test Cache Invalidation**:
1. Note current total balance
2. Create new transaction (income $1000)
3. **Expected**: Balance doesn't update (mock data)
4. Refresh page → Balance regenerates (random)

**Test Refresh**:
1. Note transactions list
2. Click refresh icon in Summary card
3. **Expected**: Summary reloads (may change due to random generation)

---

## 🐛 Error Testing

### Network Errors (Simulated)

Since using mock data, these won't fail naturally. But components handle errors:

**What to test manually**:
- [ ] Error state in Summary card shows retry button
- [ ] Error state in Transaction list shows error message
- [ ] Error state in Pending panel shows error message
- [ ] Failed mutation shows error toast

---

## ⌨️ Keyboard Navigation Testing

### Tab Navigation
- [ ] Tab through all interactive elements
- [ ] Focus visible on all buttons/inputs
- [ ] Modal trap focus inside
- [ ] Escape closes modals

### Keyboard Shortcuts
- [ ] Enter submits forms
- [ ] Escape closes modals
- [ ] Arrow keys work in dropdowns/calendars

---

## 📊 Performance Testing

### Load Times
- [ ] Initial page load < 2 seconds
- [ ] Skeleton shows < 100ms
- [ ] Data appears < 1 second
- [ ] Modal opens instantly
- [ ] Form submissions < 500ms

### Large Data Sets

To test with more data:
1. Open `src/lib/utils/finance/mockData.ts`
2. Change `generateMockTransactions(50)` to `generateMockTransactions(500)`
3. Verify list still scrolls smoothly
4. Check if performance remains good

---

## 🔍 Console Checks

Open browser console (F12) and verify:
- [ ] No React errors
- [ ] No TypeScript errors
- [ ] No 404 errors
- [ ] Transaction clicks log to console
- [ ] Pending clicks log to console

---

## 📸 Screenshots to Capture

For documentation:
1. Full page view (desktop)
2. Summary card (both light/dark)
3. Transaction list with filters
4. Pending payments panel (with overdue)
5. Transaction modal open
6. Pending payment modal open
7. Mobile view (stacked)
8. Empty states
9. Loading states

---

## ✅ Sign-Off Checklist

Before marking complete:
- [ ] All features tested and working
- [ ] Responsive design verified
- [ ] Forms validate correctly
- [ ] Optimistic updates work
- [ ] Toast notifications appear
- [ ] No console errors
- [ ] Dark mode works
- [ ] Mobile navigation works
- [ ] Modals open/close properly
- [ ] Empty states display
- [ ] Loading states display
- [ ] Colors/styling correct
- [ ] Sidebar navigation works

---

## 🆘 Common Issues & Fixes

### Issue: Modal doesn't open
**Fix**: Check console for errors. Verify modal state hooks.

### Issue: Form validation not working
**Fix**: Check Zod schema. Verify react-hook-form setup.

### Issue: Data not displaying
**Fix**: Check hooks are called. Verify mock data generation.

### Issue: Sidebar item not highlighted
**Fix**: Verify pathname === '/finance-control'

### Issue: Styles not applied
**Fix**: Check Tailwind CSS classes. Verify globals.css loaded.

### Issue: Toast doesn't show
**Fix**: Verify sonner is imported in layout/providers

---

## 📞 Support

If issues persist:
1. Check browser console for errors
2. Verify all dependencies installed: `npm install`
3. Clear cache and restart: `npm run dev`
4. Check file paths are correct
5. Refer to implementation docs in `ai_specs/finance-control-page/`

---

**Last Updated**: 2025-10-28  
**Status**: Ready for Testing ✨
