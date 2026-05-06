# Design Document — Approval Module Integration

## Overview

Fitur ini mengintegrasikan sistem approval dinamis yang sudah ada ke 10 modul CFD yang belum terintegrasi. Modul Neraca (Balance Sheet) sudah menjadi referensi implementasi yang terbukti; 10 modul baru ini mengikuti pola yang sama persis.

### Modul yang Diintegrasikan

| # | Modul | Entity Type | Maker Role | Tabel DB |
|---|---|---|---|---|
| 1 | Laba Rugi (Income Statement) | `income_statement` | `finance_staff` | `cfd.income_statements` |
| 2 | Proyeksi Laba Rugi (Income Statement Projection) | `income_statement_projection` | `finance_staff` | `public.target_headers` + `public.target_details` |
| 3 | Arus Kas Mingguan (Weekly Cash Flow) | `weekly_cash_flow` | `finance_staff` | `cfd.weekly_cash_flows` |
| 4 | Realisasi (Realization) | `realization` | `finance_staff` | `cfd.cash_realizations` |
| 5 | Proyeksi Arus Kas (Cash Flow Projection) | `cash_flow_projection` | `finance_staff` | `cfd.cash_flow_projection_headers` + `cfd.cash_flow_projection_details` |
| 6 | Pinjaman Bank (Bank Loan) | `bank_loan` | `finance_staff` | `cfd.bank_loans` |
| 7 | Perusahaan (Corporate) | `corporate` | `corporate_admin` | `public.corporates` |
| 8 | Departemen (Department) | `department` | `corporate_admin` | `public.departments` |
| 9 | Cost Center | `cost_center` | `finance_staff` | `cfd.cost_centers` |
| 10 | Proyek (Project) | `project` | `corporate_admin` | `public.projects` |

### Perubahan UI Tambahan

Dua modul mendapat perubahan UI tambahan — memindahkan ringkasan total dari footer modal ke **Sticky Status Bar** (mengikuti pola `BalanceSheetForm.tsx`):
- **Proyeksi Laba Rugi**: Sticky bar menampilkan Total Pendapatan dan Total Biaya.
- **Proyeksi Arus Kas**: Sticky bar menampilkan Total Cash In dan Total Cash Out.

### Batasan Scope

- Tidak ada perubahan logic bisnis atau kalkulasi.
- Tidak ada perubahan schema database (tidak ada migrasi baru).
- Tidak ada endpoint API baru — semua approval melalui `/api/frs/approvals/*` yang sudah ada.
- Tidak ada permission baru — akses dikontrol oleh `maker_role` dan `required_role` di tabel workflow.

---

## Architecture

Arsitektur mengikuti pola yang sudah ada. Tidak ada komponen baru di level arsitektur — hanya penambahan entry di komponen yang sudah ada.

```mermaid
flowchart TD
    subgraph Frontend
        MGR[Manager Component\ne.g. IncomeStatementManager]
        HOOK[useApproval Hook]
        FORM[Shared Form\ne.g. IncomeStatementForm.tsx]
        REG[formRegistry.tsx]
        CAT[workflowCatalog.ts]
        ADM[ApprovalDetailModal]
    end

    subgraph Backend
        API[/api/frs/approvals/*]
        ENGINE[approvalEngine.ts]
        CB[approvalCallbacks.ts]
        REG_CB[callbackRegistry.ts]
        DB[(PostgreSQL)]
    end

    MGR -->|recheck / createDraft| HOOK
    HOOK -->|GET can-create| API
    HOOK -->|POST draft| API
    API --> ENGINE
    ENGINE -->|final approve| REG_CB
    REG_CB --> CB
    CB --> DB
    MGR --> ADM
    ADM --> REG
    REG --> FORM
    CAT -->|dropdown modul| ADM
```

### Alur Integrasi per Modul

Setiap modul mengikuti alur 6-langkah yang sama:

```
Step 1: seed-public.ts     → Insert approval_workflows + approval_workflow_steps
Step 2: approvalCallbacks  → registerCallback untuk create/edit/delete
Step 3: workflowCatalog    → Tambah entry ke WORKFLOW_CATALOG
Step 4: SharedForm         → Buat XxxForm.tsx di shared/forms/
Step 5: formRegistry       → Daftarkan via createApprovalFormAdapter (1 baris)
Step 6: Manager Component  → Intercept handleSave + handleDelete dengan useApproval
```

---

## Components and Interfaces

### 6.1 Callback Handlers (`approvalCallbacks.ts`)

30 handler baru didaftarkan (3 action × 10 modul). Semua mengikuti signature yang sama:

```typescript
registerCallback('handleXxxCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(xxxTable).values({ ...data, createdBy: requestedBy ?? SYSTEM_ACTOR_ID } as any);
});

registerCallback('handleXxxEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(xxxTable)
    .set({ ...data, updatedBy: requestedBy ?? null, updatedAt: new Date() } as any)
    .where(eq(xxxTable.id, entityId));
});

registerCallback('handleXxxDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required');
  await db.delete(xxxTable).where(eq(xxxTable.id, entityId));
});
```

**Catatan khusus untuk modul header-detail** (Proyeksi Laba Rugi, Proyeksi Arus Kas):
- Payload untuk `create` berisi header + array details.
- Callback `create` melakukan insert header terlebih dahulu, kemudian insert details dalam satu transaksi.
- Callback `delete` melakukan cascade delete (atau delete details terlebih dahulu jika tidak ada `ON DELETE CASCADE`).

### 6.2 Workflow Catalog (`workflowCatalog.ts`)

10 entry baru ditambahkan ke `WORKFLOW_CATALOG`:

```typescript
// Contoh untuk Income Statement
{
  labelId: 'Laba Rugi',
  labelEn: 'Income Statement',
  module: 'cfd',
  entityType: 'income_statement',
  viewComponent: 'IncomeStatementApprovalForm',
  callbacks: {
    create: 'handleIncomeStatementCreate',
    edit: 'handleIncomeStatementEdit',
    delete: 'handleIncomeStatementDelete',
  },
},
```

### 6.3 Shared Form Components (`src/components/financial/shared/forms/`)

10 file baru dibuat. Setiap form mengimplementasikan `SharedFormProps<TPayload>`:

```typescript
export interface XxxFormProps {
  payload: XxxPayload;
  onChange?: (field: keyof XxxPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  // Props tambahan spesifik per-form
  [key: string]: unknown;
}
```

**Aturan shared form:**
- Kalkulasi dihitung dari `payload` — pure function, tidak ada state eksternal.
- Tidak ada fetch data di dalam form.
- Support `readOnly` dan `onChange`.
- Untuk Proyeksi Laba Rugi dan Proyeksi Arus Kas: sticky status bar di bawah header.

**Daftar file baru:**

| File | Payload Type | Sticky Bar |
|---|---|---|
| `IncomeStatementForm.tsx` | `IncomeStatementPayload` | Tidak |
| `IncomeStatementProjectionForm.tsx` | `IncomeStatementProjectionPayload` | Ya (Total Pendapatan, Total Biaya) |
| `WeeklyCashFlowForm.tsx` | `WeeklyCashFlowPayload` | Tidak |
| `RealizationForm.tsx` | `RealizationPayload` | Tidak |
| `CashFlowProjectionForm.tsx` | `CashFlowProjectionPayload` | Ya (Total Cash In, Total Cash Out) |
| `BankLoanForm.tsx` | `BankLoanPayload` | Tidak |
| `CorporateForm.tsx` | `CorporatePayload` | Tidak |
| `DepartmentForm.tsx` | `DepartmentPayload` | Tidak |
| `CostCenterForm.tsx` | `CostCenterPayload` | Tidak |
| `ProjectForm.tsx` | `ProjectPayload` | Tidak |

### 6.4 Form Registry (`formRegistry.tsx`)

10 baris baru ditambahkan ke `FORM_REGISTRY`:

```typescript
import { IncomeStatementForm } from '../shared/forms/IncomeStatementForm';
import type { IncomeStatementPayload } from '../shared/forms/IncomeStatementForm';
// ... (9 import lainnya)

export const FORM_REGISTRY: Record<string, React.ComponentType<ApprovalFormProps>> = {
  BalanceSheetApprovalForm: createApprovalFormAdapter<BalanceSheetPayload>(/* ... */),

  // 10 entry baru:
  IncomeStatementApprovalForm: createApprovalFormAdapter<IncomeStatementPayload>(
    IncomeStatementForm as React.ComponentType<SharedFormProps<IncomeStatementPayload>>,
    { extraProps: { showCorporateSelector: true, corporateSelectorDisabled: true } },
  ),
  // ... (9 lainnya dengan pola yang sama)
};
```

### 6.5 Manager Component Integration

Setiap manager component yang sudah ada dimodifikasi untuk mengintegrasikan `useApproval`. Pola yang diterapkan identik dengan `BalanceSheetManager.tsx`:

```typescript
// 1. Import
import { useApproval } from '../../../hooks/financial/useApproval';
import { ApprovalDetailModal } from '../approval/ApprovalDetailModal';
import { approvalI18n } from '../../../i18n/approval';

// 2. State
const [activeDraftApprovalId, setActiveDraftApprovalId] = useState<string | null>(null);

// 3. Hooks
const approvalCreate = useApproval('cfd', 'xxx_entity', 'create');
const approvalEdit   = useApproval('cfd', 'xxx_entity', 'edit');
const approvalDelete = useApproval('cfd', 'xxx_entity', 'delete');

// 4. recheck() saat modal dibuka
const openModal = (mode, item?) => {
  if (mode === 'create') approvalCreate.recheck();
  else if (mode === 'edit') approvalEdit.recheck();
  // ...
};

// 5. Intercept handleSave() — Zod validation → approval check → createDraft
// 6. Intercept handleDelete() — approval check → createDraft
// 7. Render ApprovalDetailModal dengan activeDraftApprovalId
```

**Daftar manager yang dimodifikasi:**

| Manager File | Entity Type |
|---|---|
| `data-entry/IncomeStatementManager.tsx` | `income_statement` |
| `admin/TargetManager.tsx` | `income_statement_projection` |
| `data-entry/WeeklyCashFlowManager.tsx` | `weekly_cash_flow` |
| `cfd/RealizationManager.tsx` | `realization` |
| `admin/CashFlowProjectionManager.tsx` | `cash_flow_projection` |
| `cfd/BankLoanManager.tsx` | `bank_loan` |
| `admin/CorporateManager.tsx` | `corporate` |
| `admin/DepartmentManager.tsx` | `department` |
| `admin/CostCenterManager.tsx` | `cost_center` |
| `admin/ProjectManager.tsx` | `project` |

### 6.6 Sticky Status Bar Pattern

Untuk `IncomeStatementProjectionForm.tsx` dan `CashFlowProjectionForm.tsx`, sticky bar diimplementasikan mengikuti pola `BalanceSheetForm.tsx`:

```tsx
{/* Sticky Status Bar — di bawah header, di atas konten form yang scrollable */}
<div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-6">
  <div className="flex items-center gap-2">
    <span className="text-xs font-bold text-slate-500 uppercase">Total Pendapatan</span>
    <span className="text-sm font-bold text-emerald-600">{formatRupiah(totalRevenue)}</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-xs font-bold text-slate-500 uppercase">Total Biaya</span>
    <span className="text-sm font-bold text-rose-600">{formatRupiah(totalCost)}</span>
  </div>
</div>
```

---

## Data Models

### Seed Data — Approval Workflows (30 entries)

Setiap modul memiliki 3 workflow (create, edit, delete). Total: 30 entries baru di `approval_workflows`.

#### Modul Finansial (6 modul × 3 action = 18 entries)

**Maker:** `finance_staff` | **Step 1:** `finance_manager` | **Step 2 (final):** `finance_leader`
**Delete:** 1 step saja dengan `finance_leader`

| Module | Entity Type | Name (ID) | Name (EN) |
|---|---|---|---|
| cfd | income_statement | Persetujuan Input Laba Rugi | Income Statement Input Approval |
| cfd | income_statement | Persetujuan Ubah Laba Rugi | Income Statement Edit Approval |
| cfd | income_statement | Persetujuan Hapus Laba Rugi | Income Statement Delete Approval |
| cfd | income_statement_projection | Persetujuan Input Proyeksi Laba Rugi | Income Statement Projection Input Approval |
| cfd | income_statement_projection | Persetujuan Ubah Proyeksi Laba Rugi | Income Statement Projection Edit Approval |
| cfd | income_statement_projection | Persetujuan Hapus Proyeksi Laba Rugi | Income Statement Projection Delete Approval |
| cfd | weekly_cash_flow | Persetujuan Input Arus Kas Mingguan | Weekly Cash Flow Input Approval |
| cfd | weekly_cash_flow | Persetujuan Ubah Arus Kas Mingguan | Weekly Cash Flow Edit Approval |
| cfd | weekly_cash_flow | Persetujuan Hapus Arus Kas Mingguan | Weekly Cash Flow Delete Approval |
| cfd | realization | Persetujuan Input Realisasi | Realization Input Approval |
| cfd | realization | Persetujuan Ubah Realisasi | Realization Edit Approval |
| cfd | realization | Persetujuan Hapus Realisasi | Realization Delete Approval |
| cfd | cash_flow_projection | Persetujuan Input Proyeksi Arus Kas | Cash Flow Projection Input Approval |
| cfd | cash_flow_projection | Persetujuan Ubah Proyeksi Arus Kas | Cash Flow Projection Edit Approval |
| cfd | cash_flow_projection | Persetujuan Hapus Proyeksi Arus Kas | Cash Flow Projection Delete Approval |
| cfd | bank_loan | Persetujuan Input Pinjaman Bank | Bank Loan Input Approval |
| cfd | bank_loan | Persetujuan Ubah Pinjaman Bank | Bank Loan Edit Approval |
| cfd | bank_loan | Persetujuan Hapus Pinjaman Bank | Bank Loan Delete Approval |

#### Modul Master Data (4 modul × 3 action = 12 entries)

**Maker:** `corporate_admin` | **Step 1:** `finance_manager` | **Step 2 (final):** `finance_leader`
**Delete:** 1 step saja dengan `finance_leader`

| Module | Entity Type | Name (ID) | Name (EN) |
|---|---|---|---|
| cfd | corporate | Persetujuan Input Perusahaan | Corporate Input Approval |
| cfd | corporate | Persetujuan Ubah Perusahaan | Corporate Edit Approval |
| cfd | corporate | Persetujuan Hapus Perusahaan | Corporate Delete Approval |
| cfd | department | Persetujuan Input Departemen | Department Input Approval |
| cfd | department | Persetujuan Ubah Departemen | Department Edit Approval |
| cfd | department | Persetujuan Hapus Departemen | Department Delete Approval |
| cfd | cost_center | Persetujuan Input Cost Center | Cost Center Input Approval |
| cfd | cost_center | Persetujuan Ubah Cost Center | Cost Center Edit Approval |
| cfd | cost_center | Persetujuan Hapus Cost Center | Cost Center Delete Approval |
| cfd | project | Persetujuan Input Proyek | Project Input Approval |
| cfd | project | Persetujuan Ubah Proyek | Project Edit Approval |
| cfd | project | Persetujuan Hapus Proyek | Project Delete Approval |

### Subject Fields per Modul

`subject_fields` digunakan oleh approval engine untuk menghasilkan judul ringkas approval.

| Entity Type | Subject Fields |
|---|---|
| `income_statement` | `corporateName` (string), `period` (date) |
| `income_statement_projection` | `departmentName` (string), `fiscalYear` (number) |
| `weekly_cash_flow` | `corporateName` (string), `weekStart` (date) |
| `realization` | `departmentName` (string), `transactionDate` (date) |
| `cash_flow_projection` | `corporateName` (string), `fiscalYear` (number) |
| `bank_loan` | `bankName` (string), `loanAmount` (currency) |
| `corporate` | `name` (string), `code` (string) |
| `department` | `name` (string), `corporateName` (string) |
| `cost_center` | `name` (string), `code` (string) |
| `project` | `name` (string), `corporateName` (string) |

### Payload Types per Modul

Setiap shared form mendefinisikan payload type-nya sendiri. Contoh:

```typescript
// IncomeStatementPayload
export interface IncomeStatementPayload {
  period?: string;
  corporateId?: string;
  revenue?: number;
  cogs?: number;
  operatingExpenses?: number;
  interestExpense?: number;
  taxExpense?: number;
  otherIncome?: number;
  otherExpense?: number;
  notes?: string;
  [key: string]: unknown;
}

// CashFlowProjectionPayload (header-detail)
export interface CashFlowProjectionPayload {
  corporateId?: string;
  fiscalYear?: number;
  details?: Array<{
    month: number;
    group: string;
    type: string;
    description: string;
    amount: number;
  }>;
  [key: string]: unknown;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Approval bypass saat workflow tidak aktif atau user tidak punya maker role

*For any* modul yang terintegrasi, jika `is_active = false` pada workflow atau user tidak memiliki `maker_role` yang sesuai, maka `useApproval` hook SHALL mengembalikan `hasWorkflow = false` dan data disimpan langsung ke database tanpa melalui approval engine.

**Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5**

---

### Property 2: Callback atomicity — rollback saat callback gagal

*For any* approval yang mencapai final step, jika callback handler melempar exception, maka seluruh transaksi (history insert + status update + callback) SHALL di-rollback, sehingga status approval tetap `pending` dan tidak ada data yang tersimpan di tabel modul.

**Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.4, 9.4, 10.4**

---

### Property 3: Callback create menggunakan requestedBy sebagai createdBy

*For any* callback create yang dieksekusi, nilai `requestedBy` (UUID maker) SHALL digunakan sebagai `createdBy` pada record yang diinsert ke tabel modul.

**Validates: Requirements 12.2**

---

### Property 4: Callback edit meng-strip audit fields dari payload

*For any* callback edit yang dieksekusi dengan payload yang mengandung field `id`, `createdBy`, atau `createdAt`, field-field tersebut SHALL di-strip dari payload sebelum update, sehingga nilai asli di database tidak tertimpa.

**Validates: Requirements 12.3**

---

### Property 5: Callback delete memverifikasi entityId

*For any* callback delete yang dipanggil, jika `entityId` bernilai null atau undefined, callback SHALL melempar error dan tidak mengeksekusi operasi delete.

**Validates: Requirements 12.4**

---

### Property 6: Form registry key konsisten dengan view_component di database

*For any* modul yang terintegrasi, key yang digunakan di `FORM_REGISTRY` SHALL identik dengan nilai `view_component` yang tersimpan di tabel `approval_workflows`, sehingga `ApprovalDetailModal` selalu dapat menemukan komponen yang tepat.

**Validates: Requirements 1.7, 2.9, 3.7, 4.7, 5.9, 6.7, 7.7, 8.7, 9.7, 10.7**

---

### Property 7: Shared form tidak melakukan fetch data

*For any* shared form yang dirender (baik di manager CRUD maupun di `ApprovalDetailModal`), form SHALL merender seluruh field dari `payload` prop tanpa melakukan fetch data sendiri, sehingga form bersifat pure rendering component.

**Validates: Requirements 1.6, 2.8, 3.6, 4.6, 5.8, 6.6, 7.6, 8.6, 9.6, 10.6**

---

### Property 8: Sticky status bar selalu terlihat saat scroll

*For any* form `IncomeStatementProjectionForm` atau `CashFlowProjectionForm` yang dirender dalam modal dengan konten yang melebihi tinggi viewport, sticky status bar SHALL tetap terlihat di posisi tetap saat user men-scroll konten form ke bawah.

**Validates: Requirements 2.7, 5.7**

---

### Property 9: Seed idempoten — dapat dijalankan ulang tanpa error

*For any* eksekusi seed script `seed-public.ts`, script SHALL berhasil dijalankan tanpa error duplikasi, karena setiap insert menggunakan `onConflictDoUpdate` pada unique constraint `(module, entityType, action)`.

**Validates: Requirements 11.2**

---

### Property 10: Seed steps menggunakan pola existingSteps guard

*For any* eksekusi seed script, `approval_workflow_steps` SHALL hanya diinsert jika belum ada steps untuk workflow tersebut (`existingSteps.length === 0`), sehingga FK constraint ke `approval_histories` tidak dilanggar pada re-seed.

**Validates: Requirements 11.3**

---

## Error Handling

### Frontend

| Skenario | Penanganan |
|---|---|
| `useApproval` gagal fetch status | `isChecking = false`, `hasWorkflow = false` — flow normal berjalan |
| `createDraft()` gagal (network/server error) | `toast.error(err.message)` — modal tetap terbuka, user bisa retry |
| `approvalHook.isChecking = true` | Tombol Simpan dinonaktifkan untuk mencegah race condition |
| Form validation gagal (Zod) | `toast.error()` per pesan error — `createDraft()` tidak dipanggil |

### Backend — Callback Handlers

| Skenario | Penanganan |
|---|---|
| `entityId` null pada edit/delete | Throw `Error('entityId required')` → transaksi rollback |
| Insert/update gagal (constraint violation) | Exception propagates → transaksi rollback, status tetap `pending` |
| `requestedBy` null | Fallback ke `SYSTEM_ACTOR_ID` (`00000000-0000-0000-0000-000000000000`) |

### Seed Script

| Skenario | Penanganan |
|---|---|
| Workflow sudah ada | `onConflictDoUpdate` — update fields tanpa error |
| Steps sudah ada | `if (existingSteps.length === 0)` guard — skip insert |
| Role tidak ditemukan di `roleMap` | `roleMap.get('role_name')!` — akan throw jika role tidak ada (intentional — seed harus dijalankan setelah roles seed) |

---

## Testing Strategy

Fitur ini adalah integrasi pola yang sudah terbukti ke modul-modul baru. Strategi testing berfokus pada verifikasi bahwa setiap modul mengikuti pola dengan benar.

### Unit Tests

Fokus pada komponen yang memiliki logika spesifik:

1. **Callback handlers** — Verifikasi bahwa:
   - `create` callback menggunakan `requestedBy` sebagai `createdBy`
   - `edit` callback meng-strip `id`, `createdBy`, `createdAt` dari payload
   - `delete` callback melempar error jika `entityId` null

2. **Shared form components** — Verifikasi bahwa:
   - Form merender semua field dari `payload`
   - Kalkulasi sticky bar (untuk Proyeksi Laba Rugi dan Proyeksi Arus Kas) dihitung dengan benar dari `payload`
   - `readOnly = true` menonaktifkan semua input

3. **Seed script** — Verifikasi bahwa:
   - 30 workflow entries terdefinisi dengan benar
   - Role mapping menggunakan `roleMap.get()` bukan hardcode UUID

### Property-Based Tests

Menggunakan library property-based testing (misalnya `fast-check` untuk TypeScript):

**Property 1 — Approval bypass:**
```typescript
// fc.record({ isActive: fc.boolean(), hasMakerRole: fc.boolean() })
// → jika !isActive || !hasMakerRole, maka hasWorkflow === false
```

**Property 2 — Callback atomicity:**
```typescript
// fc.record({ payload: fc.object(), entityId: fc.string() })
// → jika callback throw, status tetap 'pending'
```

**Property 3 — requestedBy sebagai createdBy:**
```typescript
// fc.record({ payload: fc.object(), requestedBy: fc.uuidV4() })
// → record yang diinsert memiliki createdBy === requestedBy
```

**Property 4 — Strip audit fields:**
```typescript
// fc.record({ payload: fc.object().map(p => ({ ...p, id: 'x', createdBy: 'y', createdAt: new Date() })) })
// → record yang diupdate tidak mengandung id, createdBy, createdAt dari payload
```

**Property 5 — entityId guard:**
```typescript
// fc.constant(undefined) | fc.constant(null)
// → callback delete melempar error
```

**Property 6 — Form registry key consistency:**
```typescript
// Untuk setiap entry di WORKFLOW_CATALOG, viewComponent key harus ada di FORM_REGISTRY
```

**Property 7 — Shared form pure rendering:**
```typescript
// fc.record({ payload: fc.object() })
// → render form tidak memanggil fetch/apiFetch
```

**Property 9 — Seed idempoten:**
```typescript
// Jalankan seed dua kali berturut-turut → tidak ada error
```

**Property 10 — Steps guard:**
```typescript
// Jika existingSteps.length > 0, tidak ada insert baru ke approval_workflow_steps
```

### Integration / Smoke Tests

Verifikasi end-to-end untuk setiap modul (mengikuti checklist di `docs/guides/integrating-approval.md`):

1. Login sebagai `finance_staff` → simpan data → draft terbuat, `ApprovalDetailModal` terbuka
2. Login sebagai `system_admin` → simpan data → langsung ke DB (bypass)
3. Nonaktifkan workflow (`is_active=false`) → simpan → langsung ke DB
4. Submit draft → approver menerima notifikasi
5. Approve step 1 → advance ke step 2
6. Approve step terakhir → callback dieksekusi → data masuk ke tabel modul
7. Jika callback gagal → status tetap `pending`
8. Reject → kembali ke draft → resubmit → approve
9. Cancel dari draft → status `cancelled`

### Verifikasi TypeScript

```bash
npx tsc --noEmit
```

Zero errors wajib setelah semua perubahan diterapkan.
