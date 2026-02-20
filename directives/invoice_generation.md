# Invoice Generation Directive

## Purpose
Generate a monthly billing invoice for a shop. An invoice is a **frozen snapshot** — it captures arrears as of the previous month-end plus the current month's rent as a forward-looking bill.

## Core Rule: Invoice Snapshot Logic

> The invoice is NOT a real-time balance. It is a billing statement generated on the 1st of each month.

| What's shown | Cutoff date |
|-------------|-------------|
| Arrears (unpaid past months) | Previous month-end (e.g. Jan 31 for a Feb invoice) |
| Current month bill | Always included, even if not yet due |

This is intentionally different from the shop ledger. See `references/business_rules.md#invoice-vs-shop-ledger`.

## Workflow

### 1. Determine Invoice Period
```js
const invoiceDate = new Date(); // typically 1st of current month
const previousMonthEnd = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 0);
// e.g. Jan 31 when invoice is generated on Feb 1
```

### 2. Calculate Arrears (as of previous month-end)
```js
const dues = DuesCore.calculateOutstandingDues(
    applicant, payments, waivers, settings,
    previousMonthEnd  // ← key: use previous month-end, not today
);
// dues.totalAmount = arrears through previous month
```

### 3. Current Month Bill
```js
const baseRent = applicant.rentBase;
const gst = Math.round(baseRent * 0.18);
const currentMonthBill = baseRent + gst;
```

### 4. Invoice Total
```js
const invoiceTotal = dues.totalAmount + currentMonthBill;
```

### 5. Render Invoice
Required fields on the invoice:
- Invoice No (auto-generated: `INV-{YYYY-MM}-{shopNo}`)
- Invoice Date
- Shop No, Tenant Name, Address, GST No
- Arrears breakdown (months, base, GST, penalty)
- Current month bill (base + GST)
- **Grand Total**

### 6. PDF Generation
The invoice module is in `js/invoice_module.js`. It uses browser print/PDF:
```js
const invoiceModule = new InvoiceModule();
invoiceModule.generateInvoice(applicant, dues, currentMonthBill, invoiceDate);
```

## Edge Cases
- **February invoice**: `previousMonthEnd` = Jan 31, current month = February
- **April invoice** (start of financial year): arrears = all dues through March 31
- If tenant has zero arrears: show arrears section as ₹0, still show current month bill
- Terminated tenants: do not generate invoices; show outstanding dues via shop ledger instead
- If `expiryDate` has passed: still generate invoice if status is not `Terminated`

## Invoice Numbering
```
INV-{YYYY}-{MM}-{shopNo}
e.g. INV-2025-02-01
```
Invoice numbers are display-only — not stored in the DB.

## Related
- `DuesCore.calculateOutstandingDues()` — arrears calculation (use `previousMonthEnd` as `asOfDate`)
- `js/invoice_module.js` — PDF rendering logic
- `references/business_rules.md#invoice-vs-shop-ledger` — critical distinction
