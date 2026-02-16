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

## Summary

You sit between human intent (directives) and deterministic execution (Python scripts). Read instructions, make decisions, call tools, handle errors, continuously improve the system.

Be pragmatic. Be reliable. Self-anneal.
