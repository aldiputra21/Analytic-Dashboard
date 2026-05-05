# Dynamic Approval System — Architecture Documentation

## Gambaran Umum

Sistem approval dinamis memungkinkan workflow persetujuan yang dapat dikonfigurasi per modul tanpa perubahan kode. Konfigurasi disimpan di database (`approval_workflows` + `approval_workflow_steps`), sehingga penambahan workflow baru hanya memerlukan konfigurasi data.

### Status Lifecycle

```
draft → pending → approved
                ↘ rejected → (kembali ke draft, maker bisa resubmit)
        ↘ cancelled (hanya dari draft)
```

| Status | Deskripsi |
|---|---|
| `draft` | Dibuat oleh maker, belum diajukan |
| `pending` | Sudah diajukan, menunggu persetujuan approver |
| `approved` | Disetujui semua step, callback dieksekusi |
| `rejected` | Ditolak approver, kembali ke draft untuk revisi |
| `cancelled` | Dibatalkan maker (hanya dari status draft) |

---

## Model Permission

Approval **tidak menggunakan permission key** untuk kontrol akses mutasi data. Model ini berbeda dari modul lain.

| Kebutuhan | Mekanisme |
|---|---|
| Tampilkan menu "Monitoring Approval" | Permission `approvals.read` |
| Tampilkan menu "Konfigurasi Approval" | Permission `public.approval_configs.read` |
| Buat draft / submit / cancel | Role check via `approval_workflows.maker_role` + scope |
| Approve / reject step | Role check via `approval_workflow_steps.required_role` + scope |
| Kelola konfigurasi workflow | Permission `public.approval_configs.write` / `.delete` |

Permission `public.approvals.write` dan `public.approvals.approve` **tidak ada** di sistem ini.

### Scope Check

Setiap role check mempertimbangkan scope `user_corporate_accesses`:
- `system` scope → akses ke semua corporate/department
- `corporate` scope → hanya corporate yang sesuai
- `department` scope → hanya department yang sesuai (dan corporate induknya)

Scope diambil dari `accessContext` user di JWT — **bukan dari konten form**. Ini memastikan scope selalu berdasarkan identitas user, sehingga modul yang tidak punya field `corporateId` di form tetap bisa diintegrasikan.

### Bypass Approval

Jika user **tidak punya** `makerRole` yang sesuai (e.g., `system_admin` tidak punya role `finance_staff`), `useApproval` hook akan set `hasWorkflow = false` dan data langsung disimpan ke DB tanpa melalui approval.

---

## Komponen Backend

### `src/services/approval/approvalEngine.ts`

Core lifecycle engine. Semua transisi status approval melewati file ini.

| Fungsi | Deskripsi |
|---|---|
| `createDraft(params)` | Buat record approval baru (status `draft`). Verifikasi `makerRole` + scope. Hitung `subject` + `title`. |
| `submitDraft(params)` | Submit draft ke approver pertama. Re-verifikasi `makerRole` + scope. Set status `pending`, catat history, kirim notifikasi. |
| `processApprove(id, actedBy, comments?)` | Setujui step aktif. Verifikasi `requiredRole` + scope. Jika step terakhir: finalize + invoke callback dalam transaksi. |
| `processReject(id, actedBy, comments)` | Tolak step aktif. Verifikasi `requiredRole` + scope. Set status kembali ke `draft`. |
| `cancelApproval(id, cancelledBy, notes)` | Batalkan approval (hanya dari `draft`). Verifikasi ownership + `makerRole`. |
| `canUserCreateDraft(userId, module, entityType, action, corporateId?, departmentId?)` | Cek apakah user punya `makerRole` untuk workflow ini di scope yang sesuai. Dipakai oleh `useApproval` hook. |
| `getApprovalDetail(id)` | Ambil detail approval beserta workflow, steps, histories, `canApprove`, dan `canCancel`. |

### `src/services/approval/callbackRegistry.ts`

Registry untuk callback handler. Signature lengkap:

```typescript
type CallbackFn = (
  payload: Record<string, unknown>,
  entityId?: string,
  stagedFiles?: StagedFile[],
  requestedBy?: string,   // UUID maker — gunakan sebagai createdBy/updatedBy
) => Promise<void>;
```

### `src/services/approval/approvalCallbacks.ts`

File registrasi semua callback handler. **Wajib diimport di `server.ts`** agar handler terdaftar saat startup.

Handler yang sudah terdaftar:
- `handleBalanceSheetCreate` — INSERT ke `balance_sheets` dengan `createdBy = requestedBy`
- `handleBalanceSheetEdit` — UPDATE `balance_sheets` by `entityId` dengan `updatedBy = requestedBy`
- `handleBalanceSheetDelete` — DELETE dari `balance_sheets` by `entityId`

### `src/services/approval/approvalNotificationService.ts`

Mengirim notifikasi ke approver dan maker. Notifikasi menyertakan `workflowName`, `workflowNameEn`, dan `title` di `templateVars` untuk rendering yang benar di inbox.

| Fungsi | Kapan dipanggil |
|---|---|
| `notifyApprovers(approvalId, stepId)` | Setelah submit/advance ke step baru |
| `notifyMaker(approvalId, action, actedBy)` | Setelah approved/rejected/cancelled |

Deduplikasi: jika step sudah pernah di-approve, notifikasi tidak dikirim ulang.

---

## Konfigurasi Database

### Tabel `approval_workflows`

| Kolom | Tipe | Deskripsi |
|---|---|---|
| `module` | varchar(50) | Nama modul (e.g., `cfd`) |
| `entity_type` | varchar(50) | Tipe entitas (e.g., `balance_sheet`) |
| `action` | varchar(20) | Aksi: `create`, `edit`, `delete` |
| `name` | varchar(100) | Nama workflow dalam Bahasa Indonesia |
| `name_en` | varchar(100) | Nama workflow dalam Bahasa Inggris |
| `callback_handler` | varchar(100) | Key di `callbackRegistry` |
| `view_component` | varchar(100) | Key di `FORM_REGISTRY` frontend |
| `maker_role` | varchar(50) | **UUID role** yang boleh buat & edit draft |
| `subject_fields` | jsonb | Array field untuk extract subject dari payload |
| `is_active` | boolean | Jika `false`, semua user kembali ke flow normal |

**Unique constraint:** `(module, entity_type, action)`

### Tabel `approval_workflow_steps`

| Kolom | Tipe | Deskripsi |
|---|---|---|
| `workflow_id` | uuid | FK ke `approval_workflows` |
| `step_order` | integer | Urutan step (1, 2, 3, ...) |
| `step_type` | varchar(20) | Tipe step (e.g., `approval`) |
| `required_role` | varchar(50) | **UUID role** yang bisa approve step ini |

**Catatan:** `required_role` bertipe `varchar` (bukan `uuid`) karena menyimpan UUID sebagai string. Join dengan tabel `roles` harus dilakukan via query terpisah, bukan Drizzle join langsung.

### Tabel `approvals`

| Kolom | Deskripsi |
|---|---|
| `status` | `draft` \| `pending` \| `approved` \| `rejected` \| `cancelled` (default: `draft`) |
| `current_step_id` | NULL saat `draft`, diisi saat `pending` (menunjuk step yang sedang menunggu) |
| `original_data` | Snapshot data sebelum diubah (hanya untuk action `edit`) |
| `subject` | Nilai yang di-extract dari payload sesuai `subject_fields` |
| `title` | String ringkas auto-generated dari subject values |
| `corporate_id` | Scope corporate — dipakai untuk filter monitoring dan scope check role |
| `department_id` | Scope department — dipakai untuk scope check role |

### Contoh Seed Data (TypeScript)

```typescript
const [workflow] = await db.insert(approvalWorkflows).values({
  module: 'cfd',
  entityType: 'balance_sheet',
  action: 'create',
  name: 'Persetujuan Input Neraca',
  nameEn: 'Balance Sheet Input Approval',
  callbackHandler: 'handleBalanceSheetCreate',
  viewComponent: 'BalanceSheetApprovalForm',
  makerRole: roleMap.get('finance_staff')!,   // UUID, bukan nama
  subjectFields: [
    { field: 'corporateName', label: 'Perusahaan', type: 'string' },
    { field: 'period', label: 'Periode', type: 'date' },
  ],
  createdBy: SYSTEM_ACTOR_ID,
}).returning();

// PENTING: Jangan delete steps jika sudah ada approval_histories (FK constraint)
const existingSteps = await db.select({ id: approvalWorkflowSteps.id })
  .from(approvalWorkflowSteps)
  .where(eq(approvalWorkflowSteps.workflowId, workflow.id));

if (existingSteps.length === 0) {
  await db.insert(approvalWorkflowSteps).values([
    { workflowId: workflow.id, stepOrder: 1, stepType: 'approval', requiredRole: roleMap.get('finance_manager')! },
    { workflowId: workflow.id, stepOrder: 2, stepType: 'approval', requiredRole: roleMap.get('finance_leader')! },
  ]);
}
```

---

## Deduplikasi & Notifikasi

- **Deduplikasi approve**: Jika satu user sudah approve step tertentu, `processApprove` akan throw error jika user lain mencoba approve step yang sama.
- **Notifikasi approver**: Dikirim ke semua user dengan `required_role` di scope corporate/department yang sama dengan approval. Menyertakan `workflowName`, `workflowNameEn`, dan `title`.
- **Notifikasi maker**: Dikirim saat approved, rejected, atau cancelled.
- **Klik notifikasi**: Membuka `ApprovalDetailModal` langsung + mark as read.

---

## Atomicity — Final Approve dalam Transaksi

Saat step terakhir disetujui, engine membungkus tiga operasi dalam **satu transaksi**:
1. Insert `approval_histories` (action = `approve`)
2. Update `approvals.status = 'approved'`
3. Invoke callback

**Jika callback throw, seluruh transaksi rollback** — status tetap `pending`, tidak ada history yang tersimpan, tidak ada data corrupt di tabel modul.

Untuk non-final step (advance ke step berikutnya), history insert dan step advance juga dibungkus dalam transaksi.

---

## `canApprove` dan `canCancel` dari Backend

`GET /api/frs/approvals/:id` mengembalikan dua field yang dihitung berdasarkan role user yang sedang login:

| Field | Kondisi `true` |
|---|---|
| `canApprove` | User punya `required_role` di current step + scope sesuai |
| `canCancel` | User adalah maker (ownership) DAN punya `maker_role` + scope sesuai |

`ApprovalDetailModal` membaca field ini untuk menampilkan/menyembunyikan tombol Approve, Reject, dan Batalkan. **Tidak perlu cek permission di frontend.**

---

## API Endpoints

### Approvals

| Method | Path | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/frs/approvals` | `approvals.read` + scope filter | List monitoring (difilter berdasarkan role + scope user) |
| `GET` | `/api/frs/approvals/:id` | `approvals.read` atau ownership | Detail + histories + `canApprove` + `canCancel` |
| `POST` | `/api/frs/approvals` | Role check via `maker_role` + scope | Buat draft baru |
| `POST` | `/api/frs/approvals/:id/submit` | Ownership + role check via `maker_role` | Submit/resubmit |
| `POST` | `/api/frs/approvals/:id/approve` | Role check via `required_role` step aktif | Setujui (atomic dengan history + status) |
| `POST` | `/api/frs/approvals/:id/reject` | Role check via `required_role` step aktif | Tolak |
| `POST` | `/api/frs/approvals/:id/cancel` | Ownership + role check via `maker_role` | Batalkan |

### Approval Configs

| Method | Path | Permission | Deskripsi |
|---|---|---|---|
| `GET` | `/api/frs/approval-configs/can-create` | Authenticated | Cek apakah user bisa buat draft (dipakai hook) |
| `GET` | `/api/frs/approval-configs` | `approvals.read` atau `public.approval_configs.read` | List workflows (dengan role info di-join) |
| `GET` | `/api/frs/approval-configs/:id` | `approvals.read` atau `public.approval_configs.read` | Detail workflow |
| `POST` | `/api/frs/approval-configs` | `public.approval_configs.write` | Buat workflow |
| `PUT` | `/api/frs/approval-configs/:id` | `public.approval_configs.write` | Update workflow |
| `DELETE` | `/api/frs/approval-configs/:id` | `public.approval_configs.delete` | Hapus workflow |

### Monitoring Filter & Visibility

`GET /api/frs/approvals` memfilter berdasarkan dua kriteria:

1. **Role visibility**: User hanya melihat approval dari workflow di mana mereka punya `maker_role` ATAU `required_role` di salah satu step
2. **Scope filter**: `system` → semua; `corporate` → hanya `corporate_id` sesuai; `department` → hanya `department_id` sesuai

---

## Frontend Hook: `useApproval`

```typescript
// Scope check dilakukan di backend — TIDAK perlu pass corporateId dari form
const approvalCreate = useApproval('cfd', 'balance_sheet', 'create');

// hasWorkflow = true hanya jika:
// 1. Workflow aktif (is_active = true) DAN
// 2. User punya makerRole di scope yang sesuai
if (!approvalCreate.isChecking && approvalCreate.hasWorkflow) {
  // → buat draft
} else {
  // → simpan langsung ke DB
}

// Panggil recheck() saat modal dibuka agar selalu pakai state terkini
approvalCreate.recheck();
```

Hook memanggil `GET /api/frs/approval-configs/can-create` saat mount dan saat `recheck()` dipanggil.

---

## `workflowCatalog.ts`

File `src/components/financial/approval/workflowCatalog.ts` adalah katalog statis modul yang sudah terintegrasi. Digunakan oleh `ApprovalConfigManager` untuk:
- Dropdown modul di form konfigurasi
- Auto-fill `entityType`, `callbackHandler`, `viewComponent` berdasarkan modul yang dipilih

**Wajib diupdate** saat menambahkan modul baru.

---

## Contoh Callback Handler

### Signature Lengkap

```typescript
// (payload, entityId?, stagedFiles?, requestedBy?)
// requestedBy = UUID maker — wajib digunakan sebagai createdBy/updatedBy
registerCallback('handleMyModuleCreate', async (payload, _entityId, _stagedFiles, requestedBy) => {
  const { id: _id, ...data } = payload as Record<string, unknown>;
  await db.insert(myTable).values({
    ...data,
    createdBy: requestedBy ?? '00000000-0000-0000-0000-000000000000',
  } as any);
});

registerCallback('handleMyModuleEdit', async (payload, entityId, _stagedFiles, requestedBy) => {
  if (!entityId) throw new Error('entityId required');
  const { id: _id, createdBy: _cb, createdAt: _ca, ...data } = payload as Record<string, unknown>;
  await db.update(myTable)
    .set({ ...data, updatedBy: requestedBy ?? null, updatedAt: new Date() } as any)
    .where(eq(myTable.id, entityId));
});

registerCallback('handleMyModuleDelete', async (_payload, entityId) => {
  if (!entityId) throw new Error('entityId required');
  await db.delete(myTable).where(eq(myTable.id, entityId));
});
```

**Aturan:**
- Strip field `id`, `createdBy`, `createdAt` dari payload sebelum insert/update
- Gunakan `requestedBy` sebagai `createdBy` (create) atau `updatedBy` (edit)
- Jika callback throw, transaksi rollback — status approval tetap `pending`
