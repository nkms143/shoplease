# Lease Management Directive

## Purpose
Handle the full lifecycle of shop leases: viewing active leases, identifying expiring leases, processing renewals, and terminating tenancies.

## Lease Status Definitions

| Status | Meaning |
|--------|---------|
| `Active` | Lease is current and valid |
| `Expiring` | `expiryDate` is within 90 days of today |
| `Terminated` | Lease ended; shop is vacant |

Status is computed on-the-fly — it is **not stored** in the DB. Compute it when rendering:
```js
const today = new Date();
const expiry = new Date(applicant.expiryDate);
const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

const status = daysLeft <= 0 ? 'Terminated'
             : daysLeft <= 90 ? 'Expiring'
             : 'Active';
```

## Workflows

### Identify Expiring Leases
1. Get all applicants via `Store.getApplicants()`
2. Filter where `daysLeft <= 90 && daysLeft > 0`
3. Display alert/badge in dashboard with count of expiring leases
4. Sort by `expiryDate` ascending in the expiring leases list

### Renew a Lease
1. User clicks **Renew** on an expiring/expired shop
2. Pre-fill renewal form:
   - `shopNo`: locked (read-only)
   - `applicantName`: pre-filled from current record
   - `allotmentDate`: new start date (typically day after current expiry)
   - `expiryDate`: new expiry date (typically 3 or 5 years forward)
   - `rentBase`: may be revised — verify with user
3. Optionally upload a new lease agreement file:
   ```js
   const url = await Store.uploadFile(file, `leases/${shopNo}_${Date.now()}.pdf`);
   applicant.leaseAgreementUrl = url;
   ```
4. Save via `Store.saveApplicant(updatedApplicant)`

### Terminate a Lease
1. User selects **Terminate** on an active shop
2. Warn: "This will mark the shop as Terminated. Any outstanding dues should be settled first."
3. Check for outstanding dues:
   ```js
   const dues = DuesCore.calculateOutstandingDues(applicant, payments, waivers, settings, new Date());
   if (dues.totalAmount > 0) {
       // warn user — do not block but inform
   }
   ```
4. Set `applicant.status = 'Terminated'` and save via `Store.saveApplicant()`
5. Terminated shops are excluded from defaulters list and DCB current demand — but their historical dues remain

### Add New Applicant
1. Required fields: `shopNo`, `applicantName`, `allotmentDate`, `expiryDate`, `rentBase`
2. Optional: `email`, `address`, `gst_no`, `leaseAgreementUrl`
3. Normalize `shopNo` to zero-padded string before saving
4. Save via `Store.saveApplicant(newApplicant)`

## Edge Cases
- If `expiryDate` is null/missing, treat as `Active` (do not classify as Expiring)
- Renewing a terminated lease: allowed — simply update `allotmentDate`, `expiryDate`, and clear `Terminated` status
- If `allotmentDate` > today when adding: dues start from `allotmentDate`, not today

## Related
- `Store.uploadFile()` for lease agreement uploads (`supabase_storage_setup.sql` configures the bucket)
- `DuesCore.calculateOutstandingDues()` for pre-termination dues check
- `references/schema.md#applicants` for full field list
