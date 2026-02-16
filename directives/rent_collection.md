# Rent Collection Directive

## Goal
Record rent payments from tenants, calculate penalties for late payments, generate receipts, and sync data to cloud storage.

## Input
- Shop/Applicant selection
- Month(s) for which payment is being made
- Payment date
- Payment method (Cash, Cheque, NEFT, UPI, etc.)
- Optional: Manual penalty override

## Tools/Scripts to Use
- `js/core/payments.js` → `validatePayment()`, `calculatePaymentBreakdown()`, `recordPayment()`
- `js/core/penalties.js` → `calculatePenalty()` for automatic penalty calculation
- `RentModule.render()` in `app.js` → UI rendering
- `Store.savePaymentRecord()` → Cloud sync

## Workflow

### 1. Shop Selection
- Display dropdown list of all active shops
- Load shop details when selected:
  - Shop number
  - Applicant name
  - Base rent
  - GST amount (18%)
  - Total monthly rent

### 2. Month Selection
- Display checkboxes for unpaid months
- Allow multiple month selection
- Highlight overdue months
- Show due date for each month (typically 5th)

### 3. Automatic Penalty Calculation
When months or payment date changes:

```javascript
// Get selected months' due dates
// For each month, calculate penalty
const totalPenalty = months.reduce((sum, month) => {
    const dueDate = new Date(month.year, month.month - 1, paymentDay);
    const penalty = calculatePenalty(dueDate, paymentDate, rate, mode);
    return sum + penalty;
}, 0);
```

**Use directive**: `directives/penalty_calculation.md`

### 4. Manual Penalty Override
- Allow user to manually edit penalty amount
- Mark as "manually adjusted" for auditing
- Preserve manual value even if dates change
- Show calculated vs. manual amount difference

### 5. Payment Breakdown Display
Show clear breakdown:
- **Base Rent**: Sum of all selected months' base rent
- **GST (18%)**: Sum of all selected months' GST
- **Penalty**: Calculated or manual amount
- **Total Payable**: Base + GST + Penalty

### 6. Payment Method Selection
Capture payment details:
- **Method**: Dropdown (Cash, Cheque, NEFT, UPI, etc.)
- **Transaction ID**: For digital payments
- **Reference**: For tracking

### 7. Record Payment
On "Record Payment" button click:

```javascript
const payment = {
    id: generateUniqueId(),
    shopNo: selectedShop.shopNo,
    applicantName: selectedShop.applicantName,
    months: selectedMonths, // Array of YYYY-MM strings
    paymentDate: paymentDate,
    baseRent: totalBaseRent,
    gst: totalGST,
    penalty: penaltyAmount,
    total Total: totalBaseRent + totalGST + penaltyAmount,
    paymentMethod: selectedMethod,
    transactionId: transactionId,
    reference: reference,
    timestamp: new Date().toISOString(),
    recordedBy: currentUser.email
};

// Validate
validatePayment(payment);

// Save locally
Store.savePaymentRecord(payment);

// Sync to cloud
Store.syncToCloud();

// Generate receipt
generateReceipt(payment);
```

### 8. Receipt Generation
Auto-generate printable receipt with:
- Shop details
- Payment details
- Month-wise breakdown
- Total amount
- Payment method
- Date and time
- Authorized signature line

### 9. Confirmation & Reset
- Show success message
- Display receipt preview
- Clear form for next entry
- Update Dashboard automatically

## Validation Rules

1. **Shop Selection**: Required
2. **Month Selection**: At least one month required
3. **Payment Date**: Cannot be future date
4. **Penalty Amount**: Must be ≥ 0
5. **Total Amount**: Must be > 0
6. **Payment Method**: Required
7. **Transaction ID**: Required for digital payments

## Edge Cases

### Multiple Months with Different Rates
If penalty rates changed during the period:
- Calculate each month's penalty using its historical rate
- Sum all penalties
- Display breakdown if requested

### Partial Payment
Currently not supported. Payment must cover:
- All selected months' rent
- All selected months' GST
- All calculated penalties

Future enhancement: Allow partial payments with proper tracking.

### Late Payment on Due Date
- Payment on or before 5th → No penalty
- Payment on 6th or later → Penalty applies

### Waived Penalties
If waiver exists:
- Penalty shown as "Waived"
- Don't include in total
- Note waiver ID in payment record

## Cloud Sync

Payment records are synced to Supabase `payments` table:

```sql
INSERT INTO payments (
    shop_no, applicant_name, payment_date,
    months, base_rent, gst, penalty, total,
    payment_method, transaction_id, reference,
    recorded_by, created_at
) VALUES (...)
```

**Row Level Security**: Only authenticated users can insert/view.

## Integration Points

- **Dashboard**: Updates "Recent Payments" and "Outstanding Dues"
- **Shop Ledger**: Reflects in payment history
- **DCB Report**: Reduces arrears
- **Notice Module**: Stops escalation for paid months

## Expected Outputs

- Payment record saved locally and in cloud
- Receipt PDF/HTML generated
- Dashboard updated
- Success confirmation to user

## Common Pitfalls

1. ❌ Not recalculating penalty when payment date changes
2. ❌ Allowing future payment dates
3. ❌ Saving without cloud sync
4. ❌ Not validating required fields
5. ❌ Forgetting to clear form after successful payment

## Testing Checklist

- ✅ Select shop → Details load correctly
- ✅ Select months → Penalty auto-calculates
- ✅ Change payment date → Penalty updates
- ✅ Manual penalty override → Persists
- ✅ Record payment → Saves to DB
- ✅ Receipt generates correctly
- ✅ Dashboard reflects new payment
