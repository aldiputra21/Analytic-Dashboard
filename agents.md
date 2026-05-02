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
