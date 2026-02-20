---
name: shoplease-management
description: Domain-specific workflows for the SUDA Shop Lease Manager. Covers financial calculations (penalties, dues, DCB), GST reconciliation, invoice generation, shop ledger, lease lifecycle management, notice generation, and waiver processing. Use when working on any ShopLease feature or business logic task.
---

# ShopLease Management Skill

Specialized business logic for the SUDA Shop Lease Manager. Read the reference files listed below as needed — do not load all of them at once.

## Reference Files

- **[references/schema.md](references/schema.md)** — Supabase table schemas, field definitions, and data conventions. Read when: querying or writing to the DB, unsure of field names or types.
- **[references/business_rules.md](references/business_rules.md)** — Penalty formula, Invoice vs Ledger distinction, GST rules, waiver logic, DCB engine, notice escalation. Read when: implementing or debugging financial calculations.
- **[references/module_map.md](references/module_map.md)** — Which `js/core/` function to call for each workflow. Read when: implementing a feature and need to know the right core function to use.

## Directives

Business workflows are documented in `directives/`:

| Directive | When to Read |
|-----------|-------------|
| `directives/penalty_calculation.md` | Penalty policy, modes (MONTHLY/DAILY), historical rates |
| `directives/rent_collection.md` | Recording rent payments, receipt generation |
| `directives/dcb_report.md` | DCB report generation and columns |
| `directives/waiver_processing.md` | Granting and applying penalty waivers |
| `directives/notice_generation.md` | Defaulter identification and notice escalation |
| `directives/gst_reconciliation.md` | GST collected vs remitted reconciliation |
| `directives/shop_ledger.md` | Real-time shop balance statement |
| `directives/lease_management.md` | Renewal, termination, new applicant onboarding |
| `directives/invoice_generation.md` | Monthly invoice snapshot generation |

## Key Principles

1. **Check `js/core/` first** — `PenaltiesCore`, `DuesCore`, `PaymentsCore`, `ReportsCore` cover all financial calculations. Do not reimplement.
2. **All data via `Store`** — Never query Supabase directly. Use `Store.get*()` (sync, cached) and `Store.save*()` (async upsert).
3. **Shop IDs are strings** — Always normalize to zero-padded string: `String(shopNo).padStart(2, '0')`.
4. **Penalties are historical** — Use `DuesCore.getPenaltyParams(settings, dueDate)` for the rate that applied at the time, not today's rate.
5. **Invoice ≠ Ledger** — Do not try to reconcile them. See `references/business_rules.md`.
