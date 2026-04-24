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
