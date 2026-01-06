# Deployment Task List

- [x] **Preparation**
  - [x] Check Git status and initialize if necessary <!-- id: 1 -->
  -# Task Checklist

## Phase 1: Mobile & UI (Completed)
- [x] **Mobile Responsiveness**
    - [x] Hamburger Menu Implementation
    - [x] Mobile Sidebar Logic
    - [x] Responsive Tables & Forms
- [x] **Client-Side Security**
    - [x] Login Screen Layout
    - [x] Basic Auth Logic (SessionStorage)
    - [x] Mobile Bug Fixes (Blur/Layering)

## Phase 2: Backend Migration (Supabase SQL) [CURRENT]
- [x] **Infrastructure Setup**
    - [x] Create Supabase Project
    - [x] Design SQL Schema (Table Definitions)
    - [x] Configure Row Level Security (RLS) Policies
- [x] **Frontend Integration**
    - [x] Install/Import Supabase JS Client
    - [x] Initialize Supabase in `app.js`
- [x] **Authentication Upgrade**
    - [x] Replace hardcoded Auth with Supabase Auth
    - [x] Implement Persistent Login
- [x] **Data Migration Support**
    - [x] Create "Upload to Cloud" script for existing LocalStorage data
- [x] **Code Refactoring (Cache-First Strategy)**
    - [x] Create `Store.initData()` to fetch all DB data on Logic Start
    - [x] Modify `Store.get...` to return cached data (Sync)
    - [x] Modify `Store.save...` to update Cache + Async DB Upsert
    - [x] Update `DOMContentLoaded` to await `Store.initData()`
    - [x] Test CRUD (Add Shop, Pay Rent) to ensure DB sync

## Phase 3: Stabilization & Debugging (Completed)
- [x] **Mobile Menu Overlay Fix** (CSS z-index)
- [x] **Data Integrity Fix**
    - [x] Fix field mapping in `app.js` (Rent, Expiry, Type)
    - [x] Create `repairData()` tool for retrieving missing fields from Legacy Storage
    - [x] Add GST Number support (`gst_no`)
- [x] **Receipt Number Fix**
    - [x] Remove long ISO timestamp from Receipt No (Use random 3-digit suffix)
- [x] **Delete Functionality Fix**
    - [x] Implement `deleteApplicant` to remove data and clear shop status (Fix Ghost Data)
    - [x] Fix `deleteShop` to properly delete from Cloud DB (Fix Reappearing Shops)
    - [x] Fix `deletePayment` to properly sync deletions (Fix Reappearing Transactions)
    - [x] Fix `ApplicantModule` buttons (Delete/Edit) not clicking (Missing Event Listener)
    - [x] Fix "04" vs 4 Deletion Bug (Implemented "Scorched Earth" UUID+Fallback delete)
    - [x] Restore "Renew/Terminate" buttons in Shop Inventory UI
    - [x] Fix DCB Report Mobile vs Desktop discrepancy (Normalized Timezone/Date Parsing)

## Phase 4: Production Hygiene (Next Steps)
- [ ] **Security Hardening**
    - [ ] Implement Row Level Security (RLS) policies in Supabase
- [ ] **Environment Management**
    - [ ] Move Secrets (URL/Key) to Environment Variables
