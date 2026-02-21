# 🤖 AI Agent Reference: Shoplease

This guide is for future AI assistants working on this project. It highlights the core logic boundaries and critical functions to prevent duplication of effort and ensure compliance with the system "Engine."

**Production URL**: `https://nkms143.github.io/shoplease/`

## 📍 Key Code Locations

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Data Layer** | `js/app.js` (Store Object) | Centralized state, caching, and cloud sync logic. |
| **Business Logic** | `js/core/` | 3-Layer Architecture core logic (`penalties.js`, `gst.js`, etc.). |
| **Heavy Queries** | `Supabase RPCs` | Server-side calculations (`get_shop_ledger_summary`, `archive_financial_year`). |
| **Auth** | `js/app.js` (AuthModule) | Login, session, and password reset handling. |
| **Reporting** | `js/extra_modules.js` (ReportModule) | DCB, Monthly, and GST reporting logic. |
| **Notices** | `js/extra_modules.js` (NoticeModule) | Defaulter scanning and email notification logic. |
| **Config** | `js/config.js` | Supabase credentials (DO NOT COMMIT). |

## ⚙️ The "Dues Engine" Standard
When modifying or calculating dues, **DO NOT** rewrite the logic. 
- Use the 3-Layer Architecture modules in `js/core/` for localized pure functions.
- Use `Store.calculateOutstandingDues(app, referenceDate)` which delegates to the core modules.
- Use Supabase RPCs (like `get_shop_ledger_summary`) for heavy data aggregation.
This ensures logic is historical-aware, GST-rate-aware, and waiver-aware.

## 💾 State Management
- Data is cached in `Store.cache` (`shops`, `applicants`, `payments`, etc.).
- UI modules should read from `Store.getApplicants()`, `Store.getPayments()`, etc.
- Changes must be saved via `Store.saveApplicant(app)` or `Store.savePayment(pay)` to trigger cloud synchronization.

## 🛠️ Common Utility Functions
- `Store.normalizeID(id)`: Force standardizes shop IDs (e.g., "1" -> "01").
- `Store.idsMatch(id1, id2)`: Safe comparison for shop IDs regardless of padding.
- `Store.getFinancialYearFromDate(date)`: Returns format `2024-25`.
- `Store.logAction(type, entity, id, desc, metadata)`: Creates a standardized entry in `audit_logs`.

## ⚠️ Known Gotchas
- **Financial Year Boundary**: SUDA uses April-March. Counter logic for receipts resets on April 1st.
- **GST History**: GST rates changed historically. Check `Store.getSettings().gstHistory` before assuming a flat 18%.
- **LocalStorage Sync**: The app uses an "Optimistic UI" pattern. Cache is updated first, then cloud sync happens asynchronously.
