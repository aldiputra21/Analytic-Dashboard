# Database Architecture — Corporate Finance Dashboard (CFD)

This document provides a detailed overview of the database structure, schemas, and key files used in the project.

**Database:** PostgreSQL (hosted on Neon) with Drizzle ORM

## Schemas (3)

### 1. `public`
Core tables for authentication, authorization, and system-wide settings.
- `roles`, `permissions`, `role_permissions`
- `users` (including `authz_version`, reset token fields)
- `corporates`, `departments`, `projects`
- `user_corporate_accesses` (multi-corporate access mapping)
- `notifications`, `audit_logs`, `system_configs`
- `approval_workflows`, `approval_workflow_steps`, `approvals`, `approval_histories`

### 2. `cfd`
Financial data for the Corporate Finance Dashboard and Financial Ratio System (FRS).
- `thresholds`, `alerts`
- `balance_sheets`, `income_statements`, `cash_flow_statements`
- `target_headers`, `target_details`
- `weekly_cash_flows`

### 3. `crm`
Tables for the Customer Relationship Management module.
- `customers`, `contacts`, `interactions`
- `opportunities`, `opportunity_value_history`, `stage_transitions`
- `competitors`, `qualifications`
- `proposals`, `proposal_documents`, `proposal_versions`, `cost_estimations`
- `contracts`, `contract_documents`
- `sales_targets`

## Key Files

- `src/db/connection.ts` — Database connection via `drizzle-orm/node-postgres`
- `src/db/schema/public.ts` — Public schema definitions
- `src/db/schema/cfd.ts` — CFD schema definitions
- `src/db/schema/crm.ts` — CRM schema definitions
- `src/db/schema/index.ts` — Re-exports all schemas
- `drizzle.config.ts` — Drizzle Kit configuration

## Seed Scripts (Latest in `scripts/`)
Gunakan script di folder `scripts/` untuk mengisi data database:

- `scripts/seed-public.ts` — Mengisi data core (roles, users, corporates, depts, projects).
- `scripts/seed-cfd.ts` — Mengisi data keuangan dan targets.
- `scripts/seed-crm.ts` — Mengisi data demo CRM.
- `scripts/seed-all.ts` — Menjalankan seluruh script di atas secara berurutan.
- `scripts/reset-db.ts` — Menghapus semua data dan melakukan re-seed.

## ID Strategy
The project uses **UUID** for all primary keys to ensure global uniqueness and scalability.
```typescript
id: uuid().primaryKey().defaultRandom(),
```
