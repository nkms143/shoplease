# ShopLease Testing Checklist

## UI & Navigation
- [ ] Login page: Verify background illustration and govt emblem load.
- [ ] Login flow: Verify 'Authentication Login' button triggers validation.
- [ ] Navbar: Verify all dropdowns (Master Data, Transactions, Reports, GST, Communication) open on hover.
- [ ] Dashboard: Verify summary counts (Active Tenants, Total Shops) load.

## Core Modules (Console Verification)
Run these commands in the F12 console:

### Validators
```javascript
ValidatorsCore.validatePayment({paymentMethod: 'cash'}) 
// Expected: {isValid: false, error: "SUDA Receipt No. is required for cash payments."}
```

### GST
```javascript
GSTCore.calculateGST(100) 
// Expected: 18.00
```

### Notices
```javascript
NoticesCore.getEscalationInfo('01', [], {baseRent: 1000, gst: 180})
// Expected: {nextLevel: 1, currentStatus: "No Notice Sent", ...}
```

## Legacy Functionality (Regression)
- [ ] Rent Collection: Open 'Transactions > Rent Collection'. Does shop selection still work?
- [ ] DCB Report: Verify report generates without errors.
- [ ] Statement: Verify 'Shop Ledger' prints.
