# Waiver Processing Directive

## Goal
Process penalty waiver requests for tenants, calculate suggested waiver amounts, record approvals, and apply waivers to dues calculations.

## Input
- Shop number
- Month(s) for waiver (YYYY-MM format)
- Waiver type (Full waiver, Partial waiver, One-time relief)
- Approval authority
- Justification/reason

## Tools/Scripts to Use
- `WaiverModule.calculateWaiverAmount()` in `extra_modules.js` → Estimate penalty
- `Store.saveWaiver()` → Record waiver
- `Store.getWaivers()` → Retrieve waivers for dues calculation

## Workflow

### 1. Waiver Request Initiation
Navigate to **Waivers** module and select:
- **Shop number** from dropdown
- **Month(s)** requiring waiver
- **Waiver type**:
  - Full Penalty Waiver (100%)
  - Partial Penalty Waiver (specify %)
  - One-time Relief

### 2. Penalty Estimation
Auto-calculate current penalty for selected month(s):

```javascript
const penaltyAmount = WaiverModule.calculateWaiverAmount(
    shopNo,
    month, // YYYY-MM string
    applicant
);
```

Display:
- **Current Penalty**: ₹X,XXX
- **Suggested Waiver**: 100% or specified %
- **Amount to Waive**: ₹X,XXX

**Note**: Use same penalty calculation logic as defined in `directives/penalty_calculation.md`.

### 3. Waiver Justification
Capture reason for waiver:
- Financial hardship
- Emergency/Unforeseen circumstances
- Long-term tenant goodwill
- Settlement agreement
- Administrative error
- Other (specify)

### 4. Approval Process
Record approval details:
- **Approved By**: Name/Email of authority
- **Approval Date**: Date of approval
- **Reference Number**: For tracking
- **Conditions**: Any terms attached to waiver

### 5. Waiver Record Creation
Create waiver object:

```javascript
const waiver = {
    id: generateUniqueId(),
    shopNo: shopNo,
    month: month, // 'YYYY-MM' format
    penaltyAmount: calculatedPenalty,
    waiverPercentage: 100, // or partial %
    waiverAmount: amountToWaive,
    reason: justification,
    approvedBy: approverEmail,
    approvalDate: new Date().toISOString(),
    referenceNo: referenceNumber,
    createdAt: new Date().toISOString(),
    status: 'Approved'
};

// Save locally
Store.saveWaiver(waiver);

// Sync to cloud
Store.syncToCloud();
```

### 6. Cloud Sync
Waiver records are synced to Supabase `waivers` table:

```sql
INSERT INTO waivers (
    shop_no, month, penalty_amount, waiver_amount,
    reason, approved_by, approval_date, reference_no,
    created_at
) VALUES (...)
```

**RLS**: Only authenticated users can insert/view waivers.

### 7. Automatic Application to Dues
Once waiver is recorded, it automatically applies to:

**Dashboard Dues Calculation**:
```javascript
// In Store.calculateOutstandingDues()
const allWaivers = Store.getWaivers();
const monthStr = '2024-01'; // Current month being processed
const hasWaiver = allWaivers.some(w => 
    String(w.shopNo) === String(shopNo) && w.month === monthStr
);

if (hasWaiver) {
    penalty = 0; // Override calculated penalty
}
```

**Rent Collection Module**:
- Show "Waived" instead of penalty amount
- Don't include in total payable

**DCB Report**:
- Reduce arrear demand by waived amount
- Note waiver in remarks column

## Waiver Types

### Full Penalty Waiver (100%)
- Entire penalty amount waived
- Tenant pays only base rent + GST
- Common for: Long-term relationships, emergencies

### Partial Penalty Waiver (X%)
- Specified percentage of penalty waived
- Example: 50% waiver on ₹1,000 penalty = ₹500 waived
- Common for: Negotiated settlements

### One-time Relief
- Single-month waiver
- Doesn't set precedent for future months
- Common for: Isolated incidents

## Validation Rules

1. **Shop Exists**: Must be valid shop number
2. **Month Format**: YYYY-MM (e.g., '2024-01')
3. **Penalty Exists**: Month must have outstanding penalty
4. **Waiver %**: Between 0-100%
5. **Approval Required**: Approver email must be valid
6. **Justification**: Required (min 10 characters)

## Edge Cases

### Waiver After Payment
If tenant already paid penalty:
- Waiver creates credit balance
- Can be applied to future months
- Or refunded to tenant

### Multiple Waivers for Same Month
Not allowed. Latest waiver overwrites previous:
- Check for existing waiver before saving
- Warn user if overwriting
- Log history of changes

### Retroactive Waivers
Allowed. Waiver can be applied to past months:
- Recalculates all historical dues
- Updates Dashboard and reports
- Generates credit if already paid

### Waiver Revocation
To revoke a waiver:
- Delete waiver record from DB
- Penalty automatically recalculates
- Notify tenant of change

## Reporting

### Waiver Summary Report
Generate monthly/yearly summary:
- Total waivers granted: Count
- Total amount waived: ₹X,XXX
- By shop: Breakdown per tenant
- By reason: Categorized summary

### Audit Trail
Maintain complete history:
- Who approved each waiver
- When it was approved
- Original penalty amount
- Waived amount
- Justification
- Any subsequent changes

## Integration Points

- **Dashboard**: Reduces "Outstanding Dues"
- **Rent Collection**: Shows "Waived" status
- **DCB Report**: Reduces arrear demand
- **Shop Ledger**: Reflects waiver in transaction history
- **Notice Module**: Prevents escalation for waived months

## Expected Outputs

- Waiver record saved locally and in cloud
- Dashboard dues updated immediately
- Confirmation message to user
- Audit log entry created

## Common Pitfalls

1. ❌ Not checking for existing waivers
2. ❌ Forgetting to sync to cloud
3. ❌ Not validating month format
4. ❌ Allowing waivers without approval
5. ❌ Not updating Dashboard after waiver

## Testing Checklist

- ✅ Create waiver → Saves successfully
- ✅ Dashboard updates → Penalty removed
- ✅ Rent Collection → Shows "Waived"
- ✅ DCB Report → Arrears reduced
- ✅ Duplicate waiver → Warning shown
- ✅ Cloud sync → Data in Supabase
