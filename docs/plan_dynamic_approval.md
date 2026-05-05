# Dynamic Approval Module — Implementation Plan (Rev. 3)

## Background & Tujuan

Membuat sistem approval yang dinamis dan reusable untuk semua modul yang memerlukan workflow persetujuan.
Konfigurasi workflow disimpan di database (`approval_workflows` + `approval_workflow_steps`), sehingga
penambahan workflow baru hanya perlu konfigurasi data — tanpa ubah kode backend/frontend.

---

## Keputusan Desain Final

| # | Topik | Keputusan |
|---|---|---|
| 1 | **view_component** | Disimpan di database (`approval_workflows.view_component`), dipetakan ke komponen React di `formRegistry.tsx` |
| 2 | **Status lifecycle** | `draft → pending → approved / rejected(→draft) / cancelled` |
| 3 | **Draft flow UX** | **Opsi B** — Modal ditutup, otomatis buka `ApprovalDetailModal` dengan data draft |
| 4 | **Notifikasi approver** | Kirim ke semua user dengan role yang diperlukan di scope yang sama. Jika sudah ada yang approve, user lain tetap bisa lihat di monitoring tapi tidak bisa approve (tombol disabled/hilang). |
| 5 | **Cancel** | Maker & admin. Hanya di status `draft`. Jika `pending`, harus di-reject dulu baru cancel. |
| 6 | **subject recompute** | Ya, dihitung ulang setiap kali maker resubmit. |
| 7 | **PoC modul** | **Neraca (Balance Sheet)** — aksi `create`, `edit`, dan `delete` |
| 8 | **Hook name** | `useApproval` (bukan `useApprovalWorkflow`) |
| 9 | **URL approval config** | `/api/approval-configs` |
| 10 | **Permission create/submit** | Dikendalikan oleh **role check via step** (bukan just "authenticated" atau "owner only") |
| 11 | **File upload** | **Single multipart POST ke `/api/approvals`** — backend atomik handle: simpan file ke staging + buat record approval. Frontend tidak upload file secara terpisah. |

---

## Proposed Changes

---

### Phase 1 — Database Schema

#### [MODIFY] [public.ts](file:///d:/Projects/Financial%20Dashboard/source-code/src/db/schema/public.ts)

**`approval_workflows`** — Tambah `view_component` & `subject_fields`:
```typescript
viewComponent: varchar('view_component', { length: 100 }).notNull(),
// Key string → dipetakan ke komponen React di formRegistry.tsx
// Contoh: 'BalanceSheetApprovalForm', 'CorporateApprovalForm'

subjectFields: jsonb('subject_fields')
  .$type<Array<{
    field: string;   // key di payload (dot-notation: "corporate.name")
    label: string;   // label di monitoring
    type: 'string' | 'currency' | 'date' | 'number';
  }>>()
  .notNull()
  .default([]),
```

**`approvals`** — Hapus redundant fields, rename, tambah baru:
```typescript
// HAPUS:
// module, entityType, metadata

// GANTI / TAMBAH:
originalData: jsonb('original_data'),
// Data eksisting sebelum diubah (hanya untuk action='edit').

subject: jsonb().notNull().default({}),
// Nilai yang di-extract dari payload sesuai subjectFields.
// Di-recompute ulang setiap kali maker submit / resubmit.

title: varchar({ length: 255 }),
// String ringkas untuk text search. Auto-generated dari subject values.
// Contoh: "Neraca - PT Maju - Mar 2025"

// Status values: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'
// Default diubah dari 'pending' → 'draft'
```

**`approvals`** — Tambah index untuk performa monitoring:
```sql
CREATE INDEX idx_approvals_title ON approvals USING btree(title);
CREATE INDEX idx_approvals_subject ON approvals USING gin(subject);
CREATE INDEX idx_approvals_workflow_status ON approvals(workflow_id, status);
```

**`approval_histories`** — Tambah field `payload`:
```typescript
payload: jsonb(),
// Snapshot payload saat action='submit' atau 'resubmit'. NULL untuk approve/reject/cancel.
```

**`attachments`** — Tambah field `status` untuk staging mechanism:
```typescript
// TAMBAH field baru:
status: varchar({ length: 20 }).notNull().default('active'),
// 'staging' = file sementara dalam proses approval
// 'active'  = file sudah resmi (post-approve atau non-approval)
// 'orphaned' = approval di-cancel, file menunggu cleanup

approvalId: uuid('approval_id').references(() => approvals.id),
// NULL untuk file di luar alur approval. Diisi saat upload melalui approval.
```

---

#### [NEW] Drizzle Migration
```bash
npx drizzle-kit generate  # Generate migration file
npx tsx scripts/migrate.ts  # Apply ke database
```

---

### Phase 2 — Backend: Approval Engine

#### [NEW] `src/services/approval/approvalEngine.ts`

```typescript
// Lifecycle functions:

createDraft(params: {
  workflowKey: string;   // module + entityType + action
  entityId?: string;     // ID data existing (hanya untuk action='edit' atau 'delete')
  payload: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  stagingFileIds?: string[];  // IDs dari attachments table dengan status='staging'
  requestedBy: string;
  departmentId?: string;
  corporateId?: string;
}): Promise<Approval>
// → Lookup workflow, buat record approvals (status='draft'), hitung subject+title

submitDraft(approvalId: string, payload: Record<string, unknown>, requestedBy: string): Promise<Approval>
// → Validasi ownership & role via step, update payload+subject+title, set status='pending',
//   set currentStepId, catat ke approval_histories (action='submit', payload snapshot),
//   kirim notifikasi ke approver(s)

processApprove(approvalId: string, actedBy: string, comments?: string): Promise<Approval>
// → Validasi role actedBy sesuai step aktif, cek deduplikasi (belum ada yang approve step ini),
//   catat history (action='approve'), advance ke step berikutnya ATAU finalize:
//   jika finalize: invoke callback, finalize staging files

processReject(approvalId: string, actedBy: string, comments: string): Promise<Approval>
// → Validasi role, catat history (action='reject'), set status='draft' (kembali ke maker),
//   kirim notifikasi ke maker

cancelApproval(approvalId: string, cancelledBy: string, notes: string): Promise<void>
// → Hanya status='draft'. Set status='cancelled', catat history,
//   cleanup staging files (set status='orphaned', schedule deletion)

_buildSubjectAndTitle(workflow, payload): { subject: object; title: string }
_invokeCallback(approvalId): Promise<void>
_finalizeStagingFiles(approvalId: string, entityId: string): Promise<void>
// → Pindah file dari staging ke permanent (lihat Phase: File Upload)
```

#### [NEW] `src/services/approval/callbackRegistry.ts`

```typescript
type CallbackFn = (
  payload: Record<string, unknown>,
  entityId?: string,
  stagedFiles?: StagedFile[]   // File yang sudah dipindah ke permanent
) => Promise<void>;

const registry = new Map<string, CallbackFn>();
export const registerCallback = (key: string, fn: CallbackFn) => registry.set(key, fn);
export const invokeCallback = (key: string, payload, entityId?, stagedFiles?) => { ... };
```

#### [NEW] `src/services/approval/approvalFileService.ts`

Service khusus untuk mengelola lifecycle file dalam approval:

```typescript
// uploadStagingFile(approvalId, file, uploadedBy): Promise<StagedAttachment>
// → Simpan file ke `uploads/approval-staging/{approvalId}/`
// → Buat record di tabel attachments dengan status='staging', approvalId diisi

// finalizeStagingFiles(approvalId, targetEntityType, targetEntityId): Promise<StagedFile[]>
// → Pindah file dari staging ke direktori permanent modul tujuan
//   (misal: assets/cash-realizations/{entityId}/)
// → Update record attachments: status='active', entityType=targetEntityType, entityId=targetEntityId
// → Return array info file yang sudah dipindah (untuk dikirim ke callback)

// cleanupStagingFiles(approvalId): Promise<void>
// → Saat cancel: set attachment status='orphaned'
// → Hapus file fisik dari disk (atau scheduled job)

// getStagingFiles(approvalId): Promise<StagedAttachment[]>
// → Untuk ditampilkan di form draft agar maker bisa hapus/tambah file
```

#### [NEW] `src/services/approval/approvalNotificationService.ts`

```typescript
// notifyApprovers(approvalId, stepId): void
// → Cari semua user dengan requiredRole di scope (corporate/dept) yang sama
// → Kirim ke tabel notifications (template: 'approval.pending_review')
// → Deduplikasi: jika step ini sudah pernah di-approve, skip kirim notif

// notifyMaker(approvalId, action: 'approved'|'rejected'|'cancelled'): void
// → Kirim ke requestedBy
```

#### [NEW] `src/services/approval/approvalCallbacks.ts`

Registrasi semua callback handlers (mulai PoC Balance Sheet):
```typescript
registerCallback('handleBalanceSheetCreate', async (payload, _entityId) => {
  await db.insert(balanceSheets).values(payload as any);
});

registerCallback('handleBalanceSheetEdit', async (payload, entityId) => {
  await db.update(balanceSheets).set(payload as any).where(eq(balanceSheets.id, entityId!));
});

registerCallback('handleBalanceSheetDelete', async (_payload, entityId) => {
  await db.delete(balanceSheets).where(eq(balanceSheets.id, entityId!));
});

// Contoh modul dengan file (masa depan):
registerCallback('handleCashRealizationCreate', async (payload, _entityId, stagedFiles) => {
  const res = await db.insert(cashRealizations).values(payload as any).returning();
  // stagedFiles sudah dipindah ke permanent oleh engine sebelum callback dipanggil
  // callback hanya menerima info file final untuk disimpan ke DB relasi jika perlu
});
```

---

#### [NEW] `src/routes/financial/approvals.ts`

| Method | Path | Deskripsi | Content-Type | Auth |
|---|---|---|---|---|
| `GET` | `/api/approvals` | List monitoring (filter: status, modul, period, corporate, requester) | — | `approvals.read` |
| `GET` | `/api/approvals/:id` | Detail: payload + histories + original_data + staged files | — | `approvals.read` |
| `POST` | `/api/approvals` | Buat draft baru. File (jika ada) dikirim sekaligus satu request | `multipart/form-data` | Role check via step |
| `POST` | `/api/approvals/:id/submit` | Submit / resubmit ke approver. Payload + file baru (jika ada) dikirim sekaligus | `multipart/form-data` | Role check via step |
| `POST` | `/api/approvals/:id/approve` | Setujui permohonan | `application/json` | Role check via current step |
| `POST` | `/api/approvals/:id/reject` | Tolak (wajib isi `notes`) | `application/json` | Role check via current step |
| `POST` | `/api/approvals/:id/cancel` | Batalkan (wajib isi `notes`, hanya status `draft`) | `application/json` | Owner / Admin |

> [!NOTE]
> Endpoint `POST /api/approvals` dan `POST /api/approvals/:id/submit` menerima `multipart/form-data`.
> Field JSON (payload, workflowId, entityId, dll.) dikirim sebagai form field string.
> File attachment dikirim sebagai file field (bisa multiple).
> Jika modul tidak memiliki file, frontend cukup kirim `application/json` seperti biasa — backend detect Content-Type dan handle keduanya.

#### [NEW] `src/routes/financial/approvalConfigs.ts`

| Method | Path | Deskripsi | Permission |
|---|---|---|---|
| `GET` | `/api/approval-configs` | List semua workflow + steps | `public.approval_configs.read` |
| `GET` | `/api/approval-configs/:id` | Detail workflow + steps | `public.approval_configs.read` |
| `POST` | `/api/approval-configs` | Buat workflow baru + steps | `public.approval_configs.write` |
| `PUT` | `/api/approval-configs/:id` | Update workflow + steps | `public.approval_configs.write` |
| `DELETE`| `/api/approval-configs/:id` | Hapus workflow | `public.approval_configs.delete` |

#### [MODIFY] `src/routes/financial/index.ts`

```typescript
router.use('/approvals', createApprovalsRouter());
router.use('/approval-configs', createApprovalConfigsRouter());
```

---

### Phase 2b — Mekanisme File Upload (Staging)

> [!IMPORTANT]
> Ini adalah desain inti untuk modul yang memiliki attachment. Tujuannya agar **tidak perlu mengubah
> logic upload di modul asal** — callback handler menerima info file yang sudah siap.

#### Alur Lengkap File Upload dalam Approval

```
[1] CREATE DRAFT (dengan atau tanpa file)
    Frontend → POST /api/approvals  (multipart/form-data)
                 field: workflowId, entityId?, payload (JSON string), originalData?
                 files: file[] (opsional, untuk modul yang punya attachment)

    Backend  → ATOMIK dalam satu transaksi:
                 a. Parse form fields, extract payload
                 b. Simpan file ke: uploads/approval-staging/{newApprovalId}/{uuid}-{filename}
                 c. INSERT approvals (status='draft', ...)
                 d. INSERT attachments per file (status='staging', approvalId=newApprovalId)
                 e. Inject _stagedFileIds ke payload yang disimpan

    Response → { approvalId, status: 'draft', stagedFiles: [...] }

[2] SUBMIT (termasuk resubmit setelah reject)
    Frontend → POST /api/approvals/:id/submit  (multipart/form-data)
                 field: payload (JSON string, data terbaru)
                 files: file[] baru (opsional, jika maker ganti file saat revisi)

    Backend  → ATOMIK:
                 a. Hapus staging files lama yang tidak dipertahankan (sesuai _removedFileIds)
                 b. Simpan file baru ke staging
                 c. Recompute subject + title dari payload baru
                 d. Update approvals (status='pending', currentStepId)
                 e. INSERT approval_histories (action='submit', payload snapshot + _stagedFileIds)
                 f. Kirim notifikasi ke approver(s)

[3] APPROVE (final step)
    Engine calls: _finalizeStagingFiles(approvalId, targetEntityType, entityId?)
    → Pindah file: approval-staging/{approvalId}/ → assets/{modul}/{entityId}/
    → UPDATE attachments: status='active', entityType=targetEntityType, entityId=entityId
    → Return: StagedFile[] = [{ attachmentId, finalPath, fileName, ... }]

    Engine calls: invokeCallback(handler, payload, entityId, stagedFiles)
    → Callback hanya perlu INSERT/UPDATE data modul + link stagedFiles jika perlu

[4] CANCEL (dari status draft)
    Engine calls: cleanupStagingFiles(approvalId)
    → UPDATE attachments SET status='orphaned'
    → DELETE file fisik dari disk (atau scheduled cleanup job)
```

#### Keuntungan Pendekatan Ini

| Aspek | Detail |
|---|---|
| **Zero change di modul backend** | Route modul (mis. `/api/financial-statements/balance-sheet`) tidak berubah |
| **Callback handler sederhana** | Hanya terima `stagedFiles` array, tidak perlu handle upload sendiri |
| **File terisolasi per approval** | Tidak ada file "zombie" yang sudah tersimpan tapi data approval-nya cancel |
| **Reusable untuk semua modul** | `approvalFileService` generik, tidak tahu soal modul spesifik |
| **Kompatibel dengan `attachments` table** | Menggunakan field `status` & `approvalId` baru (satu migration) |

#### Direktori Struktur File

```
uploads/
  approval-staging/
    {approvalId-1}/
      abc123-dokumen.pdf
      def456-foto.jpg
  assets/
    corporate-logos/          ← permanent (existing)
    cash-realizations/        ← permanent (existing)
      {entityId}/
        abc123-dokumen.pdf    ← setelah finalize
```

---

### Phase 3 — Frontend: Monitoring & Detail

#### [NEW] `src/components/financial/approval/ApprovalMonitor.tsx`

Datatables monitoring semua approval:
- **Filter:** Status, Modul/Entity Type, Corporate, Requester, Periode.
- **Kolom:** No. | Judul (`title`) | Modul | Pemohon | Step Saat Ini | Status | Tanggal | Aksi.
- **Status Badge:** `draft`=slate, `pending`=amber, `approved`=emerald, `rejected`=rose, `cancelled`=slate-opaque.
- **Badge "Menunggu Aksi Saya"** di baris yang memerlukan aksi dari user login.
- **Aksi per baris:** View (semua) | Approve/Reject (approver step aktif saja) | Cancel (maker, status draft).

#### [NEW] `src/components/financial/approval/ApprovalDetailModal.tsx`

Modal dengan **3 Tab** (+ sub-tab untuk action='edit'):

**Tab 1: Form Data**
- Render komponen dari `FORM_REGISTRY[workflow.viewComponent]`.
- **Editable** hanya di status `draft` + owner.
- **Read-only** di status `pending`/`approved`/`cancelled`.
- Jika ada staging files: tampilkan daftar file (download + hapus saat draft).
- Khusus `action='edit'`: sub-tab **"Data Permohonan"** vs **"Data Awal"** (dari `original_data`).
- **Action Bar** kondisional:
  - `draft` + owner: **Submit Permohonan**, **Batalkan**
  - `pending` + approver role: **Setujui**, **Tolak** (modal komentar wajib)
  - `approved/cancelled`: hanya view

**Tab 2: Riwayat Approval** (`approval_histories`)
- Timeline vertikal: `created` → `submit` → `approve`/`reject` → ...
- Info per event: avatar + nama, badge aksi, komentar, timestamp.
- Multi-siklus: Siklus ke-1 (submit → reject) | Siklus ke-2 (resubmit → approve).

**Tab 3: Riwayat Perubahan Data**
- Daftar semua history dengan `payload != null` (action='submit'/'resubmit').
- Kolom: Versi | Disubmit oleh | Tanggal | **Lihat**.
- Klik **Lihat**: buka sub-modal diff visual antara versi ini vs versi sebelumnya.

#### [NEW] `src/components/financial/approval/formRegistry.tsx`

```typescript
export interface ApprovalFormProps {
  payload: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  onChange?: (field: string, value: unknown) => void;
  // File handling: form component hanya mengumpulkan File objects.
  // Upload aktual dilakukan satu kali saat submit form approval (bukan per-file).
  onFilesChange?: (files: File[]) => void;     // untuk tambah/hapus file di form
  stagedFiles?: StagedAttachment[];            // file yang sudah di-staging (tampilan saja)
  onStagedFileRemove?: (attachmentId: string) => void;  // tandai file staging untuk dihapus
  readOnly: boolean;
  language: 'id' | 'en';
}

export const FORM_REGISTRY: Record<string, React.ComponentType<ApprovalFormProps>> = {
  'BalanceSheetApprovalForm': BalanceSheetApprovalForm,
  // Tambahkan seiring onboarding modul baru
};
```

> [!NOTE]
> Props `onFileUpload`, `onFileDelete`, dan `stagedFiles` hanya digunakan oleh form yang
> memiliki attachment. Form tanpa file (seperti BalanceSheet) cukup abaikan props tersebut.

#### [NEW] `src/components/financial/approval/BalanceSheetApprovalForm.tsx`

Form view neraca untuk konteks approval (PoC):
- Di-extract dari `BalanceSheetManager.tsx` bagian form JSX.
- Mendukung mode `readOnly` dan `editable`.
- Di-reuse oleh `BalanceSheetManager` (modal biasa) DAN `formRegistry` (approval).

---

#### [MODIFY] `src/components/financial/FRSApp.tsx`

```typescript
const ApprovalMonitor = lazy(() => import('./approval/ApprovalMonitor')...);

// Di renderPage():
case 'approval-monitor': return <ApprovalMonitor />;
```

#### [MODIFY] `src/components/financial/dashboard/DashboardLayout.tsx`

Tambah menu **"Monitoring Approval"** di grup **Pengelolaan & Monitoring Sistem**.
Tambah menu **"Konfigurasi Approval"** (hanya untuk role dengan `approval_configs.read`).

---

### Phase 4 — i18n

#### [NEW] `src/i18n/approval.ts`

Label status, tab, tombol aksi, pesan toast, label timeline, pesan error.

#### [MODIFY] `src/i18n/commons.ts`

Tambahkan: `approve`, `reject`, `resubmit`, `submitRequest`, `approvalHistory`, `dataHistory`,
`originalData`, `comparedData`, `stagingFiles`.

---

### Phase 5 — PoC: Integrasi Balance Sheet (Neraca)

Balance Sheet tidak menggunakan file upload, jadi ini adalah PoC yang paling clean untuk
memvalidasi core engine tanpa kompleksitas staging.

#### [MODIFY] `src/components/financial/data-entry/BalanceSheetManager.tsx`

```typescript
// 1. Gunakan hook useApproval
const { hasWorkflow } = useApproval('cfd', 'balance_sheet', modalMode === 'edit' ? 'edit' : 'create');

// 2. Intercept handleSave()
const handleSave = async (e) => {
  // ...validasi Zod (tidak berubah)...

  if (hasWorkflow) {
    // Buat draft, tutup modal, buka ApprovalDetailModal
    const draft = await createApprovalDraft({ payload: validation.data, originalData: existingItem });
    setIsModalOpen(false);
    setActiveDraftApprovalId(draft.id);  // trigger ApprovalDetailModal
  } else {
    // Flow normal (tidak berubah)
    await apiFetch(url, { method, body: JSON.stringify(validation.data) });
  }
};

// 3. Intercept handleDelete() untuk action='delete'
const handleDelete = async (id) => {
  if (hasWorkflowDelete) {
    // Buat draft approval dengan action='delete', entityId=id
    const draft = await createApprovalDraft({ action: 'delete', entityId: id, payload: existingData });
    setActiveDraftApprovalId(draft.id);
  } else {
    // Flow normal delete (tidak berubah)
  }
};
```

#### [NEW] `src/hooks/financial/useApproval.ts`

```typescript
export function useApproval(module: string, entityType: string, action: string) {
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    apiFetch(`/api/approval-configs?module=${module}&entityType=${entityType}&action=${action}&activeOnly=true`)
      .then(res => res.json())
      .then(data => setWorkflow(data.record ?? null))
      .finally(() => setIsChecking(false));
  }, [module, entityType, action]);

  const createDraft = async (params: {
    payload: Record<string, unknown>;
    entityId?: string;
    originalData?: Record<string, unknown>;
    files?: File[];   // opsional, untuk modul dengan attachment
  }) => {
    const formData = new FormData();
    formData.append('workflowId', workflow!.id);
    formData.append('payload', JSON.stringify(params.payload));
    if (params.entityId) formData.append('entityId', params.entityId);
    if (params.originalData) formData.append('originalData', JSON.stringify(params.originalData));
    params.files?.forEach(f => formData.append('files', f));

    const res = await apiFetch('/api/approvals', { method: 'POST', body: formData });
    // Tidak set Content-Type header — browser auto set multipart boundary
    return res.json();
  };

  const submitDraft = async (approvalId: string, params: {
    payload: Record<string, unknown>;
    files?: File[];
    removedFileIds?: string[];
  }) => {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(params.payload));
    if (params.removedFileIds) formData.append('removedFileIds', JSON.stringify(params.removedFileIds));
    params.files?.forEach(f => formData.append('files', f));

    const res = await apiFetch(`/api/approvals/${approvalId}/submit`, { method: 'POST', body: formData });
    return res.json();
  };

  return { workflow, hasWorkflow: !!workflow?.isActive, isChecking, createDraft, submitDraft };
}
```

---

## Alur Integrasi untuk Modul Baru (Template)

Setelah PoC selesai, setiap modul baru yang ingin diintegrasikan mengikuti template ini:

### Backend (±30 menit)
1. Tambah entry di `approvalCallbacks.ts` (3-5 baris per action).
2. Tambah seed data di `seed-public.ts` untuk workflow config + steps.
3. Jika ada file: callback hanya perlu link `stagedFiles` ke entity — tidak handle upload sendiri.

### Frontend (±1.5-2 jam)
1. Extract form JSX dari manager menjadi `XxxApprovalForm.tsx`.
2. Daftarkan di `formRegistry.tsx` (1 baris).
3. Di manager: import `useApproval`, intercept `handleSave()` / `handleDelete()`.
4. Opsional: tambah badge pending di baris tabel.

### Database (±15 menit)
1. Insert ke `approval_workflows` + `approval_workflow_steps`.
2. Insert permission ke `permissions` jika belum ada.

> [!TIP]
> Tidak ada perubahan pada backend route modul (mis. `/api/financial-statements/balance-sheet`).
> Engine memanggil callback yang memanggil service/DB langsung.
> Modul tanpa approval workflow tetap berjalan normal — hook `useApproval` hanya skip jika tidak ada workflow aktif.

---

## Verification Plan

### Automated
- `npx tsc --noEmit`
- `npx drizzle-kit check`

### Manual E2E (PoC Balance Sheet)
1. **Draft → Submit → Approve 2 Step**: Data neraca tersimpan di DB, histories lengkap.
2. **Draft → Submit → Reject → Resubmit → Approve**: Tab Riwayat Perubahan menampilkan 2 versi payload.
3. **Cancel di Draft**: Status `cancelled`, staging files dihapus (jika ada).
4. **Attempt Cancel di Pending**: Error toast dengan instruksi reject dahulu.
5. **Delete via Approval**: Draft delete dikirim ke approver → final approve → data dihapus via callback.
6. **Deduplikasi Approve**: User ke-2 dengan role yang sama tidak bisa approve setelah user ke-1 approve.
7. **Notifikasi**: Approver terima notif saat submit. Maker terima notif saat approve/reject.
8. **No Workflow**: Jika workflow dinonaktifkan di approval-configs, Neraca kembali ke flow normal.
9. **subject recompute**: Setelah resubmit, kolom `title` & `subject` di tabel `approvals` diperbarui.

### File Upload (Test pada modul berikutnya yang punya file)
10. Upload file di draft → staging folder terisi, record `attachments` status='staging'.
11. Final approve → file pindah ke permanent, status='active', entityId diisi.
12. Cancel draft → file dihapus dari disk, status='orphaned'.

---

### Phase 6 — Dokumentasi

> [!IMPORTANT]
> Dokumentasi dikerjakan **bersamaan atau segera setelah** Phase 5 selesai.
> Ini wajib agar modul-modul berikutnya bisa diintegrasikan tanpa perlu baca kode engine.

#### [NEW] `docs/modules/approval-system.md`

Dokumentasi arsitektur sistem approval untuk developer:

- **Gambaran Umum**: Flow lifecycle status (`draft → pending → approved/rejected/cancelled`).
- **Komponen Backend**: Deskripsi `approvalEngine`, `callbackRegistry`, `approvalFileService`, `approvalNotificationService`.
- **Konfigurasi Database**: Cara setup `approval_workflows` + `approval_workflow_steps` untuk modul baru (dengan contoh data SQL/seed).
- **File Upload Staging**: Penjelasan mekanisme staging → finalize → cleanup.
- **Deduplikasi & Notifikasi**: Logika siapa yang bisa approve dan kapan notif dikirim.
- **Contoh Callback Handler**: Template kode untuk modul tanpa file dan modul dengan file.

#### [NEW] `docs/guides/integrating-approval.md`

Panduan langkah-demi-langkah untuk developer yang ingin mengintegrasikan modul baru:

```markdown
## Checklist Integrasi Modul dengan Approval

### Step 1 — Seed Konfigurasi Workflow (Database)
- [ ] Insert `approval_workflows` record (module, entityType, action, callbackHandler, viewComponent, subjectFields)
- [ ] Insert `approval_workflow_steps` records (urutan step, requiredRole, label)
- [ ] Insert permission baru jika diperlukan

### Step 2 — Daftarkan Callback Handler (Backend)
- [ ] Buka `src/services/approval/approvalCallbacks.ts`
- [ ] Tambahkan `registerCallback('handlerKey', async (payload, entityId, stagedFiles) => { ... })`
- [ ] Pastikan handler memanggil service/DB yang sudah ada — JANGAN duplikasi logic

### Step 3 — Extract Form Component (Frontend)
- [ ] Buat `src/components/financial/approval/{ModuleName}ApprovalForm.tsx`
- [ ] Extract JSX form dari manager — form harus support prop `readOnly` dan `onChange`
- [ ] Daftarkan di `formRegistry.tsx`: `'KeyName': ModuleNameApprovalForm`

### Step 4 — Integrasi di Manager Component
- [ ] Import `useApproval` hook
- [ ] Panggil `useApproval(module, entityType, action)` sesuai aksi yang butuh approval
- [ ] Intercept `handleSave()`: jika `hasWorkflow`, panggil `createDraft()` → buka `ApprovalDetailModal`
- [ ] Intercept `handleDelete()`: jika `hasWorkflowDelete`, panggil `createDraft({ action: 'delete', entityId })`
- [ ] Jika modul punya file upload: kirim `files` ke `createDraft()` — TIDAK upload manual

### Step 5 — Verifikasi
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Test: create → submit → approve → data tersimpan di DB
- [ ] Test: reject → resubmit → approve
- [ ] Test: cancel di draft
- [ ] Test: toggle `isActive=false` di approval-configs → module kembali ke flow normal
```

#### [MODIFY] `docs/database/schema.md`

Tambahkan deskripsi field baru:
- `approval_workflows`: tambah `view_component`, `subject_fields`
- `approvals`: dokumentasikan `original_data`, `subject`, `title`, perubahan status lifecycle
- `approval_histories`: tambah `payload`
- `attachments`: tambah `status`, `approval_id`

#### [MODIFY] `AGENTS.md`

Tambahkan **Section 6 — Approval Integration Rules** (setelah section yang ada):

```markdown
## 6. Aturan Integrasi Approval Module

### 6.1 Wajib Gunakan Engine
- **Dilarang** memanggil langsung DB insert/update di backend jika modul tersebut terdaftar
  di `approval_workflows`. Semua mutasi data harus melalui `approvalEngine` → `callbackRegistry`.
- **Dilarang** membuat endpoint approval ad-hoc di route modul. Semua approval via `/api/approvals/*`.

### 6.2 Callback Handler
- Setiap handler **wajib** didaftarkan di `src/services/approval/approvalCallbacks.ts`.
- Handler hanya boleh berisi logika DB yang sudah ada di service/route modul — JANGAN duplikasi.
- Handler untuk modul dengan file: terima `stagedFiles[]` dari engine, JANGAN upload manual.

### 6.3 Frontend Form
- Setiap modul yang terintegrasi **wajib** punya `XxxApprovalForm.tsx` sebagai komponen terpisah.
- Form harus mendukung prop `readOnly: boolean` — dipakai di ApprovalDetailModal (view-only) dan draft (editable).
- Form **tidak boleh** berisi logic fetch data — hanya UI rendering dari `payload` prop yang diberikan.
- Daftarkan di `formRegistry.tsx` dengan key yang sama dengan `view_component` di database.

### 6.4 Hook useApproval
- Gunakan `useApproval(module, entityType, action)` di setiap manager yang butuh approval.
- Selalu check `isChecking` sebelum render tombol Simpan — agar tidak race condition.
- Jika `hasWorkflow = false`, JANGAN ubah flow normal — biarkan berjalan seperti sebelum integrasi.

### 6.5 File Upload
- Frontend **tidak boleh** upload file secara terpisah (tidak ada `POST /api/approvals/:id/files`).
- File harus dikirim sebagai bagian dari `createDraft()` atau `submitDraft()` via `FormData`.
- Backend yang bertanggung jawab menyimpan ke staging — frontend hanya kirim `File[]`.

### 6.6 Dokumentasi Wajib
- Setiap modul baru yang terintegrasi **wajib** update `docs/guides/integrating-approval.md`
  dengan catatan spesifik modul (callback key, viewComponent key, subjectFields yang dipakai).
- Update `docs/database/schema.md` jika ada perubahan schema.
```

---

## Estimasi

| Phase | Estimasi |
|---|---|
| Phase 1 — Schema + Migration | ~2 jam |
| Phase 2 — Backend Engine + File Service + API | ~6 jam |
| Phase 3 — Frontend Monitor + Detail + Registry | ~7 jam |
| Phase 4 — i18n | ~1 jam |
| Phase 5 — PoC Balance Sheet | ~3 jam |
| Phase 6 — Dokumentasi + AGENTS.md | ~1.5 jam |
| **Total** | **~20.5 jam** |

> Per modul tambahan setelah PoC (tanpa file): ~2 jam.
> Per modul tambahan dengan file: ~3 jam.
