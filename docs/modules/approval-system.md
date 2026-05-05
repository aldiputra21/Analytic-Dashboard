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

Contoh: `finance_staff` dengan scope `corporate` di TSI hanya bisa buat draft untuk approval yang `corporate_id = TSI`. User yang sama tidak bisa buat draft untuk corporate lain.

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
| `processApprove(id, actedBy, comments?)` | Setujui step aktif. Verifikasi `requiredRole` + scope. Jika step terakhir: finalize + invoke callback. |
| `processReject(id, actedBy, comments)` | Tolak step aktif. Verifikasi `requiredRole` + scope. Set status kembali ke `draft`. |
| `cancelApproval(id, cancelledBy, notes)` | Batalkan approval (hanya dari `draft`). Verifikasi ownership + `makerRole`. |
| `canUserCreateDraft(userId, module, entityType, action, corporateId?, departmentId?)` | Cek apakah user punya `makerRole` untuk workflow ini di scope yang sesuai. Dipakai oleh `useApproval` hook. |
| `getApprovalDetail(id)` | Ambil detail approval beserta workflow, steps, dan histories. |

### `src/services/approval/callbackRegistry.ts`

Registry untuk callback handler. Setiap modul mendaftarkan fungsi yang akan dipanggil saat approval final.

```typescript
import { registerCallback } from './callbackRegistry';

registerCallback('myHandlerKey', async (payload, entityId, stagedFiles?) => {
  // Eksekusi mutasi DB di sini
});
```

### `src/services/approval/approvalCallbacks.ts`

File registrasi semua callback handler. **Wajib diimport di `server.ts`** agar handler terdaftar saat startup.

Handler yang sudah terdaftar:
- `handleBalanceSheetCreate` — INSERT ke `balance_sheets`
- `handleBalanceSheetEdit` — UPDATE `balance_sheets` by `entityId`
- `handleBalanceSheetDelete` — DELETE dari `balance_sheets` by `entityId`

### `src/services/approval/approvalNotificationService.ts`

Mengirim notifikasi ke approver dan maker.

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
  callbackHandler: 'handleBalanceSheetCreate',
  viewComponent: 'BalanceSheetApprovalForm',
  makerRole: roleMap.get('finance_staff')!,   // UUID, bukan nama
  subjectFields: [
    { field: 'corporateName', label: 'Perusahaan', type: 'string' },
    { field: 'period', label: 'Periode', type: 'date' },
  ],
  createdBy: SYSTEM_ACTOR_ID,
}).returning();

await db.insert(approvalWorkflowSteps).values([
  { workflowId: workflow.id, stepOrder: 1, stepType: 'approval', requiredRole: roleMap.get('finance_manager')! },
  { workflowId: workflow.id, stepOrder: 2, stepType: 'approval', requiredRole: roleMap.get('finance_leader')! },
]);
```

---

## Deduplikasi & Notifikasi

- **Deduplikasi approve**: Jika satu user sudah approve step tertentu, `processApprove` akan throw error jika user lain mencoba approve step yang sama.
- **Notifikasi approver**: Dikirim ke semua user dengan `required_role` di scope corporate/department yang sama dengan approval.
- **Notifikasi maker**: Dikirim saat approved, rejected, atau cancelled.

---

## API Endpoints

### Approvals

| Method | Path | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/frs/approvals` | `approvals.read` + scope filter | List monitoring (difilter berdasarkan scope user) |
| `GET` | `/api/frs/approvals/:id` | `approvals.read` + scope check | Detail + histories |
| `POST` | `/api/frs/approvals` | Role check via `maker_role` + scope | Buat draft baru |
| `POST` | `/api/frs/approvals/:id/submit` | Ownership + role check via `maker_role` | Submit/resubmit |
| `POST` | `/api/frs/approvals/:id/approve` | Role check via `required_role` step aktif | Setujui |
| `POST` | `/api/frs/approvals/:id/reject` | Role check via `required_role` step aktif | Tolak |
| `POST` | `/api/frs/approvals/:id/cancel` | Ownership + role check via `maker_role` | Batalkan |

### Approval Configs

| Method | Path | Permission | Deskripsi |
|---|---|---|---|
| `GET` | `/api/frs/approval-configs/can-create` | Authenticated | Cek apakah user bisa buat draft (dipakai hook) |
| `GET` | `/api/frs/approval-configs` | `approvals.read` atau `public.approval_configs.read` | List workflows |
| `GET` | `/api/frs/approval-configs/:id` | `approvals.read` atau `public.approval_configs.read` | Detail workflow |
| `POST` | `/api/frs/approval-configs` | `public.approval_configs.write` | Buat workflow |
| `PUT` | `/api/frs/approval-configs/:id` | `public.approval_configs.write` | Update workflow |
| `DELETE` | `/api/frs/approval-configs/:id` | `public.approval_configs.delete` | Hapus workflow |

### Monitoring Filter

`GET /api/frs/approvals` otomatis memfilter berdasarkan `accessContext` user dari JWT:
- `system` scope → semua approval
- `corporate` scope → hanya approval dengan `corporate_id` yang sesuai
- `department` scope → hanya approval dengan `department_id` yang sesuai

---

## Frontend Hook: `useApproval`

```typescript
const approvalCreate = useApproval(
  'cfd',           // module
  'balance_sheet', // entityType
  'create',        // action
  { corporateId: activeCorporateId }  // scope untuk cek makerRole
);

// hasWorkflow = true hanya jika:
// 1. Workflow aktif (is_active = true) DAN
// 2. User punya makerRole di scope yang sesuai
if (!approvalCreate.isChecking && approvalCreate.hasWorkflow) {
  // → buat draft
} else {
  // → simpan langsung ke DB
}
```

Hook memanggil `GET /api/frs/approval-configs/can-create` saat mount dan saat `corporateId` berubah.

---

## Contoh Callback Handler

### Modul tanpa file

```typescript
registerCallback('handleMyModuleCreate', async (payload) => {
  await db.insert(myTable).values(payload as any);
});

registerCallback('handleMyModuleEdit', async (payload, entityId) => {
  await db.update(myTable).set(payload as any).where(eq(myTable.id, entityId!));
});

registerCallback('handleMyModuleDelete', async (_payload, entityId) => {
  await db.delete(myTable).where(eq(myTable.id, entityId!));
});
```
