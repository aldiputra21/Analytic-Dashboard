# AI Agent Instructions — Corporate Finance Dashboard (CFD)

> **Baca file ini setiap sesi baru.** File ini berisi aturan kerja, konteks sistem, dan konvensi yang harus diikuti oleh AI agent dalam setiap pekerjaan di repository ini.

---

## 1. System Summary

**Nama Proyek:** Corporate Finance Dashboard (CFD)
**Client:** PT Titian Servis Indonesia
**Status:** Production-ready mockup / MVP
**Google Stitch Project:** Re-Design Titian (`projects/14041083906553502612`)

### Tech Stack
| Layer | Teknologi |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4 |
| Backend | Express 4 (Node.js), TypeScript, tsx |
| Database | **PostgreSQL** (Neon) with **Drizzle ORM** |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Auth | JWT + bcryptjs |
| AI | Gemini API (@google/genai) |

### Struktur Aplikasi Aktif
Entry point: `src/main.tsx` → `src/components/financial/FRSApp.tsx`

#### 1. CFD — Corporate Finance Dashboard
- **FRS (Financial Ratio System)**: Monitoring rasio (ROA, ROE, dll.) di `src/components/financial/`.
- **Financial Management (MAFINDA)**: Input data operasional & KPI di `src/components/MAFINDA/`.

#### 2. CRM — Customer Relationship Management
- Pipeline B2B, Lead, Opportunity, Contract di `src/components/MAFINDA/crm/`.

### Akses Multi-Perusahaan
- Proyek mendukung akses **multi perusahaan** (multi-corporate).
- Pemetaan akses disimpan dalam tabel `user_corporate_accesses`.
- Satu user dapat mengakses lebih dari satu perusahaan.
- **RBAC Policy**: Guided by Matrix Access Control (Role + Scope). Detail: [docs/architecture/rbac-system.md](file:///d:/Projects/Financial%20Dashboard/source-code/docs/architecture/rbac-system.md)


---

## 2. Database Architecture

Sistem menggunakan PostgreSQL dengan 3 schema utama:
- `public`: Core tables (users, roles, corporates, approvals).
- `cfd`: Financial data (balance sheets, income statements, targets).
- `crm`: CRM module (customers, opportunities, proposals).

Detail skema, relasi, dan daftar tabel dapat dilihat di:
👉 **[docs/database/schema.md](file:///d:/Projects/Financial%20Dashboard/source-code/docs/database/schema.md)**

---

## 3. Standar UI & UX

Untuk menjaga konsistensi antarmuka, gunakan referensi berikut sebagai standar:

### 3.1 CRUD Template
- **Modul Utama**: Gunakan `src/components/financial/admin/CorporateManager.tsx` sebagai template standar untuk halaman Manajemen/CRUD.
- **Karakteristik**: Menggunakan table dengan search, filter, pagination, dan modal-based form.

### 3.2 Form & Input
- **Dropdown/Selector**: Wajib menggunakan komponen `SearchableSelect` untuk semua input yang memiliki opsi banyak (Corporate, Project, Department).
- **Reusable Hooks**: Sebelum membuat dropdown baru, pastikan untuk memeriksa apakah sudah ada custom hook yang bisa digunakan (reusable). Jika belum ada, buatlah hook baru yang dapat digunakan kembali di komponen lain.
- **Styling**: Gunakan Tailwind CSS 4 dengan pendekatan premium (glassmorphism, subtle borders, modern typography).

---

## 4. Konvensi Dokumentasi

Semua dokumentasi proyek disimpan dalam folder `docs/`:
- `docs/architecture/`: Diagram & ADR.
- `docs/api/`: API reference.
- `docs/database/`: Schema & ERD.
- `docs/modules/`: Dokumentasi spesifik per-modul (FRS, CRM, MAFINDA).
- `docs/guides/`: Developer & user guides.
- `docs/changelog/`: Catatan perubahan dan release notes.
- `docs/legacy/`: Dokumentasi lama yang sudah diarsipkan.

**Aturan:**
- Gunakan `kebab-case.md`.
- Update file yang sudah ada, jangan buat duplikat.

---

## 5. Konvensi Kode (Mandatory for All Agents)

### 5.1 Zero Errors Policy
- Pastikan **tidak ada TypeScript error** (`npx tsc --noEmit`).
- Pastikan **tidak ada lint error**.
- Pastikan **tidak ada import yang hilang dan tidak digunakan**.

### 5.2 Audit Fields
Setiap tabel yang datanya dapat diubah user **wajib** memiliki field:
```typescript
createdBy: varchar('created_by', { length: 100 }).notNull(),
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
updatedBy: varchar('updated_by', { length: 100 }),
updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date()),
```

### 5.3 Database (Drizzle ORM)
- **UUID Strategy**: Selalu gunakan UUID untuk primary key (`defaultRandom()`).
- **No Raw SQL**: Gunakan API Drizzle (`db.select()`, `db.insert()`, dll.).
- **Transactions**: Gunakan transaksi untuk operasi yang melibatkan lebih dari satu tabel.

### 5.4 TypeScript & Validation
- Gunakan `zod` untuk validasi input di API.
- Hindari penggunaan `any`, gunakan tipe yang sudah didefinisikan di `src/types/`.

### 5.5 Multi-Language (i18n)
- **No Hardcoding**: Jangan pernah melakukan hardcode untuk judul, label, placeholder, atau pesan (alerts/toasts) langsung di dalam komponen.
- **Translation Files**: Wajib menggunakan file translasi yang ada di folder `src/i18n/`. Setiap modul harus merujuk pada file i18n yang relevan.
- **Centralized Commons**: Gunakan `commonsI18n` dari `src/i18n/commons.ts` untuk elemen UI standar yang digunakan berulang kali:
  - Tombol: `save`, `cancel`, `retry`, `submit`, `delete`, `edit`, `view`.
  - Status/Feedback: `loading`, `saving`, `deleting`, `success`, `error`, `networkOnline`, `networkOffline`.
  - Aksi Umum: `back`, `apply`, `clear`, `search`.
- **Priority Rule**: Sebelum menambahkan translation baru ke file modul, agen **wajib** memeriksa apakah string tersebut sudah ada di `commonsI18n`. Jika string tersebut bersifat umum dan berpotensi digunakan kembali di modul lain (reuseable), maka **wajib** ditambahkan ke `commonsI18n`, bukan ke file modul.
- **Module-Specific Only**: File translation modul hanya boleh berisi string yang benar-benar unik untuk fitur tersebut (misal: label field spesifik database, judul modal unik).
- **Usage Pattern**:
  ```typescript
  const { language } = useAuth();
  const t = moduleI18n[language];
  const common = commonsI18n[language];
  
  // Contoh penggunaan:
  <button>{common.save}</button>
  ```
- **No Ternary in JSX**: Hindari penggunaan ternary operator untuk bahasa di dalam JSX seperti `{language === 'id' ? 'Simpan' : 'Save'}`. Pindahkan semua string ke file i18n.
- **Dynamic Strings**: Gunakan placeholder untuk string dinamis dan ganti menggunakan `.replace()`. Contoh: `t.saveSuccess.replace('{period}', period)`.
- **Centralized Ratios**: Gunakan `ratiosI18n` dari `src/i18n/ratios.ts` untuk semua label, unit, dan deskripsi rasio keuangan agar konsisten di seluruh dashboard.

### 5.6 API Design (Dropdowns & RBAC)
- **No Paging**: Endpoint yang digunakan untuk memuat data dropdown/selector **tidak boleh** menggunakan pagination.
- **Active Data Only**: Tampilkan seluruh data yang memiliki status aktif secara otomatis.
- **No Status Parameter**: Frontend tidak perlu mengirimkan parameter `status` untuk menyaring data aktif; backend harus menanganinya secara internal.
- **Context Filtering**: Setiap API yang mengambil data transaksional (keuangan, CRM, target) **wajib** melakukan filtering berdasarkan `corporate_id` atau `department_id` yang ada pada session/token user sesuai dengan scope yang diberikan.
- **Role Verification**: Gunakan middleware untuk memverifikasi `permissions` bukan hanya `role_name`.

---

### 5.7 Error Handling & Resilience

#### 1. Frontend Loading & Errors
- **Skeletons**: Gunakan `PageSkeleton` (untuk halaman) atau `Skeleton` (untuk komponen kecil) saat data sedang di-fetch.
- **Table/Dropdown Load Failures**: Jika data gagal dimuat, tampilkan UI "Gagal Memuat" di dalam area komponen tersebut. 
  - Wajib menyertakan **Tombol Retry** (untuk memicu fetch ulang) dan pesan error yang deskriptif.
  - Gunakan `commonsI18n` untuk pesan error standar (e.g., `errorLoadTable`).
- **Network Awareness**: Gunakan hook `useNetworkResilience` untuk memantau status koneksi. Tampilkan *persistent toast* saat user sedang offline.

#### 2. Form Validation (Zod)
- **Declarative Validation**: Semua form wajib divalidasi menggunakan `zod` schema sebelum dikirim ke backend.
- **Localized Messages**: Pesan error di dalam Zod schema **tidak boleh hardcoded**. Ambil dari file i18n (e.g., `t.validation.nameMin`).
- **Error Feedback**: Gunakan `safeParse` dan tampilkan pesan kesalahan menggunakan `toast.error()`.

#### 3. Backend Error Handling
- **Consistent Response**: Pastikan API mengembalikan status code yang sesuai (400 untuk validasi, 401 untuk auth, 403 untuk permission, 500 untuk server error).
- **Global Error Handler**: Manfaatkan middleware error handler global untuk menangkap exception dan mengembalikan format JSON yang konsisten.

---

### 5.8 Standard Financial Form Validation & UI

Standardisasi ini wajib diikuti untuk seluruh modul entri data keuangan (Balance Sheet, Income Statement, Weekly Cash Flow, Realization).

#### 1. Form Architecture & Validation (SSoT)
- **Zod as Single Source of Truth**: Seluruh validasi input wajib menggunakan Zod schema. **Dilarang** melakukan validasi manual (if/else) di dalam handler submit; semua logika bisnis (termasuk validasi antar-field) harus berada di dalam schema menggunakan `.refine()` atau `.superRefine()`.
- **Explicit Binding**: Tombol submit yang berada di luar tag `<form>` wajib menggunakan atribut `form="{formId}"`.
- **Native Validation Bypass**: Gunakan properti `noValidate` pada elemen `<form>` agar validasi sepenuhnya ditangani oleh Zod dan Toast.
- **Zod Error Mapping**: Setiap error dari Zod wajib dipetakan ke toast notification agar user mendapatkan feedback instan dan informatif.

#### 2. Validation Logic Rules
- **Non-Zero Nominal**: Wajib memastikan total input nominal finansial tidak nol (sum of all fields > 0) sebelum disimpan.
- **Mandatory Selectors**: Input `Corporate` dan `Department` (atau entitas terkait) wajib divalidasi sebagai field wajib isi (*required*).
- **Conditional Validation**: Validasi field opsional (misal: Project ID) harus bersifat kondisional (hanya aktif jika kategori atau switch terkait dipilih).
- **Initialization & State**: Seluruh field dalam form wajib diinisialisasi dengan nilai default (string kosong atau 0) saat modal dibuka untuk mencegah error `undefined` pada Zod schema saat proses parsing.

#### 3. UI Aesthetics & Feedback
- **Bold Labels**: Semua label form dan header tabel pada modul finansial wajib menggunakan class `font-bold` untuk konsistensi tipografi premium.
- **No Silent Failures**: Setiap kegagalan API atau validasi dilarang keras "diam" (silent). Wajib menampilkan toast error dengan pesan yang relevan dari file i18n.
- **Loading UX**: Gunakan `PageSkeleton` saat memuat halaman dan `Skeleton` loader pada komponen modal atau dropdown untuk menjaga responsivitas visual.

---

## 6. Referensi Cepat

| Kebutuhan | File/Folder / Command |
|---|---|
| Tambah API endpoint FRS | `src/routes/financial/` |
| Tambah API endpoint CRM | `src/routes/crm/` |
| Tambah komponen FRS | `src/components/financial/` |
| Tambah komponen CRM | `src/components/MAFINDA/crm/` |
| Seed Public Data | `npx tsx scripts/seed-public.ts` |
| Seed CFD Data | `npx tsx scripts/seed-cfd.ts` |
| Seed CRM Data | `npx tsx scripts/seed-crm.ts` |
| Seed All (Full) | `npx tsx scripts/seed-all.ts` |
| Reset & Re-Seed | `npx tsx scripts/reset-db.ts` |
| Jalankan dev server | `npm run dev` |

---

## 7. Aturan Integrasi Approval Module

Sistem approval dinamis sudah diimplementasikan. Setiap modul yang memerlukan workflow persetujuan **wajib** mengikuti aturan berikut.

Dokumentasi lengkap:
- Arsitektur: [`docs/modules/approval-system.md`](docs/modules/approval-system.md)
- Panduan integrasi: [`docs/guides/integrating-approval.md`](docs/guides/integrating-approval.md)

### 7.1 Wajib Gunakan Engine

- **Dilarang** memanggil langsung DB insert/update di backend jika modul tersebut terdaftar di `approval_workflows`. Semua mutasi data harus melalui `approvalEngine` → `callbackRegistry`.
- **Dilarang** membuat endpoint approval ad-hoc di route modul. Semua approval via `/api/frs/approvals/*`.

### 7.2 Callback Handler

- Setiap handler **wajib** didaftarkan di `src/services/approval/approvalCallbacks.ts`.
- Handler hanya boleh berisi logika DB yang sudah ada di service/route modul — JANGAN duplikasi logic.
- File `approvalCallbacks.ts` **wajib** diimport di `server.ts` agar handler terdaftar saat startup.

### 7.3 Frontend Form

- Setiap modul yang terintegrasi **wajib** punya `XxxApprovalForm.tsx` sebagai komponen terpisah.
- Form harus mendukung prop `readOnly: boolean` — dipakai di `ApprovalDetailModal` (view-only) dan draft (editable).
- Form **tidak boleh** berisi logic fetch data — hanya UI rendering dari `payload` prop.
- Daftarkan di `formRegistry.tsx` dengan key yang sama dengan `view_component` di database.

### 7.4 Hook useApproval

- Gunakan `useApproval(module, entityType, action)` di setiap manager yang butuh approval.
- Selalu check `isChecking` sebelum render tombol Simpan — agar tidak race condition.
- Jika `hasWorkflow = false`, JANGAN ubah flow normal — biarkan berjalan seperti sebelum integrasi.

### 7.5 File Upload

- Frontend **tidak boleh** upload file secara terpisah.
- File harus dikirim sebagai bagian dari `createDraft()` atau `submitDraft()` via `FormData`.
- Backend yang bertanggung jawab menyimpan ke staging — frontend hanya kirim `File[]`.

### 7.6 Permissions Approval

| Permission | Deskripsi |
|---|---|
| `public.approvals.read` | Akses monitoring approval |
| `public.approvals.write` | Buat draft & submit |
| `public.approvals.approve` | Approve/reject step |
| `public.approval_configs.read` | Lihat konfigurasi workflow |
| `public.approval_configs.write` | Kelola konfigurasi workflow |
| `public.approval_configs.delete` | Hapus konfigurasi workflow |

### 7.7 Dokumentasi Wajib

- Setiap modul baru yang terintegrasi **wajib** update `docs/guides/integrating-approval.md` tabel "Modul yang Sudah Terintegrasi".
- Update `docs/database/schema.md` jika ada perubahan schema.

---

## 8. Aturan Export & Upload Module

Sistem Export & Upload sudah diimplementasikan untuk 11 modul (7 finansial + 4 master data). Setiap modul baru yang memerlukan fitur export/upload **wajib** mengikuti aturan berikut.

Dokumentasi lengkap:
- Arsitektur & API: [`docs/modules/export-upload-module.md`](docs/modules/export-upload-module.md)
- Panduan integrasi: [`docs/guides/integrating-export-upload.md`](docs/guides/integrating-export-upload.md)

### 8.1 Component Reuse

- **ExportButton**: Gunakan komponen `src/components/financial/shared/ExportButton.tsx` untuk semua modul.
- **UploadButton**: Gunakan komponen `src/components/financial/shared/UploadButton.tsx` untuk semua modul.
- **UploadModal**: Komponen `src/components/financial/shared/UploadModal.tsx` sudah handle 3 step (File Selection, Review, Approval).
- **UploadHistoryView**: Gunakan komponen `src/components/financial/upload/UploadHistoryView.tsx` untuk menampilkan riwayat upload.

**DILARANG** membuat komponen export/upload baru — gunakan yang sudah ada dengan props yang sesuai.

### 8.2 Template Configuration

Setiap modul yang mendukung upload **wajib** memiliki konfigurasi template di `system_configs`:

```typescript
// Per-module template config
{
  key: 'upload_template_{entity_type}',
  value: {
    fileName: '{entity_type}_template.xlsx',
    startRecord: 4,  // Baris mulai data (biasanya 4)
    columnOrder: ['field1', 'field2', 'field3']  // Urutan kolom di template
  }
}
```

**PENTING:**
- `columnOrder` harus sesuai dengan field names di Zod schema
- `columnOrder` harus sesuai dengan urutan kolom di template Excel
- `startRecord` biasanya 4 (Row 1: Instruksi, Row 2: Kosong, Row 3: Header, Row 4+: Data)

### 8.3 Template File Structure

Template Excel **wajib** mengikuti struktur standar:

| Row | Content | Format |
|-----|---------|--------|
| 1 | Instruksi pengisian | Bold, background color |
| 2 | (kosong) | - |
| 3 | Header kolom (sesuai `columnOrder`) | Bold |
| 4+ | Sample data | Normal atau grayed out |

**DILARANG:**
- Merged cells
- Multiple sheets
- Formula kompleks
- Protected cells

### 8.4 Upload Permission

Setiap modul yang mendukung upload **wajib** memiliki permission baru:

```sql
INSERT INTO permissions (key, name, name_en, module)
VALUES (
  '{module}.{entity}.upload',
  'Upload Data {Module}',
  'Upload {Module} Data',
  '{module}'
);
```

Pattern: `{module}.{entity}.upload` (contoh: `cfd.balance_sheets.upload`)

### 8.5 Approval Workflow Integration

Upload **wajib** terintegrasi dengan approval system:

**8.5.1 Workflow Configuration:**
```typescript
{
  module: 'cfd',
  entityType: '{entity_type}_upload',  // Pattern: {entity_type}_upload
  action: 'upload',
  callbackHandler: 'handle{ModuleName}Upload',
  viewComponent: '{ModuleName}UploadApprovalForm',
  isActive: true  // false untuk direct insert
}
```

**8.5.2 Callback Handler:**
- **Wajib** dibuat di `src/services/approval/approvalCallbacks.ts`
- **Wajib** handle bulk insert dari staging table ke main table
- **Wajib** cleanup staging rows setelah insert
- **Wajib** delete uploaded file setelah insert
- **Wajib** create audit log dengan metadata lengkap

**8.5.3 Upload Approval Form:**
- **Wajib** dibuat di `src/components/financial/approval/UploadApprovalForms/`
- **Wajib** support props: `payload`, `readOnly`, `language`
- **Wajib** tampilkan: file name + download button, summary, table rows dengan search & paging
- **Wajib** register di `formRegistry.tsx`

### 8.6 Validation Rules

Upload validation **wajib** menggunakan Zod schema yang sama dengan form input:

```typescript
// Reuse existing Zod schema
import { balanceSheetSchema } from './schemas/balanceSheet';

// Validate each row
const result = balanceSheetSchema.safeParse(rowData);
if (!result.success) {
  // Mark row as invalid with error messages
}
```

**DILARANG:**
- Membuat validation rules baru untuk upload
- Skip validation untuk "trusted" users
- Validasi di frontend saja

### 8.7 Export Format Standards

Export file **wajib** mengikuti format standar:

**Excel Structure:**
- **Row 1:** Judul modul (sesuai bahasa user)
- **Row 2:** Ringkasan filter atau "Semua Data"/"All Data"
- **Row 3:** Header kolom (translated)
- **Row 4+:** Data records

**Column Formatting:**
- Currency: Format `#,##0.00` (Excel number format)
- Date: Format `DD/MM/YYYY`
- Text: Default

**File Naming:**
- Pattern: `{module_name}_{export_date}.xlsx`
- Example: `neraca_2026-05-01.xlsx`

### 8.8 Audit Log Requirements

Setiap upload **wajib** mencatat audit log dengan struktur:

```json
{
  "userId": "uuid",
  "action": "upload",
  "entityType": "{module_name}",
  "entityId": "{session_id}",
  "metadata": {
    "fileName": "file.xlsx",
    "totalRows": 10,
    "validRows": 10,
    "invalidRows": 0,
    "status": "completed",
    "rows": [
      {
        "rowNumber": 4,
        "status": "inserted",
        "data": {...}
      }
    ]
  }
}
```

### 8.9 UI Integration

**Toolbar Button Placement:**
- **ExportButton:** Di sebelah kanan tombol "Clear Filter"
- **UploadButton:** Di sebelah kiri tombol "Add"

**Example:**
```tsx
<div className="toolbar">
  <button>Filter</button>
  <button>Clear Filter</button>
  <ExportButton entityType="balance_sheet" filters={activeFilters} />
  <UploadButton entityType="balance_sheet" onUploadComplete={refetch} />
  <button>Add</button>
</div>
```

### 8.10 i18n Compliance

Export & Upload **wajib** menggunakan i18n:

```typescript
import { exportUploadI18n } from '../../../i18n/exportUpload';
import { commonsI18n } from '../../../i18n/commons';

const { language } = useAuth();
const t = exportUploadI18n[language];
const common = commonsI18n[language];
```

**DILARANG** hardcode string apapun di komponen export/upload.

### 8.11 Performance Guidelines

**Large File Handling:**
- Gunakan streaming untuk file >10MB
- Server-side pagination untuk >100 rows
- Limit concurrent uploads per user

**Database Optimization:**
- Index pada `upload_staging_rows(sessionId)`
- Cleanup staging rows setelah approval/cancel
- Archive old upload sessions (>90 days)

### 8.12 Security Requirements

**File Upload Security:**
- Validasi extension (.xlsx only)
- Size limit: Max 10MB per file
- Store file outside web root
- Delete file setelah approval/cancel

**Permission Checks:**
- Upload: `{module}.{entity}.upload`
- Download (review): `{module}.{entity}.upload` OR role in workflow
- Download (history): `{module}.{entity}.read`

### 8.13 Testing Requirements

Setiap modul baru dengan export/upload **wajib** ditest:

**Manual Tests:**
- Export dengan dan tanpa filter
- Upload dengan data valid
- Upload dengan data invalid
- Approval workflow (jika aktif)
- Upload history view
- Audit log detail view

**Automated Tests:**
- TypeScript compilation (`npx tsc --noEmit`)
- Component existence verification
- Template config verification
- Approval workflow verification

### 8.14 Documentation Requirements

Setiap modul baru dengan export/upload **wajib**:
- Update `docs/modules/export-upload-module.md` jika ada perubahan arsitektur
- Update `docs/guides/integrating-export-upload.md` dengan contoh integrasi
- Update `docs/database/schema.md` jika ada perubahan schema

---

## 9. Modul yang Sudah Terintegrasi Export & Upload

Berikut daftar modul yang sudah memiliki fitur export & upload:

### Financial Modules (7)
1. ✅ Balance Sheet (`balance_sheet`)
2. ✅ Income Statement (`income_statement`)
3. ✅ Income Statement Projection (`income_statement_projection`)
4. ✅ Weekly Cash Flow (`weekly_cash_flow`)
5. ✅ Realization (`realization`)
6. ✅ Cash Flow Projection (`cash_flow_projection`)
7. ✅ Bank Loan (`bank_loan`)

### Master Data Modules (4)
8. ✅ Corporate (`corporate`) - Approval inactive (direct insert)
9. ✅ Department (`department`)
10. ✅ Cost Center (`cost_center`)
11. ✅ Project (`project`)

**Status:** Production Ready  
**Last Updated:** 2026-05-07
