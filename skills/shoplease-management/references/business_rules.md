# Business Rules Reference

## Table of Contents
1. [Penalty Calculation](#penalty-calculation)
2. [Invoice vs Shop Ledger](#invoice-vs-shop-ledger)
3. [GST Rules](#gst-rules)
4. [Waiver Logic](#waiver-logic)
5. [Dues Calculation](#dues-calculation)
6. [DCB Engine](#dcb-engine-demand-collection-balance)
7. [Notice Escalation](#notice-escalation)

---

## Penalty Calculation

**Policy**: Any payment received after the due date incurs a **minimum 1 month penalty**. No grace period.

### Formula (MONTHLY mode — default)
```
monthsOverdue = Math.max(1, Math.ceil(diffDays / 30))
penalty = monthsOverdue × penaltyRate
```

### Formula (DAILY mode)
```
penalty = diffDays × dailyRate
```

### Parameters (from `settings` table)
| Parameter | Default | Notes |
|-----------|---------|-------|
| `penaltyRate` | ₹500/month | Monthly mode |
| `penaltyMode` | `"MONTHLY"` | Can be switched to `"DAILY"` |
| `paymentDay` | 5th of month | Due date day |

### Historical Rates
Penalty rates can change over time. `settings.penaltyHistory` contains `{effectiveDate, rate, mode}` entries. Use the core `window.PenaltiesCore` functions to handle this context — **never use the current rate for historical months without checking effective dates.**

### Uniform Application
The same penalty formula must be applied identically across:
- Dashboard outstanding dues
- Rent Collection module
- DCB Report (`arrearPenalty` column)
- Waiver Module
- Shop Ledger view

---

## Invoice vs Shop Ledger

These are **two different views** of financial data. Do not try to make them match.

| | Invoice | Shop Ledger |
|--|---------|-------------|
| **Type** | Frozen snapshot | Live real-time balance |
| **Generated** | 1st of each month | Any time |
| **Arrears shown** | As of previous month-end | As of today |
| **Current month** | Always included as a bill | Included only when due date has passed |
| **Purpose** | Billing statement (prospective) | Current account balance |

**Manual Dispatch**: Both invoices and late warnings require an administrator to trigger bulk emails via the dashboard. No automated cron jobs are currently active.

**Example**: A Feb 1st invoice shows ₹181,628 (arrears through Jan 31 + Feb bill). A Feb 16th ledger shows ₹180,128 (all dues as of today, with Feb now also overdue). Both are correct.

---

## GST Rules

- **Rate**: 18% on base rent (historically handled in settings)
- **Calculation**: Always use `window.GSTCore.calculateGST(baseAmount)` and `window.GSTCore.getApplicableRate()` to calculate applicable taxes.
- GST is included in every monthly payment and stored separately in `payments.gst`
- GST collected is **not remitted automatically** — it is tracked separately in the `remittances` table
- **Reconciliation**: Compare `SUM(payments.gst)` by month against `remittances.amount` for the same period to find shortfalls

---

## Waiver Logic

Waivers are stored in the `waivers` table, one record per shop per month.

- A waiver **eliminates the penalty** for that specific month — the waived month contributes ₹0 penalty to calculations
- Waivers apply to penalty only, not to base rent or GST (unless explicitly stated in waiver record)
- Check for waivers **before** calculating penalty: `waivers.some(w => w.shopNo === shopNo && w.month === monthStr)`
- Waivers can specify either `waiverAmount` (fixed ₹ amount) or `waiverPercentage` (% of penalty)
- Use `PenaltiesCore.applyWaiver(penalty, waiver)` for the calculation

---

## Dues Calculation

Outstanding dues for a shop are calculated using the 3-Layer Architecture.

**Local Calculation**: Handled by `Store.calculateOutstandingDues(app, refDate)` which orchestrates calls to `PenaltiesCore`, `GSTCore`, and `LedgerCore` for processing arrays of payments.

**Server-Side Aggregation**: Heavy ledger operations MUST use the Supabase RPC `get_shop_ledger_summary(p_shop_id)`. Do not pull all payment rows locally for bulk aggregations.

### Steps
1. Start from `applicant.allotmentDate` (default: `2022-01-01` if missing)
2. Build list of all months up to `asOfDate`
3. For each month, check `payments.months[]` to see if paid
4. Unpaid months > due date = outstanding
5. Calculate penalty per unpaid month using `PenaltiesCore.calculatePenalty()`
6. Check waivers and skip penalty for waived months

### Key Rule: Due Date
```
dueDate = new Date(year, month - 1, paymentDay)  // e.g., 5th of each month
```
A month is overdue if `today > dueDate`. A month whose due date is in the future is NOT yet overdue.

### Rule: First Month Occupancy
If a tenant occupies a shop **after** the monthly due date (e.g., joins on the 10th when due date is the 5th), the penalty for that first month starts only after the **following** month's due date. This prevents penalizing new tenants for administrative delay in the first partial month.

---

## DCB Engine (Demand, Collection, Balance)

The DCB report covers a **financial year** (April 1 → March 31).

| Column | Description |
|--------|-------------|
| **Opening Balance** | All dues outstanding before April 1 of the FY |
| **Current Demand** | 12 months × monthly rent (regardless of payment status) |
| **Total Demand** | Opening Balance + Current Demand |
| **Collection** | Sum of `payments.total` where `paymentDate` falls within the FY |
| **Balance** | Total Demand − Collection |
| **Arrear Penalty** | Penalty accrued on unpaid months from FY start to FY end |

Use `ReportsCore.generateDCBData()` — do not reimplement this logic.

---

## Notice Escalation

Notices are sent based on number of outstanding months and prior notice history.

| Notice Type | Trigger |
|-------------|---------|
| Informal | > 3 months outstanding, no prior notice |
| 1st Warning | > 3 months outstanding, informal notice sent > 30 days ago |
| Final Notice | > 6 months outstanding, 1st Warning sent > 30 days ago |

After sending, log to `notice_logs` table with `noticeType`, `sentDate`, and `duesAtTime`.
