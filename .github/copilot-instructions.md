# Copilot / AI Agent Instructions — ShopLease

Purpose: Make AI code assistants immediately productive in this repo by documenting architecture, developer workflows, and important editing caveats.

- **Big picture**: This is a single-page frontend app that stores data in `localStorage`. There are two co-existing code shapes:
  - A single-file, runtime-ready build where `index.html` loads `js/app.js` and `js/extra_modules.js`. Primary runtime logic (routing, `Store` object, and most modules) lives in `js/app.js`.
  - A modular ES-module refactor under `js/modules/` that imports a slimmer `js/store.js`. These modules are not wired from `index.html` by default.

- **Where to edit**: Pick the implementation you intend to change:
  - Quick fixes or UI work: edit `index.html`, `js/app.js`, and `js/extra_modules.js` (this is what runs when opening `index.html`).
  - Move toward modular code or add new features as modules: edit `js/modules/*` and `js/store.js`, then update `index.html` to load modules with `<script type="module">` and serve over HTTP.

- **Key files (examples)**:
  - [index.html](../index.html) — app shell and script includes
  - [js/app.js](../js/app.js) — single-file app: routing, `Store` object, `ShopModule`, `ApplicantModule`, `RentModule`, `PaymentReportModule`
  - [js/extra_modules.js](../js/extra_modules.js) — `SettingsModule`, `NoticeModule` and print/export helpers
  - [js/store.js](../js/store.js) — ES-module store (used by `js/modules/*`)
  - [js/modules/](../js/modules/) — modular implementations of applicant/rent/report views
  - [css/style.css](../css/style.css) — design tokens and UI variables

- **Data model & persistence**:
  - The runtime uses `localStorage` keys such as `suda_shop_applicants`, `suda_shop_payments`, `suda_shop_inventory`, `suda_shop_settings`, `suda_shop_remittances`, `suda_shop_history` (see `Store` in `js/app.js`).
  - Payment records use `paymentForMonth` in `YYYY-MM` format and a `timestamp` string as an identifier.
  - There is self-healing/backfill logic for shop IDs in `Store.getShops()` in `js/app.js` — prefer reusing that behavior when touching shop persistence.

- **Patterns & conventions to follow**:
  - UI composition uses template strings injected via `innerHTML` and then wired with event listeners. Follow the existing pattern (render -> setupLogic/setupFormLogic) when adding views.
  - Event delegation is used for table actions (listen on tbody/container and inspect `e.target.closest()` for action buttons).
  - Naming conventions: `btn-` for buttons, `group-` for form groups, `disp-` for read-only display inputs, and `chk-YYYY-MM` for month checkboxes.
  - Lease/rent history is represented as an array `leaseHistory` (or legacy `rentHistory`)—search `leaseHistory` in `js/app.js` to see lookup logic.

- **Behavioral caveats / gotchas** (explicitly observable in code):
  - There are two `Store` implementations. Do not change one without considering the other; decide whether you are working on the single-file app (`js/app.js`) or the module variant (`js/store.js`).
  - `index.html` currently runs the single-file variant. The modular files under `js/modules/` are not loaded automatically.
  - Many calculations are date-sensitive (due-day logic, penalty calculation). Example: `RentModule.calcPenalty` and `NoticeModule.calculateApplicantDues` implement slightly different penalty semantics — tests or manual checks are recommended when changing penalty code.
  - Payment deduplication exists (`Store.deduplicatePayments()` on app load). Payment uniqueness check uses `shopNo + paymentForMonth` in `Store.savePayment`.

- **Dev / run instructions (quick)**:
  - Easiest: open `index.html` in a browser for manual testing. For robust module debugging, run a local HTTP server and use the modular files.
  - Example commands (PowerShell):

```powershell
# Quick static server (Python)
python -m http.server 8000

# Or use a node static server if installed
npx http-server -p 8000

# Then open http://localhost:8000/index.html
```

- **When to prefer modular edits**:
  - If you want isolated unit-level edits (import/exports, smaller files), use `js/modules/*` and update `index.html` to load modules. Note: serving via `file://` may break module imports — use an HTTP server.

- **Testing & manual validation**:
  - Manual validation: exercise the main flows from the UI — Add Shop → New Applicant → Rent Collection → Report → Notices. Check `localStorage` keys in DevTools.
  - Searchable anchors in code: look for `paymentForMonth`, `leaseHistory`, `deduplicatePayments`, and `penaltyRate` while changing payment/penalty logic.

- **If you change storage shape**: Add a migration path in `Store.getShops()` / `getApplicants()` to backfill legacy properties (examples are present in `js/app.js`).

If any part of the above is unclear or you'd like me to prefer merging into a particular implementation (single-file vs modular), tell me which variant to target and I will adapt the instructions or refactor accordingly.
