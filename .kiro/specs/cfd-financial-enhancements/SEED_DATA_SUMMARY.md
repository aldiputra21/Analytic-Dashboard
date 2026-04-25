# Seed Data Summary — CFD Financial Enhancements

## Overview

Semua seed data untuk CFD Financial Enhancements telah ditambahkan ke `scripts/seed-public.ts`.

## Seed Data yang Ditambahkan

### 1. Banks (Master Data)
**File:** `scripts/seed-public.ts`
**Tabel:** `public.banks`
**Data:**
- BCA (Bank Central Asia) - SWIFT: CENAIDJA
- MANDIRI (Bank Mandiri) - SWIFT: BMRIIDJA
- BNI (Bank Negara Indonesia) - SWIFT: BNINIDJA

**Status:** ✅ Active (default)

### 2. Corporate Sectors (Master Data)
**File:** `scripts/seed-public.ts`
**Tabel:** `public.corporate_sectors`
**Data:**
- technology (Teknologi / Technology)
- retail (Retail / Retail)
- services (Jasa / Services)
- manufacturing (Manufaktur / Manufacturing)

**Status:** ✅ Active (default)

### 3. Currencies (Master Data)
**File:** `scripts/seed-public.ts`
**Tabel:** `public.currencies`
**Data:**
- IDR (Rupiah)
- USD (US Dollar)
- EUR (Euro)

**Status:** ✅ Active (default)

### 4. Cost Center Categories (Master Data)
**File:** `scripts/seed-public.ts`
**Tabel:** `public.cost_center_categories`
**Data:**
- hrd (HRD / HRD)
- atk (Alat Tulis Kantor / Office Stationery)
- operational (Operasional / Operational)
- marketing (Pemasaran / Marketing)
- it (IT / IT)

**Status:** ✅ Active (default)

### 5. Notification Configs (Configuration)
**File:** `scripts/seed-public.ts`
**Tabel:** `public.notification_configs`
**Data:**
- Module: `cfd`
- Event Type: `loan_installment_due`
- Recipients by Role:
  - `subsidiary_manager` role → Active
  - `bod` role → Active
  - `owner` role → Active

**Purpose:** Konfigurasi notifikasi cicilan pinjaman bank yang akan dikirim ke user berdasarkan role mereka.

**Status:** ✅ Active (default)

## Permissions Added

Semua permission keys baru telah ditambahkan ke `permissionCatalog` di `scripts/seed-public.ts`:

### Master Tables Permissions
- `public.banks.read` / `.write` / `.delete`
- `public.corporate_sectors.read` / `.write` / `.delete`
- `public.currencies.read` / `.write` / `.delete`
- `public.cost_center_categories.read` / `.write` / `.delete`
- `public.notification_configs.read` / `.write` / `.delete`

### Financial Enhancements Permissions
- `cfd.realizations.read` / `.write` / `.delete`
- `cfd.bank_loans.read` / `.write` / `.delete`

## Role Permissions Mapping

### Owner Role
- ✅ All permissions (including all new permissions)

### BOD (Board of Directors) Role
- ✅ All `.read` permissions
- ✅ `cfd.realizations.read`
- ✅ `cfd.bank_loans.read`

### Subsidiary Manager Role
- ✅ `cfd.realizations.read` / `.write`
- ✅ `cfd.bank_loans.read` / `.write`
- ✅ All master table `.read` permissions
- ❌ Master table `.write` / `.delete` (owner only)

## How to Run

```bash
# Run seed script
npx tsx scripts/seed-public.ts

# Or as part of full reset
npx tsx scripts/reset-db.ts
```

## Verification

After running the seed script, verify the data:

```bash
# Check banks
SELECT * FROM public.banks WHERE status = 'active';

# Check corporate sectors
SELECT * FROM public.corporate_sectors WHERE status = 'active';

# Check currencies
SELECT * FROM public.currencies WHERE status = 'active';

# Check cost center categories
SELECT * FROM public.cost_center_categories WHERE status = 'active';

# Check notification configs
SELECT * FROM public.notification_configs WHERE is_active = true;
```

## Notes

- All master data is seeded with `status = 'active'` by default
- Notification configs are seeded with `is_active = true` by default
- All records use `SYSTEM_ACTOR_ID` as `createdBy`
- Seed uses `onConflictDoNothing()` to prevent duplicate errors on re-runs
- Notification configs use unique constraint on (module, event_type, role_id)

## Related Tasks

- Task 18: Update `scripts/seed-public.ts` — ✅ COMPLETED
- Task 4: Migration Script — ✅ COMPLETED (migrate system_configs to master tables)
