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
  callbackHandler: 'handleMyEntityCreate',
  viewComponent: 'MyEntityApprovalForm',   // ← key di FORM_REGISTRY
  makerRole: financeStaffRoleId,           // ← UUID role yang boleh buat draft
  subjectFields: myModuleSubjectFields,
  createdBy: SYSTEM_ACTOR_ID,
}).onConflictDoUpdate({
  target: [approvalWorkflows.module, approvalWorkflows.entityType, approvalWorkflows.action],
  set: { name: ..., callbackHandler: ..., viewComponent: ..., makerRole: ..., subjectFields: ..., updatedBy: ..., updatedAt: new Date() },
}).returning();

await db.delete(approvalWorkflowSteps).where(eq(approvalWorkflowSteps.workflowId, workflow.id));
await db.insert(approvalWorkflowSteps).values([
  { workflowId: workflow.id, stepOrder: 1, stepType: 'approval', requiredRole: managerRoleId },
  { workflowId: workflow.id, stepOrder: 2, stepType: 'approval', requiredRole: leaderRoleId },
]);
```

**Catatan penting:**
- `makerRole` adalah **UUID role** dari tabel `roles`, bukan nama role
- `requiredRole` di steps juga **UUID role**
- Gunakan `roleMap.get('finance_staff')!` untuk mendapatkan UUID dari nama role

- [ ] Insert `approval_workflows` dengan `makerRole`
- [ ] Insert `approval_workflow_steps` dengan `requiredRole` (UUID)
- [ ] Tidak perlu tambah permission baru — akses dikontrol oleh role

### Step 2 — Daftarkan Callback Handler (Backend)

Buka `src/services/approval/approvalCallbacks.ts` dan tambahkan:

```typescript
import { myTable } from '../../db/schema';

registerCallback('handleMyEntityCreate', async (payload) => {
  await db.insert(myTable).values(payload as any);
});

registerCallback('handleMyEntityEdit', async (payload, entityId) => {
  if (!entityId) throw new Error('entityId required');
  await db.update(myTable).set(payload as any).where(eq(myTable.id, entityId));
});

registerCallback('handleMyEntityDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required');
  await db.delete(myTable).where(eq(myTable.id, entityId));
});
```

- [ ] Tambahkan `registerCallback` untuk setiap action (create/edit/delete)
- [ ] Handler hanya boleh berisi logika DB — JANGAN duplikasi logic dari route modul

### Step 3 — Buat Shared Form & Daftarkan ke Registry

#### 3a. Buat Shared Form Component

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
  // Props tambahan spesifik modul jika ada
}

export const MyEntityForm: React.FC<MyEntityFormProps> = ({
  payload, onChange, readOnly = false, language, ...
}) => {
  // Kalkulasi dihitung dari payload — pure function, tidak butuh state eksternal
  const total = (payload.fieldA ?? 0) + (payload.fieldB ?? 0);

  const isReadOnly = readOnly || !onChange;

  return (
    <div className="space-y-8">
      {/* Form fields */}
      {/* Kalkulasi/summary di footer form — BUKAN di footer modal */}
    </div>
  );
};
```

**Aturan shared form:**
- Kalkulasi (total, selisih, dll.) dihitung dari `payload` — **pure function**, tidak butuh state eksternal
- Info kalkulasi diletakkan di **footer form** (bagian bawah komponen), bukan di footer modal
- Form harus support `readOnly` dan `onChange` — dipakai di manager (editable) dan approval (read-only/editable)
- **JANGAN** berisi logic fetch data — hanya UI rendering dari `payload` prop

#### 3b. Daftarkan ke `formRegistry.tsx` — Cukup 1 Baris

Buka `src/components/financial/approval/formRegistry.tsx` dan tambahkan:

```typescript
import { MyEntityForm } from '../shared/forms/MyEntityForm';
import type { MyEntityPayload } from '../shared/forms/MyEntityForm';

export const FORM_REGISTRY: Record<string, React.ComponentType<ApprovalFormProps>> = {
  BalanceSheetApprovalForm: createApprovalFormAdapter<BalanceSheetPayload>(
    BalanceSheetForm as React.ComponentType<SharedFormProps<BalanceSheetPayload>>,
    { extraProps: { showCorporateSelector: true, corporateSelectorDisabled: true } },
  ),

  // Tambahkan modul baru di sini — TIDAK perlu file wrapper terpisah:
  MyEntityApprovalForm: createApprovalFormAdapter<MyEntityPayload>(
    MyEntityForm as React.ComponentType<SharedFormProps<MyEntityPayload>>,
    { extraProps: { showCorporateSelector: true, corporateSelectorDisabled: true } },
  ),
};
```

`createApprovalFormAdapter` adalah HOC generic yang mengkonversi `ApprovalFormProps` (dari `ApprovalDetailModal`) ke props shared form. Tidak perlu membuat file `MyEntityApprovalForm.tsx` terpisah.

**`extraProps`** adalah props tambahan yang selalu diteruskan ke shared form saat dirender di approval context. Contoh umum:
- `showCorporateSelector: true` — tampilkan selector corporate
- `corporateSelectorDisabled: true` — corporate tidak bisa diubah di approval (sudah ditentukan saat draft dibuat)

#### 3c. Gunakan Shared Form di Manager

Di `MyEntityManager.tsx`, ganti form JSX inline dengan shared form:

```typescript
import { MyEntityForm, type MyEntityPayload } from '../shared/forms/MyEntityForm';

// Di dalam modal:
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
- [ ] Kalkulasi di footer form, bukan footer modal
- [ ] Daftarkan di `formRegistry.tsx` dengan `createApprovalFormAdapter` (1 baris)
- [ ] Gunakan shared form di manager — hapus form JSX inline

### Step 4 — Integrasi di Manager Component

#### 4a. State dan Hook

```typescript
import { useApproval } from '../../../hooks/financial/useApproval';
import { ApprovalDetailModal } from '../approval/ApprovalDetailModal';
import { approvalI18n } from '../../../i18n/approval';

const [activeDraftApprovalId, setActiveDraftApprovalId] = useState<string | null>(null);

// Scope check (corporate/department) dilakukan di backend berdasarkan JWT user.
// Tidak perlu pass corporateId dari form ke hook.
const approvalCreate = useApproval('cfd', 'my_entity', 'create');
const approvalEdit   = useApproval('cfd', 'my_entity', 'edit');
const approvalDelete = useApproval('cfd', 'my_entity', 'delete');
```

#### 4b. Re-fetch saat Modal Dibuka

Panggil `recheck()` saat modal dibuka agar `hasWorkflow` selalu mencerminkan state terkini dari DB (antisipasi admin mengubah `is_active` workflow):

```typescript
const openModal = (mode: 'create' | 'edit' | 'view', item?: MyEntity) => {
  setModalMode(mode);

  // Re-fetch workflow status setiap kali modal dibuka
  if (mode === 'create') approvalCreate.recheck();
  else if (mode === 'edit') approvalEdit.recheck();

  // ... set formData ...
  setIsModalOpen(true);
};
```

#### 4c. Intercept `handleSave()` — Urutan Wajib

```typescript
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSaving) return;

  // LANGKAH 1: Validasi Zod — WAJIB sebelum cek approval
  const validation = schema.safeParse(formData);
  if (!validation.success) {
    const errors = new Set(validation.error.issues.map(i => i.message));
    errors.forEach(msg => toast.error(msg));
    return;
  }

  // LANGKAH 2: Pre-condition check bisnis (jika ada)
  if (modalMode === 'create') {
    const isDuplicate = await checkDuplicate(validation.data);
    if (isDuplicate) {
      toast.error(t.validation.duplicateEntry);
      return;
    }
  }

  // LANGKAH 3: Cek approval workflow
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

  // LANGKAH 4: Flow normal
  setIsSaving(true);
  try {
    // ... simpan langsung ke DB ...
  } finally {
    setIsSaving(false);
  }
};
```

#### 4d. Intercept `handleDelete()`

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
        // corporateId TIDAK dikirim — backend ambil dari accessContext user (JWT)
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

#### 4e. Tambahkan `ApprovalDetailModal` di JSX

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

- [ ] Tambahkan `activeDraftApprovalId` state
- [ ] Panggil `useApproval` tanpa corporateId
- [ ] Panggil `recheck()` di `openModal` untuk create dan edit
- [ ] Intercept `handleSave()` dengan urutan: Zod → pre-condition → approval check → flow normal
- [ ] Intercept `handleDelete()` dengan approval check
- [ ] Tambahkan `<ApprovalDetailModal>` di JSX

### Step 5 — Verifikasi

- [ ] `npx tsc --noEmit` — zero errors
- [ ] Login sebagai user dengan `makerRole` → simpan → draft terbuat, modal approval terbuka
- [ ] Login sebagai user **tanpa** `makerRole` (e.g., system_admin) → simpan → langsung ke DB
- [ ] Nonaktifkan workflow (`is_active=false`) → buka modal → simpan → langsung ke DB (bypass)
- [ ] Submit draft → approver terima notifikasi
- [ ] Approve semua step → callback dieksekusi → data masuk ke tabel modul
- [ ] Reject → kembali ke draft → resubmit → approve
- [ ] Cancel di draft → status `cancelled`

---

## Modul yang Sudah Terintegrasi

| Modul | Entity Type | Actions | Callback Keys | Shared Form | View Component Key |
|---|---|---|---|---|---|
| Balance Sheet | `balance_sheet` | create, edit, delete | `handleBalanceSheetCreate`, `handleBalanceSheetEdit`, `handleBalanceSheetDelete` | `BalanceSheetForm.tsx` | `BalanceSheetApprovalForm` |

---

## Tips & Gotchas

1. **Validasi Zod WAJIB sebelum `createDraft()`** — jangan buat draft dari data yang belum valid. Draft yang sudah dibuat tidak bisa dihapus otomatis jika validasi gagal setelahnya.

2. **Pre-condition check sebelum `createDraft()`** — cek duplikasi, ketersediaan data, atau kondisi bisnis lain sebelum membuat draft. Setelah draft dibuat, pembatalan harus manual via cancel.

3. **`isChecking` guard** — selalu cek `!approvalHook.isChecking` sebelum render tombol Simpan. Saat `isChecking = true`, tombol harus disabled untuk menghindari race condition.

4. **`recheck()` saat modal dibuka** — panggil `approvalHook.recheck()` di `openModal` agar `hasWorkflow` selalu mencerminkan state terkini. Ini mencegah stale cache saat admin mengubah `is_active` workflow di DB.

5. **Scope check dari JWT, bukan dari form** — `corporateId`/`departmentId` diambil dari `accessContext` user di backend, bukan dari konten form. Ini memastikan scope selalu berdasarkan identitas user, bukan input form — sehingga modul yang tidak punya field `corporateId` tetap bisa diintegrasikan.

6. **Shared form, bukan wrapper per-modul** — buat shared form di `src/components/financial/shared/forms/` dan daftarkan via `createApprovalFormAdapter` di `formRegistry.tsx`. Tidak perlu file `XxxApprovalForm.tsx` terpisah.

7. **Kalkulasi di footer form** — info kalkulasi (total, selisih, dll.) diletakkan di dalam shared form (footer form), bukan di footer modal. Ini memastikan kalkulasi tampil konsisten di manager maupun di approval detail modal.

8. **`requiredRole` dan `makerRole` adalah UUID** — bukan nama role. Selalu gunakan `roleMap.get('role_name')!` saat seed.

9. **`system_admin` bypass approval** — karena `system_admin` tidak punya role `finance_staff` di `user_corporate_accesses`, `hasWorkflow` akan `false` dan data langsung disimpan ke DB.

10. **Callback dipanggil setelah step terakhir disetujui** — jangan lakukan mutasi DB di luar callback untuk data yang memerlukan approval.
