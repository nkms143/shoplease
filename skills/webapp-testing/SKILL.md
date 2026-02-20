---
name: webapp-testing
description: Workflows and scripts for validating the ShopLease application. Includes smoke tests and regression checklists.
---

# WebApp Testing Skill

Use this skill when you make changes to core logic or UI and need to verify that everything still works as expected.

## Workflows

### 1. Run Automated Smoke Test
Use the browser tool to verify basic application health.
1. Open the application URL.
2. Verify 'Official Username' and 'Security Token' fields are visible.
3. Login using valid credentials (if available) or verify the UI state transitions.
4. Check that 'Dashboard', 'Shop Management', and 'Rent Collection' navigation items are present.

### 2. Verify Core Logic (Console)
For testing deterministic functions in `js/core/`:
1. Open the browser console.
2. Run test cases against the core objects:
   - `ValidatorsCore.validatePayment({ ... })`
   - `GSTCore.calculateGST(100)`
   - `NoticesCore.getEscalationInfo(...)`

## References
- [testing_checklist.md](file:///c:/SUDA_WORKS/D/amar/AI%20PROJECTS/SHOPLEASE/skills/webapp-testing/references/testing_checklist.md)
- [smoke_test.js](file:///c:/SUDA_WORKS/D/amar/AI%20PROJECTS/SHOPLEASE/skills/webapp-testing/scripts/smoke_test.js)
