# Payment Method Feature - Rent Collection Module

## Overview
The Rent Collection module has been extended to support multiple payment methods with conditional field validation. Users can now record payment details specific to the payment method used.

## Features Added

### 1. Payment Method Selection
A new dropdown has been added in the Payment Details form with three options:
- **Cash**
- **DD/Cheque** (Demand Draft or Cheque)
- **Online**

### 2. Conditional Fields Based on Payment Method

#### Cash Payment
- **Field**: SUDA Receipt No. (required)
- **Input**: Text field
- **Example**: RCP-2025-001
- **Used for**: Tracking cash receipts issued

#### DD/Cheque Payment
- **Fields**: 
  - DD/Cheque No. (required, text)
  - DD/Cheque Date (required, date field)
- **Examples**: 
  - Number: CHQ123456
  - Date: 2025-12-23
- **Used for**: Tracking instrument details and maturity dates

#### Online Payment
- **Field**: Online Transaction No. (required)
- **Input**: Text field
- **Example**: TXN20251223001
- **Used for**: Tracking digital transaction references

### 3. Form Validation
The payment collection form now validates:
- Payment method must be selected before recording payment
- Required fields for the selected payment method must be filled
- Error messages guide users if validation fails

### 4. Data Storage
Each payment record now includes:
```javascript
{
    shopNo: "04",
    rentAmount: "1000.00",
    gstAmount: "180.00",
    totalRent: "1180.00",
    paymentForMonth: "2025-12-01",
    paymentDate: "2025-12-23",
    penalty: "0.00",
    grandTotal: "1180.00",
    timestamp: "...",
    // New fields:
    paymentMethod: "cash" | "dd-cheque" | "online",
    receiptNo: "RCP-2025-001" (cash only),
    ddChequeNo: "CHQ123456" (dd-cheque only),
    ddChequeDate: "2025-12-23" (dd-cheque only),
    transactionNo: "TXN20251223001" (online only)
}
```

### 5. Payment Report Display
The Payment Report table now includes:
- **Payment Method Column**: Shows the method and specific details
  - Cash: Shows receipt number
  - DD/Cheque: Shows cheque/DD number and date
  - Online: Shows transaction number

### 6. CSV Export
When exporting payment records to Excel/CSV:
- **Payment Method** column: Cash, DD/Cheque, or Online
- **Payment Details** column: Specific reference number or details

## User Workflow

1. **Select Shop**: Choose an applicant/shop from the dropdown
2. **Select Months**: Check the months for which payment is being made
3. **Verify Amount**: Review the calculated rent, GST, and penalty
4. **Select Payment Method**: Choose Cash, DD/Cheque, or Online
5. **Fill Payment Details**: 
   - If Cash: Enter Receipt No.
   - If DD/Cheque: Enter Cheque/DD No. and Date
   - If Online: Enter Transaction No.
6. **Record Payment**: Click "Record Payment" button
7. **Confirmation**: Success message confirms payment recording

## Payment Report

The Payment Report tab now displays:
- All payment details in tabular format
- Payment method and specific reference info in the "Payment Method" column
- Ability to filter, print, and export with all details
- CSV export includes payment method information for external use

## Technical Implementation

### Files Modified
- `js/app.js` (RentModule and PaymentReportModule)
  - Added payment method dropdown UI
  - Added conditional field visibility logic
  - Added validation for payment method fields
  - Updated payment object structure
  - Updated renderReport to display payment method details
  - Updated CSV export format

### Key Functions
- `setupLogic()`: Handles payment method dropdown change events
- `btnCollect.addEventListener('click', ...)`: Validates payment method before saving
- `renderReport()`: Displays payment method details in table
- `exportReport()`: Includes payment method in CSV export

## Notes

- Payment method is **required** for all new payments
- Old payment records (without payment method) will display "-" in the Payment Method column
- The conditional fields automatically clear when switching payment methods to prevent data confusion
- All payment method details are stored in localStorage along with the payment record
- Export to Excel/CSV preserves all payment method information

## Future Enhancements (Optional)

- Add payment method filter to Payment Report
- Add reconciliation reports grouped by payment method
- Add payment method statistics dashboard
- Add bank/cheque clearing date tracking
- Add payment method-specific receipt templates

