---
name: shoplease-management
description: Domain-specific workflows for the SUDA Shop Lease Manager. Covers financial calculations (DCB), tenant management, interest/penalty logic, and notice generation. Use when working on the ShopLease React migration or maintaining business logic.
---

# ShopLease Management Skill

This skill captures the specialized business logic of the SUDA Shop Lease Manager prototype.

## Core Domain Concepts

### 1. The DCB (Demand, Collection, Balance) Engine
Critical financial logic for tracking shop revenues.

- **Arrear Demand**: Balance outstanding before the current financial year.
- **Current Demand**: Rent due in the current financial year.
- **Penalty/Interest**: Calculated at 16% per annum (default) on overdue amounts.
- **Waivers**: Deductions applied to penalties or base rent based on specific orders.

### 2. Rent Calculation Logic
- **Due Date**: Typically the 10th of every month.
- **Penalty Trigger**: Applied if payment is made after the due date.
- **Opening Balance**: The starting point of any ledger, calculated by summing all historical demands minus historical collections up to a specific date.

## Specialized Workflows

### Notice Generation
1. **Scan Defaulters**: Identify tenants with >3 months outstanding.
2. **Escalation Info**: Determine the type of notice (Informal, 1st Warning, Final).
3. **Template Rendering**: Merge tenant data (Shop No, Owner, Dues) into the notice HTML.

### GST Reconciliation
- **Collected GST**: Extracted from monthly rent payments.
- **Remitted GST**: Records of actual tax payments made to the department.
- **Matching**: Identifying shortfalls or excess payments per month.

## Code Patterns

### Data Normalization
Always normalize shop IDs (e.g., `Shop 01` -> `01`) before querying to ensure consistency across the database.

### Financial Precision
All currency values should be handled with fixed precision (2 decimal places) to avoid floating-point discrepancies in reports.

## Reference Material
- See [legacy/js/extra_modules.js](file:///c:/SUDA_WORKS/D/amar/AI%20PROJECTS/SHOPLEASE/legacy/js/extra_modules.js) for the original implementation of `calculateDCBForApplicant`.
- See [legacy/js/invoice_module.js](file:///c:/SUDA_WORKS/D/amar/AI%20PROJECTS/SHOPLEASE/legacy/js/invoice_module.js) for PDF generation templates.
