# GST Reconciliation Directive

## Purpose
Ensure GST collected from rent payments is accurately matched against amounts remitted to the tax department. Identify shortfalls or excess payments on a monthly basis.

## Workflow

### 1. Load Data
```js
const payments = Store.getPayments();
const remittances = Store.getRemittances(); // from Supabase `remittances` table
const settings = Store.getSettings();
```

### 2. Aggregate GST Collected by Month
For each payment, extract the `gst` field and group by `YYYY-MM`:
```js
// Payment covers multiple months — distribute GST equally
const gstPerMonth = payment.gst / payment.months.length;
payment.months.forEach(monthStr => {
    collected[monthStr] = (collected[monthStr] || 0) + gstPerMonth;
});
```

### 3. Map Remittances by Period
Each remittance record has `month` (int 1–12) and `year` (int). Convert to `YYYY-MM` key:
```js
const key = `${remittance.year}-${String(remittance.month).padStart(2, '0')}`;
```

### 4. Calculate Reconciliation Status per Month
For each month in the financial year (April → March):

| Condition | Status |
|-----------|--------|
| `|collected - remitted| < 1` | ✅ Matched |
| `collected > remitted` | ⚠️ Shortfall |
| `remitted > collected` | ℹ️ Excess |

```js
const diff = collected - remitted;
const status = Math.abs(diff) < 1 ? 'Matched' : diff > 0 ? 'Shortfall' : 'Excess';
```

### 5. Display Dashboard
Show a table: Month | Collected | Remitted | Diff | Status

Color-code rows:
- Green = Matched
- Red = Shortfall
- Blue = Excess

### 6. Adding a Remittance Entry
Pre-fill the new remittance form with:
- Month/Year = selected month
- Suggested amount = `collected[selectedMonth]` (the GST collected for that month)

On save, insert to `remittances` table via `Store.saveRemittance()`.

## Edge Cases
- A month with zero payments has zero GST collected — show as `₹0` not blank
- A remittance may cover a month with no payments (advance remittance) — show as Excess
- Payments spanning multiple months: always distribute GST proportionally across covered months
- Financial year is April–March. Default display to current financial year

## Related
- See `references/business_rules.md#gst-rules` for rate and rounding rules
- Form-58 challan generation lives in `js/extra_modules.js` → `GstRemittanceModule`
