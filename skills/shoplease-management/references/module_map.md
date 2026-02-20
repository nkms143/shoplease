# Module Map Reference

Quick-reference: which `js/core/` function to call for each workflow.

## Table of Contents
1. [Core Modules](#core-modules)
2. [Workflow Routing](#workflow-routing)
3. [Data Access via Store](#data-access-via-store)
4. [Loading Order](#loading-order)

---

## Core Modules

| Module | Global | File | Responsibility |
|--------|--------|------|----------------|
| `PenaltiesCore` | `window.PenaltiesCore` | `js/core/penalties.js` | Penalty formula calculations |
| `DuesCore` | `window.DuesCore` | `js/core/dues.js` | Outstanding dues, unpaid months |
| `PaymentsCore` | `window.PaymentsCore` | `js/core/payments.js` | Payment breakdown, receipt formatting |
| `ReportsCore` | `window.ReportsCore` | `js/core/reports.js` | DCB, ledger, defaulters list |

> All modules are loaded via `<script>` tags in `index.html` and exposed as `window.*` globals.

---

## Workflow Routing

### Calculate penalty for a single month
```js
PenaltiesCore.calculatePenalty(dueDate, paymentDate, rate, mode)
// Returns: number (₹ penalty)
```

### Get correct penalty rate for a historical month
```js
DuesCore.getPenaltyParams(settings, dueDate)
// Returns: {rate, mode}
// MUST use this — never hardcode the current rate for historical months
```

### Calculate all outstanding dues for a shop
```js
DuesCore.calculateOutstandingDues(applicant, payments, waivers, settings, asOfDate)
// Returns: {months[], monthsCount, totalBase, totalGST, totalRent, penalty, totalAmount}
```

### Apply waivers to calculated dues
```js
DuesCore.applyWaivers(dues, waivers)
// Returns: updated dues object with penalty reduced by waiver amounts
```

### Calculate payment breakdown before saving
```js
PaymentsCore.calculatePaymentBreakdown(months, applicant, manualPenalty, settings, paymentDate, waivers)
// Returns: {baseRent, gst, penalty, total, months[]}
// Pass manualPenalty=undefined for auto-calculation
```

### Create a payment record object
```js
PaymentsCore.createPaymentRecord(params)
// Returns: structured payment object ready for Store.savePayment()
```

### Format payment for receipt display
```js
PaymentsCore.formatReceiptData(payment, applicant)
// Returns: {receiptNo, shopNo, tenantName, months, baseRent, gst, penalty, total, totalInWords, ...}
```

### Generate DCB report data
```js
ReportsCore.generateDCBData(applicants, payments, waivers, settings, fyYear)
// fyYear: e.g., 2024 for FY 2024-25
// Returns: {financialYear, rows[], totals{}}
```

### Generate shop ledger
```js
ReportsCore.generateShopLedger(applicant, payments, settings)
// Returns: {transactions[], summary{totalDemand, totalPaid, balance}}
```

### Generate defaulters list
```js
ReportsCore.generateDefaultersList(applicants, payments, waivers, settings, asOfDate)
// Returns: [{shopNo, applicantName, monthsCount, totalDue, penalty, oldestMonth}]
// Sorted by totalDue descending; skips Terminated tenants
```

### Export DCB as CSV
```js
ReportsCore.formatAsCSV(dcbData)
// Returns: CSV string
```

---

## Data Access via Store

Never query Supabase directly from UI or core modules. Always use the `Store` cache layer:

```js
// Read (synchronous — from cache)
Store.getApplicants()       // → applicant[]
Store.getPayments()         // → payment[]
Store.getWaivers()          // → waiver[]
Store.getSettings()         // → settings object

// Write (updates cache + async Supabase upsert)
Store.savePayment(payment)
Store.saveApplicant(applicant)
Store.saveWaiver(waiver)
Store.deletePayment(id)
Store.deleteApplicant(id)

// Init (call once on DOMContentLoaded)
await Store.initData()
```

---

## Loading Order

Scripts must load in this order in `index.html`:

1. `js/core/penalties.js`
2. `js/core/dues.js` ← depends on PenaltiesCore
3. `js/core/payments.js` ← depends on DuesCore
4. `js/core/reports.js` ← depends on DuesCore + PenaltiesCore
5. `js/utils.js` (utilities)
6. `js/app.js` (UI + Store)
7. `js/extra_modules.js` (feature modules)
