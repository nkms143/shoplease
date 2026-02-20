# Shop Ledger Directive

## Purpose
Display a real-time account statement for a specific shop showing all outstanding dues as of today. Distinct from invoices — the ledger is live, not a billing snapshot.

## Core Rule: Ledger vs Invoice
The shop ledger is **always current**. It shows the actual balance owed right now.
An invoice is a **frozen snapshot** generated on the 1st of a month.

> ❌ Do NOT try to reconcile ledger totals with invoice totals — they will differ by design.
> See `references/business_rules.md#invoice-vs-shop-ledger` for full explanation.

## Workflow

### 1. Load Shop Data
```js
const applicant = Store.getApplicants().find(a => a.shopNo === shopNo);
const payments = Store.getPayments().filter(p => p.shopNo === shopNo);
const waivers = Store.getWaivers().filter(w => String(w.shopNo) === String(shopNo));
const settings = Store.getSettings();
```

### 2. Calculate Outstanding Dues (as of today)
```js
const dues = DuesCore.calculateOutstandingDues(
    applicant, payments, waivers, settings, new Date()
);
// dues.months[] = list of unpaid months
// dues.totalRent = base + GST total
// dues.penalty = total penalty
// dues.totalAmount = grand total
```

### 3. Generate Transaction History
```js
const ledger = ReportsCore.generateShopLedger(applicant, payments, settings);
// ledger.transactions[] = sorted payment records
// ledger.summary = {totalPaid, balance}
```

### 4. Display Format

**Header**: Shop No, Tenant Name, Base Rent, Monthly Total (incl. GST)

**Unpaid Months Table**:
| Month | Due Date | Base | GST | Penalty | Total |

**Payment History Table**:
| Date | Months Covered | Base | GST | Penalty | Total | Method | Reference |

**Summary Bar**: Total Outstanding | Penalty | Grand Total

### 5. Month Status Rules
- A month is unpaid if it does not appear in any `payment.months[]` array
- A month whose due date is **in the future** should be shown differently (upcoming, not overdue)
- A waived month shows ₹0 penalty — still show the month in ledger

## Edge Cases
- If `allotmentDate` is missing, default to `2022-01-01`
- Terminated shops: still show ledger if there are outstanding dues
- Partial payments: not supported — months are either fully paid or not

## Related
- `DuesCore.calculateOutstandingDues()` — core calculation
- `ReportsCore.generateShopLedger()` — transaction history
- See `references/module_map.md` for function signatures
