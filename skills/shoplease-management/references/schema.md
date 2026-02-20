# Supabase Schema Reference

## Table of Contents
1. [applicants](#applicants)
2. [payments](#payments)
3. [waivers](#waivers)
4. [settings](#settings)
5. [notice_logs](#notice_logs)
6. [remittances](#remittances)
7. [Key Conventions](#key-conventions)

---

## applicants

Primary table for shop tenants and lease details.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `shopNo` | text | e.g. `"01"`, `"02"` — always zero-padded string |
| `applicantName` | text | Tenant's full name |
| `email` | text | Contact email |
| `address` | text | Address |
| `rentBase` | numeric | Monthly base rent (excluding GST) |
| `allotmentDate` | date | Lease start date — used as dues calculation start |
| `expiryDate` | date | Lease expiry date |
| `status` | text | `"Active"` \| `"Terminated"` \| `"Expiring"` |
| `shopType` | text | e.g. `"Commercial"` |
| `gst_no` | text | Tenant's GST number |
| `leaseAgreementUrl` | text | Supabase Storage URL for uploaded lease agreement |
| `createdAt` | timestamptz | Auto-set on insert |

---

## payments

All rent payment transactions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text | Format: `PAY-{timestamp}-{random}` |
| `shopNo` | text | FK to `applicants.shopNo` (string-matched) |
| `applicantName` | text | Denormalized for quick display |
| `months` | jsonb | Array of `"YYYY-MM"` strings covered by this payment |
| `paymentDate` | timestamptz | Actual date of payment |
| `baseRent` | numeric | Base rent component of payment |
| `gst` | numeric | GST component (18% of base) |
| `penalty` | numeric | Penalty paid |
| `total` | numeric | `baseRent + gst + penalty` |
| `paymentMethod` | text | `"Cash"` \| `"NEFT"` \| `"Cheque"` \| `"UPI"` |
| `transactionId` | text | Bank/UPI reference number |
| `reference` | text | Cheque number or internal reference |
| `recordedBy` | text | Username who recorded the payment |
| `createdAt` | timestamptz | Auto-set on insert |

---

## waivers

Penalty waivers granted per shop per month.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `shopNo` | text | FK to `applicants.shopNo` |
| `month` | text | Format: `"YYYY-MM"` |
| `waiverAmount` | numeric | Fixed amount waived (₹) |
| `waiverPercentage` | numeric | Percentage waived (alternative to amount) |
| `reason` | text | Justification for waiver |
| `approvedBy` | text | Approving authority |
| `createdAt` | timestamptz | Auto-set on insert |

---

## settings

Single-row configuration table (always `id = 'default'`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | text | Always `"default"` — single row |
| `paymentDay` | integer | Day of month rent is due (typically `5` or `10`) |
| `penaltyRate` | numeric | Default penalty rate (e.g. `500` for ₹500/month) |
| `penaltyMode` | text | `"MONTHLY"` \| `"DAILY"` |
| `gstRate` | numeric | GST rate as decimal (e.g. `0.18` for 18%) |
| `penaltyHistory` | jsonb | Array of `{effectiveDate, rate, mode}` for historical rates |

**Reading settings:** Always call `Store.getSettings()` — never hardcode rates.

---

## notice_logs

Tracks notices sent to defaulting tenants.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `shopNo` | text | FK to `applicants.shopNo` |
| `noticeType` | text | `"Informal"` \| `"1st Warning"` \| `"Final"` |
| `sentDate` | date | Date notice was sent |
| `sentBy` | text | Username who sent it |
| `duesAtTime` | numeric | Total dues outstanding when notice was sent |
| `createdAt` | timestamptz | Auto-set on insert |

---

## remittances

GST remittance records (payments to tax department).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `month` | integer | Month number (1–12) |
| `year` | integer | Calendar year |
| `amount` | numeric | Amount remitted to department |
| `challanNo` | text | Challan/reference number |
| `remittedDate` | date | Date of remittance |
| `createdAt` | timestamptz | Auto-set on insert |

---

## Key Conventions

### Shop ID Normalization
Always normalize `shopNo` to a zero-padded string **before** any comparison:
```js
// ✅ Correct
String(shopNo).padStart(2, '0')  // "1" → "01"

// ❌ Wrong — will miss matches
shopNo === 1
```

### Month String Format
All month references use `"YYYY-MM"` format (e.g. `"2024-04"` for April 2024).

### GST Calculation
```js
const gst = Math.round(baseRent * 0.18); // Always Math.round, not floor/ceil
```

### Financial Precision
All currency displays use exactly 2 decimal places. Use `.toFixed(2)` or `toLocaleString('en-IN')` for output. Never store computed values — always recalculate from source data.

### RLS Policies
All tables have Row Level Security enabled. Users must be authenticated via Supabase Auth. See `supabase/` directory for migration files and `supabase_rls_fix.sql` for performance optimizations.
