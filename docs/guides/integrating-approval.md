# Panduan Integrasi Modul dengan Approval System

Panduan ini menjelaskan langkah-demi-langkah untuk mengintegrasikan modul baru dengan Dynamic Approval System.

> Baca [docs/modules/approval-system.md](../modules/approval-system.md) terlebih dahulu untuk memahami arsitektur sistem.

---

## Model Permission (Penting — Berbeda dari Sistem Lain)

Approval **tidak menggunakan permission key** untuk kontrol akses mutasi. Sebagai gantinya:

| Kebutuhan | Mekanisme |
|---|---|
| Tampilkan menu "Monitoring Approval" | Permission `approvals.read` |
| Tampilkan menu "Konfigurasi Approval" | Permission `public.approval_configs.read` |
| Buat draft / submit / cancel | Role check via `approval_workflows.maker_role` + scope corporate/department |
| Approve / reject step | Role check via `approval_workflow_steps.required_role` + scope corporate/department |
| Kelola konfigurasi workflow | Permission `public.approval_configs.write` / `.delete` |

Permission `public.approvals.write` dan `public.approvals.approve` **tidak ada** — akses dikontrol oleh role di tabel workflow, bukan permission key.

---

## Checklist Integrasi Modul

### Step 1 — Seed Konfigurasi Workflow (Database)

Tambahkan ke `scripts/seed-public.ts` bagian "Approval Workflows":

```typescript
const myModuleSubjectFields: Array<{ field: string; label: string; type: 'string' | 'currency' | 'date' | 'number' }> = [
  { field: 'corporateName', label: 'Perusahaan', type: 'string' },
  { field: 'period', label: 'Periode', type: 'date' },
];

const [workflow] = await db.insert(approvalWorkflows).values({
  module: 'cfd',
  entityType: 'my_entity',
  action: 'create',
  name: 'Persetujuan Input My Entity',
  nameEn: 'My Entity Input Approval',
  callbackHandler: 'handleMyEntityCreate',
  viewComponent: 'MyEntityApprovalForm',   // ← key di FORM_REGISTRY
  makerRole: financeStaffRoleId,           // ← UUID role yang boleh buat draft
  subjectFields: myModuleSubjectFields,
  createdBy: SYSTEM_ACTOR_ID,
}).onConflictDoUpdate({
  target: [approvalWorkflows.module, approvalWorkflows.entityType, approvalWorkflows.action],
  set: { name: ..., nameEn: ..., callbackHandler: ..., viewComponent: ..., makerRole: ..., subjectFields: ..., updatedBy: ..., updatedAt: new Date() },
}).returning();

// PENTING: Jangan delete steps jika sudah ada approval_histories yang referensi step tersebut
// (FK constraint). Gunakan pola ini:
const existingSteps = await db.select({ id: approvalWorkflowSteps.id })
  .from(approvalWorkflowSteps)
  .where(eq(approvalWorkflowSteps.workflowId, workflow.id));

if (existingSteps.length === 0) {
  await db.insert(approvalWorkflowSteps).values([
    { workflowId: workflow.id, stepOrder: 1, stepType: 'approval', requiredRole: managerRoleId },
    { workflowId: workflow.id, stepOrder: 2, stepType: 'approval', requiredRole: leaderRoleId },
  ]);
}
```

**Catatan penting:**
- `makerRole` adalah **UUID role** dari tabel `roles`, bukan nama role
- `requiredRole` di steps juga **UUID role**
- Gunakan `roleMap.get('finance_staff')!` untuk mendapatkan UUID dari nama role
- `nameEn` wajib diisi untuk dukungan bilingual di monitoring dan konfigurasi
- Jangan delete steps jika sudah ada history — gunakan pola `existingSteps.length === 0`

- [ ] Insert `approval_workflows` dengan `makerRole` dan `nameEn`
- [ ] Insert `approval_workflow_steps` dengan `requiredRole` (UUID)
- [ ] Tidak perlu tambah permission baru — akses dikontrol oleh role

### Step 2 — Daftarkan Callback Handler (Backend)

Buka `src/services/approval/approvalCallbacks.ts` dan tambahkan:

```typescript
import { myTable } from '../../db/schema';

// requestedBy = UUID user yang membuat draft, digunakan sebagai createdBy untuk audit fields
registerCallback('handleMyEntityCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(myTable).values({
    ...data,
    createdBy: requestedBy ?? '00000000-0000-0000-0000-000000000000',
  } as any);
});

registerCallback('handleMyEntityEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(myTable)
    .set({ ...data, updatedBy: requestedBy ?? null, updatedAt: new Date() } as any)
    .where(eq(myTable.id, entityId));
});

registerCallback('handleMyEntityDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required');
  await db.delete(myTable).where(eq(myTable.id, entityId));
});
```

**Aturan callback:**
- Signature: `(payload, entityId?, stagedFiles?, requestedBy?)` — selalu gunakan `requestedBy` sebagai `createdBy`/`updatedBy`
- Strip field `id`, `createdBy`, `createdAt` dari payload sebelum insert/update (biarkan DB generate atau pertahankan nilai asli)
- Handler hanya boleh berisi logika DB — JANGAN duplikasi logic dari route modul
- **Callback dieksekusi dalam transaksi** bersama history insert dan status update — jika callback throw, seluruh transaksi rollback dan status approval tetap `pending`

- [ ] Tambahkan `registerCallback` untuk setiap action (create/edit/delete)
- [ ] Gunakan `requestedBy` sebagai `createdBy`/`updatedBy`
- [ ] Strip audit fields dari payload sebelum insert/update

### Step 3 — Daftarkan Modul ke `workflowCatalog.ts`

Buka `src/components/financial/approval/workflowCatalog.ts` dan tambahkan entry:

```typescript
export const WORKFLOW_CATALOG: WorkflowCatalogEntry[] = [
  // ... existing entries ...
  {
    labelId: 'Nama Modul (ID)',
    labelEn: 'Module Name (EN)',
    module: 'cfd',
    entityType: 'my_entity',
    viewComponent: 'MyEntityApprovalForm',
    callbacks: {
      create: 'handleMyEntityCreate',
      edit: 'handleMyEntityEdit',
      delete: 'handleMyEntityDelete',
    },
  },
];
```

Catalog ini digunakan oleh `ApprovalConfigManager` untuk dropdown modul dan auto-fill `entityType`, `callbackHandler`, `viewComponent` di form konfigurasi.

- [ ] Tambahkan entry ke `WORKFLOW_CATALOG`

### Step 4 — Buat Shared Form & Daftarkan ke Registry

#### 4a. Buat Shared Form Component

Buat `src/components/financial/shared/forms/MyEntityForm.tsx`:

```typescript
export interface MyEntityPayload {
  period?: string;
  corporateId?: string;
  // ... field lainnya
  [key: string]: unknown;
}

export interface MyEntityFormProps {
  payload: MyEntityPayload;
  onChange?: (field: keyof MyEntityPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  showCorporateSelector?: boolean;
  corporateSelectorDisabled?: boolean;
}

export const MyEntityForm: React.FC<MyEntityFormProps> = ({
  payload, onChange, readOnly = false, language, ...
}) => {
  // Kalkulasi dihitung dari payload — pure function, tidak butuh state eksternal
  const total = (payload.fieldA ?? 0) + (payload.fieldB ?? 0);
  const isReadOnly = readOnly || !onChange;

  return (
    <div>
      {/* Sticky status bar di atas form (opsional, untuk form dengan validasi balance) */}
      {/* Header: periode, corporate selector */}
      {/* Form fields */}
      {/* Footer: kalkulasi/summary — BUKAN di footer modal */}
    </div>
  );
};
```

**Aturan shared form:**
- Kalkulasi dihitung dari `payload` — **pure function**, tidak butuh state eksternal
- Info kalkulasi di **footer form** (bukan footer modal)
- Support `readOnly` dan `onChange`
- **JANGAN** berisi logic fetch data

#### 4b. Daftarkan ke `formRegistry.tsx` — Cukup 1 Baris

```typescript
import { MyEntityForm } from '../shared/forms/MyEntityForm';
import type { MyEntityPayload } from '../shared/forms/MyEntityForm';

export const FORM_REGISTRY: Record<string, React.ComponentType<ApprovalFormProps>> = {
  // ... existing entries ...
  MyEntityApprovalForm: createApprovalFormAdapter<MyEntityPayload>(
    MyEntityForm as React.ComponentType<SharedFormProps<MyEntityPayload>>,
    { extraProps: { showCorporateSelector: true, corporateSelectorDisabled: true } },
  ),
};
```

#### 4c. Gunakan Shared Form di Manager

```typescript
import { MyEntityForm, type MyEntityPayload } from '../shared/forms/MyEntityForm';

<MyEntityForm
  payload={formData as MyEntityPayload}
  onChange={modalMode !== 'view'
    ? (field, value) => setFormData(prev => ({ ...prev, [field]: value }))
    : undefined
  }
  readOnly={modalMode === 'view'}
  language={language}
  showCorporateSelector={showSelector}
  corporateSelectorDisabled={!hasFullCorporateAccess}
/>
```

- [ ] Buat `MyEntityForm.tsx` di `src/components/financial/shared/forms/`
- [ ] Daftarkan di `formRegistry.tsx` dengan `createApprovalFormAdapter` (1 baris)
- [ ] Gunakan shared form di manager

### Step 5 — Integrasi di Manager Component

#### 5a. State dan Hook

```typescript
import { useApproval } from '../../../hooks/financial/useApproval';
import { ApprovalDetailModal } from '../approval/ApprovalDetailModal';
import { approvalI18n } from '../../../i18n/approval';

const [activeDraftApprovalId, setActiveDraftApprovalId] = useState<string | null>(null);

// Scope check dilakukan di backend berdasarkan accessContext user (JWT).
// TIDAK perlu pass corporateId dari form ke hook.
const approvalCreate = useApproval('cfd', 'my_entity', 'create');
const approvalEdit   = useApproval('cfd', 'my_entity', 'edit');
const approvalDelete = useApproval('cfd', 'my_entity', 'delete');
```

#### 5b. Re-fetch saat Modal Dibuka

```typescript
const openModal = (mode: 'create' | 'edit' | 'view', item?: MyEntity) => {
  setModalMode(mode);
  if (mode === 'create') approvalCreate.recheck();
  else if (mode === 'edit') approvalEdit.recheck();
  // ... set formData ...
  setIsModalOpen(true);
};
```

#### 5c. Intercept `handleSave()` — Urutan Wajib

```typescript
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSaving) return;

  // 1. Validasi Zod — WAJIB sebelum cek approval
  const validation = schema.safeParse(formData);
  if (!validation.success) {
    const errors = new Set(validation.error.issues.map(i => i.message));
    errors.forEach(msg => toast.error(msg));
    return;
  }

  // 2. Pre-condition check bisnis (duplikasi, dll.)
  // ...

  // 3. Cek approval workflow
  const approvalHook = modalMode === 'create' ? approvalCreate : approvalEdit;
  if (!approvalHook.isChecking && approvalHook.hasWorkflow) {
    setIsSaving(true);
    try {
      const draft = await approvalHook.createDraft({
        payload: validation.data as Record<string, unknown>,
        entityId: modalMode === 'edit' ? formData.id : undefined,
        originalData: modalMode === 'edit' ? { ...formData } : undefined,
        // corporateId TIDAK dikirim — backend ambil dari accessContext user (JWT)
      });
      setIsModalOpen(false);
      setActiveDraftApprovalId(draft.id);
      toast.success(approvalI18n[language].toast.draftCreated);
    } catch (err: any) {
      toast.error(err.message ?? common.errorSave);
    } finally {
      setIsSaving(false);
    }
    return;
  }

  // 4. Flow normal (tidak ada workflow atau user tidak punya makerRole)
  // ...
};
```

#### 5d. Intercept `handleDelete()`

```typescript
const handleDelete = async (id: string) => {
  if (!approvalDelete.isChecking && approvalDelete.hasWorkflow) {
    const item = data.find(d => d.id === id);
    if (!item) return;
    try {
      const draft = await approvalDelete.createDraft({
        payload: { ...item },
        entityId: id,
        originalData: { ...item },
      });
      setDeleteConfirmId(null);
      setActiveDraftApprovalId(draft.id);
      toast.success(approvalI18n[language].toast.draftCreated);
    } catch (err: any) {
      toast.error(err.message ?? common.errorDelete);
    }
    return;
  }
  // Flow normal delete
};
```

#### 5e. Tambahkan `ApprovalDetailModal` di JSX

```tsx
<AnimatePresence>
  {activeDraftApprovalId && (
    <ApprovalDetailModal
      approvalId={activeDraftApprovalId}
      onClose={() => setActiveDraftApprovalId(null)}
      onRefresh={fetchData}
    />
  )}
</AnimatePresence>
```

### Step 6 — Verifikasi

- [ ] `npx tsc --noEmit` — zero errors
- [ ] Login sebagai user dengan `makerRole` → simpan → draft terbuat, modal approval terbuka
- [ ] Login sebagai user **tanpa** `makerRole` (e.g., system_admin) → simpan → langsung ke DB
- [ ] Nonaktifkan workflow (`is_active=false`) → buka modal → simpan → langsung ke DB (bypass)
- [ ] Submit draft → approver terima notifikasi dengan workflow name + title
- [ ] Approve step 1 → advance ke step 2, notifikasi dikirim ke approver step 2
- [ ] Approve step terakhir → callback dieksekusi dalam transaksi → data masuk ke tabel modul
- [ ] Jika callback gagal → status tetap `pending`, tidak ada history approve yang tersimpan
- [ ] Reject → kembali ke draft → resubmit → approve
- [ ] Cancel di draft → status `cancelled`
- [ ] Klik notifikasi approval → buka `ApprovalDetailModal` + mark as read

---

## Modul yang Sudah Terintegrasi

| Modul | Entity Type | Actions | Callback Keys | Shared Form | View Component Key |
|---|---|---|---|---|---|
| Balance Sheet | `balance_sheet` | create, edit, delete | `handleBalanceSheetCreate`, `handleBalanceSheetEdit`, `handleBalanceSheetDelete` | `BalanceSheetForm.tsx` | `BalanceSheetApprovalForm` |

---

## Tips & Gotchas

1. **Validasi Zod WAJIB sebelum `createDraft()`** — jangan buat draft dari data yang belum valid.

2. **Pre-condition check sebelum `createDraft()`** — cek duplikasi sebelum membuat draft. Setelah draft dibuat, pembatalan harus manual via cancel.

3. **`isChecking` guard** — selalu cek `!approvalHook.isChecking` sebelum render tombol Simpan.

4. **`recheck()` saat modal dibuka** — panggil `approvalHook.recheck()` di `openModal` agar `hasWorkflow` selalu mencerminkan state terkini dari DB.

5. **Scope dari JWT, bukan dari form** — `corporateId`/`departmentId` diambil dari `accessContext` user di backend. Modul yang tidak punya field `corporateId` di form tetap bisa diintegrasikan.

6. **`requestedBy` sebagai `createdBy`** — callback menerima `requestedBy` (UUID maker) sebagai parameter ke-4. Wajib digunakan sebagai `createdBy` saat insert ke tabel yang punya `created_by NOT NULL`.

7. **Callback dalam transaksi** — final approve (step terakhir) membungkus history insert + status update + callback dalam satu transaksi. Jika callback throw, seluruh transaksi rollback — status tetap `pending`, tidak ada data corrupt.

8. **`canApprove`/`canCancel` dari backend** — `ApprovalDetailModal` membaca `detail.canApprove` dan `detail.canCancel` yang dihitung di backend berdasarkan role user. Tidak perlu cek permission di frontend.

9. **Shared form, bukan wrapper per-modul** — daftarkan via `createApprovalFormAdapter` di `formRegistry.tsx`. Tidak perlu file `XxxApprovalForm.tsx` terpisah.

10. **`workflowCatalog.ts` wajib diupdate** — saat menambah modul baru, tambahkan entry ke catalog agar muncul di dropdown `ApprovalConfigManager`.

11. **`requiredRole` dan `makerRole` adalah UUID** — bukan nama role. Gunakan `roleMap.get('role_name')!` saat seed.

12. **`system_admin` bypass approval** — karena tidak punya role `finance_staff`, `hasWorkflow = false` dan data langsung disimpan ke DB.

13. **Seed steps — FK constraint** — jangan delete steps jika sudah ada `approval_histories` yang referensi step tersebut. Gunakan pola `if (existingSteps.length === 0)`.
