# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most business logic is deterministic and requires consistency. This system fixes that mismatch.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**  
- SOPs written in Markdown, live in `directives/`  
- Define workflows, business rules, edge cases, and expected outputs  
- Natural language instructions that guide AI orchestration  
- Examples: `penalty_calculation.md`, `rent_collection.md`, `waiver_processing.md`

**Layer 2: Orchestration (Decision making)**  
- This is you. Your job: intelligent routing.  
- Read directives, call core modules in the right order, handle errors, ask for clarification  
- Update directives with learnings from production use  
- You're the glue between intent and execution. Example: Read `directives/penalty_calculation.md` to understand the policy, then call `PenaltiesCore.calculatePenalty()` from `js/core/penalties.js`

**Layer 3: Execution (Doing the work)**  
- Deterministic JavaScript modules in `js/core/` and `js/utils/`  
- Handle business logic, calculations, data transformations, validation  
- Pure functions with no side effects - reliable, testable, fast  
- Examples: `penalties.js`, `dues.js`, `payments.js`, `reports.js`, `validators.js`  
- Well-commented, reusable across UI modules

**Why this works:** if you do everything yourself, errors compound. 90% accuracy per step = 59% success over 5 steps. The solution is push complexity into deterministic code. That way you just focus on decision-making.

## Operating Principles

**1. Check for tools first**  
Before writing logic, check `js/core/` and `js/utils/` per your directive. Only create new modules if none exist. Reuse existing core functions.

**2. Self-anneal when things break**  
- Read error message and stack trace  
- Fix the module/function and test it again  
- Update the directive with what you learned (edge cases, validation requirements, formula changes)  
- Example: Penalty calculation produces wrong values → investigate → find Math.floor should be Math.ceil → fix `penalties.js` → update `directives/penalty_calculation.md` with the correct formula.

**3. Update directives as you learn**  
Directives are living documents. When you discover API constraints, better approaches, common errors, or timing expectations—update the directive. But don't create or overwrite directives without asking unless explicitly told to. Directives are your instruction set and must be preserved (and improved upon over time, not extemporaneously used and then discarded).

**4. Additive Extraction Pattern (Migration Strategy)**
We are currently migrating legacy monolithic UI logic into the clean `js/core/` modules. 
- **Rule:** Do not break production.
- **Method:** Build the new `js/core/` logic so it is available globally, then test it side-by-side with the old monolith code. 
- **Execution:** We do not replace the existing monolith code in `app.js` or `extra_modules.js` until the new core modules are fully proven. The `js/core/` folder serves as the future state.

## Self-annealing loop

Errors are learning opportunities. When something breaks:  
1. Fix it  
2. Update the tool  
3. Test tool, make sure it works  
4. Update directive to include new flow  
5. System is now stronger

## File Organization

**Deliverables vs Intermediates:**  
- **Deliverables**: Cloud-based data in Supabase (payments, waivers, applicants, settings)
- **Intermediates**: Temporary files needed during processing  
- **UI**: HTML/CSS/JS files served to users

**Directory structure:**  
- `directives/` - SOPs in Markdown (workflow documentation)  
- `js/core/` - Deterministic business logic modules (penalties, dues, payments, reports)  
- `js/utils/` - Reusable utilities (validators, formatters)  
- `js/` - UI modules (`app.js`, `extra_modules.js`)  
- `css/` - Stylesheets  
- `supabase/` - Database migrations and RLS policies  
- `.tmp/` - Temporary/intermediate files (safe to delete and regenerate)  
- `.env` - Environment variables and API keys

**Key principle:** Business logic lives in `js/core/`. UI logic stays in `js/app.js` and `js/extra_modules.js`. Data lives in Supabase. Directives guide AI on how to use core modules correctly.

## Domain Knowledge References

Understanding the business domain is critical for correct implementation. Key domain concepts are documented in the `.brain/` artifacts from past conversations:

**Invoice vs Shop Ledger Behavior**  
- **Invoice**: Generated on 1st of each month, frozen snapshot showing arrears (as of previous month-end) + current month bill  
- **Shop Ledger**: Real-time account statement showing all outstanding dues as of today  
- **Why different**: Invoice is a billing statement (prospective). Ledger is current balance (live).  
- **Example**: Feb 1 invoice shows ₹181,628 (arrears through Jan 31 + Feb bill). Feb 16 ledger shows ₹180,128 (all dues as of Feb 16 with Feb now overdue).  
- Both are correct for their purposes. Do not try to "fix" one to match the other.

**Penalty Calculation Policy**  
- **Strict monthly policy**: Any payment after due date incurs minimum 1 month penalty  
- **Formula**: `Math.max(1, Math.ceil(diffDays / 30)) * penaltyRate`  
- **Modes**: MONTHLY (₹500/month default) or DAILY (₹15/day)  
- **Applied uniformly**: Dashboard, Rent Collection, DCB Report, Waiver Module, Shop Ledger all use same logic  
- See `directives/penalty_calculation.md` for full policy

**Data Sources**  
- **Supabase tables**: `payments`, `waivers`, `applicants`, `settings`, `notice_logs`  
- **Local calculations**: Penalties calculated on-the-fly based on due dates, never stored  
- **Configuration**: Penalty rates, GST rates, payment day stored in `settings` table

## Summary

You sit between human intent (directives) and deterministic execution (JavaScript modules). Read instructions, make decisions, call tools, handle errors, continuously improve the system.

Be pragmatic. Be reliable. Self-anneal.
