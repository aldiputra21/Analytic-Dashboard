# GitHub Copilot Instructions — Corporate Finance Dashboard (CFD)

This file contains instructions specifically for GitHub Copilot to follow the "Spec-Driven Development" workflow used in this repository.

## 1. Requirements Context

### How to Read Active Requirements
Before starting any work, you MUST read:
1. `agents.md` — system summary & rules
2. The latest requirement in the `.requirements/` folder (sort by date)
3. Inside that folder, read:
   - `specs.md` — specifications
   - `blueprint.md` — system design
   - `tasks.md` — task list & status

### How to Create New Requirements
When there is a new requirement, create a folder in `.requirements/` with the format:
`.requirements/YYYYMMDD_${COUNTER}_NAME_OF_REQUIREMENT/`
Example: `.requirements/20260407_002_crm_enhancement/`

## 2. Task Execution Rules
1. **Update status** in `tasks.md` immediately after a task is completed with `[x]`.
2. Work on one task at a time.
3. Complete all sub-tasks before marking the parent task as finished.

## 3. Coding & UI Standards
**MANDATORY**: Follow all coding and UI standards defined in **`agents.md`**.
- Drizzle ORM conventions.
- Audit fields requirement.
- UUID strategy.
- CRUD template reference (`CorporateManager.tsx`).
- Use of `SearchableSelect` for dropdowns.
- **Reusable Hooks**: Always check for existing hooks before creating new dropdowns; create reusable hooks if none exist.
- **Multi-language (i18n)**: Never hardcode text; use `src/i18n/` files. **MANDATORY**: Check `commonsI18n` first; if a string is reusable, add it there instead of the module file.
- **Dropdown API Design**: No paging, display all active data, no `status` parameter required from frontend.
- **Error Handling & Resilience**: Standardized loading (PageSkeleton), localized error UI with Retry button, and Zod form validation with i18n messages.
