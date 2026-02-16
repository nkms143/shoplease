# Penalty Calculation Directive

## Goal
Calculate penalty amounts for late rent payments using a strict policy where any payment after the due date incurs a minimum 1-month penalty.

## Input
- Shop/Applicant details
- Due date (typically 5th of each month)
- Payment date (or current date for outstanding calculations)
- Penalty rate history from Store

## Tools/Scripts to Use
- `js/core/penalties.js` → `calculatePenalty(dueDate, paymentDate, rate, mode)`
- `Store.getPenaltyParams(date)` → Retrieves historical penalty rate

## Strict Penalty Policy

### Business Rule
- Payment on or before due date → **₹0 penalty**
- Payment 1+ days after due date → **Minimum 1-month penalty**

### Formula
```javascript
if (penaltyMode === 'MONTHLY') {
    const months Overdue = Math.max(1, Math.ceil(diffDays / 30));
    penalty = monthsOverdue * penaltyRate;
} else if (penaltyMode === 'DAILY') {
    penalty = diffDays * penaltyRate;
}
```

### Key Points
1. **`Math.max(1, ...)`** - Ensures minimum 1-month penalty for any delay
2. **`Math.ceil(...)`** - Rounds up partial months (strict policy)
3. **Consistent everywhere** - Same formula in Dashboard, Rent Collection, DCB Report, Waiver Module

## Historical Rate Lookup

Penalty rates can change over time. Always use `Store.getPenaltyParams(dueDate)`:

```javascript
const penaltyParams = Store.getPenaltyParams(dueDate);
const penaltyRate = penaltyParams.rate; // e.g., 500
const penaltyMode = penaltyParams.mode; // 'MONTHLY' or 'DAILY'
```

**Default**: ₹500/month (effective from 2022-01-01)

## Edge Cases

| Scenario | Days Late | Calculation | Penalty @ ₹500/month |
|----------|-----------|-------------|----------------------|
| On time (5th) | 0 | N/A | ₹0 |
| 1 day late (6th) | 1 | max(1, ceil(1/30)) = 1 | ₹500 |
| 29 days late | 29 | max(1, ceil(29/30)) = 1 | ₹500 |
| 30 days late | 30 | max(1, ceil(30/30)) = 1 | ₹500 |
| 31 days late | 31 | max(1, ceil(31/30)) = 2 | ₹1,000 |
| 60 days late | 60 | max(1, ceil(60/30)) = 2 | ₹1,000 |
| 61 days late | 61 | max(1, ceil(61/30)) = 3 | ₹1,500 |

## Workflow

1. **Get due date** for the month being processed
2. **Get payment date** (or current date if unpaid)
3. **Check if overdue**: `paymentDate > dueDate`
4. **Calculate days difference**: `Math.ceil((paymentDate - dueDate) / (1000 * 60 * 60 * 24))`
5. **Retrieve historical rate**: `Store.getPenaltyParams(dueDate)`
6. **Apply formula**: Based on mode (MONTHLY or DAILY)
7. **Check for waivers**: If waiver exists for this shop+month, penalty = 0
8. **Return penalty amount**

## Waiver Override

Waivers take precedence over calculations:

```javascript
const allWaivers = Store.getWaivers() || [];
const monthStr = `${year}-${month}`; // YYYY-MM format
const hasWaiver = allWaivers.some(w => 
    String(w.shopNo) === String(shopNo) && w.month === monthStr
);

if (hasWaiver) {
    penalty = 0; // Waiver overrides calculated penalty
}
```

## Implementation Locations

All these locations must use the same logic:

1. **Dashboard**: `Store.calculateOutstandingDues()` in `app.js:1052`
2. **Rent Collection**: `RentModule.calcPenalty()` in `app.js:3841`
3. **DCB Report**: `ReportModule.printDCB()` in `extra_modules.js:3191`
4. **Waiver Module**: `WaiverModule.calculateWaiverAmount()` in `extra_modules.js:5414`

## Expected Outputs

- Penalty amount (number)
- Optionally: breakdown (months overdue, rate used, mode)

## Common Pitfalls

1. ❌ Using `Math floor()` instead of `Math.ceil()` - loses strict policy
2. ❌ Forgetting `Math.max(1, ...)` - allows zero penalty for 1-29 days
3. ❌ Using different formulas in different modules - causes discrepancies
4. ❌ Ignoring historical rates - incorrect for old periods
5. ❌ Not checking waivers - overstates actual dues

## Testing

Always verify:
- ✅ 1 day late = ₹500 penalty
- ✅ 29 days late = ₹500 penalty
- ✅ 31 days late = ₹1,000 penalty
- ✅ Waiver sets penalty to ₹0
- ✅ All modules show same amount
