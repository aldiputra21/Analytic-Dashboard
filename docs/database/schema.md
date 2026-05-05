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
- `attachments` (dengan field `status` dan `approval_id` untuk staging mechanism)
- `notification_broadcasts`, `notification_configs`
- `banks`, `corporate_sectors`, `currencies`, `cost_center_categories`

### Approval Tables — Field Penting

**`approval_workflows`**
| Kolom | Deskripsi |
|---|---|
| `view_component` | Key string dipetakan ke komponen React di `formRegistry.tsx` |
| `subject_fields` | Array field untuk extract subject dari payload (dot-notation support) |
| `callback_handler` | Key di `callbackRegistry.ts` yang dipanggil saat final approve |
| `is_active` | Jika `false`, modul kembali ke flow normal tanpa approval |

**`approvals`**
| Kolom | Deskripsi |
|---|---|
| `status` | `draft` \| `pending` \| `approved` \| `rejected` \| `cancelled` (default: `draft`) |
| `original_data` | Snapshot data sebelum diubah (hanya untuk action `edit`) |
| `subject` | Nilai yang di-extract dari payload sesuai `subject_fields` |
| `title` | String ringkas auto-generated dari subject values |
| `corporate_id` | Scope corporate untuk filtering approver |

**`approval_histories`**
| Kolom | Deskripsi |
|---|---|
| `action` | `created` \| `submit` \| `approve` \| `reject` \| `cancel` |
| `payload` | Snapshot payload saat action `submit`/`resubmit` (NULL untuk lainnya) |
| `step_id` | Nullable — NULL untuk action `created` dan `cancel` |

**`attachments`**
| Kolom | Deskripsi |
|---|---|
| `status` | `active` \| `staging` \| `orphaned` |
| `approval_id` | FK ke `approvals` — diisi saat file diupload melalui approval flow |
| `entity_id` | Nullable — NULL saat masih staging |

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
