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
| Database | **PostgreSQL** (Neon) with **Drizzle ORM** for type-safe queries |
| DB Driver | `pg` via `drizzle-orm/node-postgres` |
| Charts | Recharts 3 |
| Animation | Motion (Framer Motion 12) |
| Icons | Lucide React |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | helmet, express-rate-limit |
| Validation | Zod |
| Export | xlsx (Excel), jspdf (PDF) |
| AI | @google/genai (Gemini API) |
| Testing | Vitest 4, supertest, fast-check |

### Struktur Aplikasi Aktif

Entry point: `src/main.tsx` → `src/components/financial/FRSApp.tsx`

Aplikasi memiliki **dua modul utama** yang tergabung dalam satu app shell (`FRSApp.tsx`):

#### 1. CFD — Corporate Finance Dashboard (Analitik Keuangan)
Mencakup dua sub-sistem:

**FRS (Financial Ratio System)** — fitur monitoring rasio keuangan:
- Multi-subsidiary financial ratio monitoring (ROA, ROE, NPM, DER, dll.)
- Roles: `owner`, `bod`, `subsidiary_manager`
- Fitur: ratio calculation, health score, alerts, benchmarking, trend analysis, export, audit log, bulk import
- Komponen: `src/components/financial/`

**Financial Management** — fitur input & manajemen data keuangan operasional:
- Dashboard KPI: cash flow, revenue, asset/equity composition
- Input data: income statement, balance sheet, cash flow statement
- Manajemen: departments, projects, financial targets
- Komponen: `src/components/MAFINDA/dashboard/`, `src/components/MAFINDA/data-entry/`, `src/components/MAFINDA/management/`
- Catatan kode: secara internal disebut "MAFINDA" di folder/hook names (legacy naming)

#### 2. CRM — Customer Relationship Management
- Pipeline B2B: Lead → Qualification → Tender → Proposal → Negotiation → Contract
- Customer & contact management
- Opportunity tracking, Kanban board, funnel chart
- Proposal, contract, approval, reimbursement management
- Komponen: `src/components/MAFINDA/crm/`

### Navigasi Sidebar (Grup)
| Grup Label | Kode Group | Halaman |
|---|---|---|
| Analitik | `main` | Dashboard (FRS), Benchmarking, Trend Analysis, Reports, Alerts |
| Input Data | `data` | Data Entry (FRS), Input Keuangan (financial statements) |
| CFD | `mafinda` | Manajemen (departments/projects/targets) |
| CRM | `crm` | Dashboard, Opportunities, Customers, Proposals, Contracts, Approvals, Reimburse |
| Admin | `admin` | Subsidiaries, Users, Thresholds, Audit Log |

### Struktur Folder Aktif
```
src/
  components/
    financial/          # CFD: FRS UI components (aktif)
      FRSApp.tsx        # Root app shell — ENTRY POINT
      dashboard/        # FRS dashboard, charts, selectors
      admin/            # Subsidiary, user, threshold, audit log management
      data-entry/       # Manual & bulk financial data entry
      reports/          # Benchmarking, consolidated, trend reports
      shared/           # ProtectedRoute, QueryProvider, ErrorBoundary, Toast
    MAFINDA/            # CFD + CRM UI components
      dashboard/        # Dashboard widgets (aktif, di-embed di FRSDashboard)
      data-entry/       # Financial statement forms (aktif)
      management/       # Department/project/target management (aktif)
      crm/              # CRM module (aktif)
  routes/
    financial/          # /api/frs/* endpoints
    crm/                # /api/crm/* endpoints
    dashboard/          # /api/dashboard/* endpoints
    management/         # /api/management/* endpoints
  services/
    financial/          # FRS business logic
    mafinda/            # Financial management business logic
    crm/                # CRM business logic
  db/
    schema/             # Drizzle ORM schema definitions (public, cfd, crm)
    connection.ts       # Database connection (pg + drizzle)
    migrations/         # Drizzle auto-generated migrations
  types/
    financial/          # FRS TypeScript types
    crm.ts              # CRM TypeScript types
  types.ts              # Legacy types (tidak digunakan di app aktif)
server.ts               # Express server entry point
```



### Database Architecture

**Database:** PostgreSQL (hosted on Neon) with Drizzle ORM

**Schemas (3):**
- `public` — Core tables: roles, users, corporates, departments, projects, user_corporate_accesses, audit_logs, system_configs, approval_workflows, approval_workflow_steps, approvals, approval_histories
- `cfd` — Financial data: thresholds, alerts, balance_sheets, income_statements, target_headers, target_details, weekly_cash_flows, cash_flow_statements
- `crm` — CRM module: customers, contacts, interactions, opportunities, opportunity_value_history, stage_transitions, competitors, qualifications, proposals, proposal_documents, proposal_versions, cost_estimations, contracts, contract_documents, sales_targets

**Key Files:**
- `src/db/connection.ts` — Database connection via `drizzle-orm/node-postgres`
- `src/db/schema/public.ts` — Public schema definitions
- `src/db/schema/cfd.ts` — CFD schema definitions
- `src/db/schema/crm.ts` — CRM schema definitions
- `src/db/schema/index.ts` — Re-exports all schemas
- `drizzle.config.ts` — Drizzle Kit configuration

**Seed Files:**
- `init-and-seed.ts` — Core data (roles, users, corporates, departments, projects, cash flows, targets)
- `seed-data.ts` — Additional corporates + 36 months historical financial data
- `seed-mafinda-demo.ts` — Demo cash flows and targets
- `seed-crm.ts` — CRM demo data (customers, opportunities, proposals, contracts)

**Environment:**
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

---

## 2. Requirements Context

### Cara Membaca Requirements Aktif
Sebelum memulai pekerjaan apapun, AI agent **wajib membaca**:
1. File ini (`agents.md`) — aturan & system summary
2. Requirement terbaru di folder `.requirements/` (lihat folder dengan tanggal terbaru)
3. Di dalam folder requirement tersebut, baca:
   - `specs.md` — spesifikasi yang akan dikerjakan
   - `blueprint.md` — desain sistem
   - `tasks.md` — daftar tasks & status pengerjaan

### Cara Membuat Requirement Baru
Saat ada requirement baru, buat folder dalam `.requirements/` dengan format:
```
.requirements/YYYYMMDD_${COUNTER}_NAMA_REQUIREMENT/
```
Contoh: `.requirements/20260407_002_crm_enhancement/`

Counter dimulai dari `001` dan naik secara berurutan berdasarkan tanggal pembuatan.

Setiap folder requirement **wajib** berisi file-file berikut:

#### `specs.md`
Spesifikasi detail requirement:
- Latar belakang & tujuan
- Fitur/fungsi yang akan dibangun atau diubah
- User stories / acceptance criteria
- Batasan & asumsi

#### `blueprint.md`
Desain sistem sesuai specs.md:
- Arsitektur komponen baru/yang diubah
- Skema database (tabel, kolom, relasi)
- API endpoint baru/yang diubah
- Alur data (data flow)
- UI/UX wireframe atau deskripsi tata letak

#### `tasks.md`
Daftar tasks berdasarkan specs.md & blueprint.md:
```markdown
## Tasks

- [ ] Task 1: Deskripsi task
- [ ] Task 2: Deskripsi task
  - [ ] Sub-task 2.1
  - [ ] Sub-task 2.2
- [x] Task 3: Sudah selesai dan disetujui
```

---

## 3. Aturan Eksekusi Tasks

Saat menjalankan tasks dari `tasks.md`:
1. **Update status** di `tasks.md` segera setelah task selesai dikerjakan dan disetujui dengan tanda `[x]`
2. **Tidak perlu** membuat file dokumentasi tambahan untuk mencatat penyelesaian task (misalnya `TASK_COMPLETION.md`) — cukup update `tasks.md`
3. Kerjakan satu task pada satu waktu, selesaikan sebelum lanjut ke task berikutnya
4. Jika task memiliki sub-tasks, selesaikan semua sub-tasks dulu sebelum menandai parent task selesai

---

## 4. Konvensi Dokumentasi

Semua dokumentasi proyek disimpan dalam folder `docs/` dengan struktur:
```
docs/
  architecture/       # Diagram arsitektur, ADR (Architecture Decision Records)
  api/                # API reference documentation
  database/           # Schema docs, ERD
  modules/            # Dokumentasi per-modul (FRS, MAFINDA, CRM)
  guides/             # How-to guides untuk developer & user
  changelog/          # Release notes & change history
  legacy/             # Archived documentation (legacy docs moved here)
```

**Aturan dokumentasi:**
- Simpan di folder `docs/` yang sesuai berdasarkan kategori
- Tidak ada duplikasi file — periksa apakah dokumentasi serupa sudah ada sebelum membuat yang baru
- Penamaan file: `kebab-case.md`, deskriptif dan jelas
- Jika file yang sudah ada perlu diperbarui, update file tersebut (jangan buat file baru)
- Legacy documentation (dari development phase) sudah dipindahkan ke `docs/legacy/` — jangan pindahkan kembali atau buat duplikat

**File Root yang Tetap Aktif:**
- `README.md` — Project overview & quick setup
- `QUICK_START.md` — Getting started guide
- `agents.md` — AI agent instructions & system rules
- Jangan buat file .md baru di root (gunakan docs/ folder)

---

## 5. Konvensi Kode

### 5.1 Zero Errors Policy
Setiap kali menulis atau mengubah kode:
- Pastikan **tidak ada TypeScript error** — jalankan `npx tsc --noEmit` setelah perubahan
- Pastikan **tidak ada lint error** — jalankan `npx eslint src/**/*.{ts,tsx}` jika ESLint tersedia
- Pastikan **tidak ada import yang hilang** atau referensi ke fungsi/tipe yang tidak ada
- Periksa perubahan dengan membaca ulang file yang diubah sebelum selesai

### 5.2 Audit Fields untuk Tabel Multi-User
Setiap tabel yang datanya dapat diubah oleh lebih dari satu user **wajib** memiliki field berikut (Drizzle ORM):
```typescript
createdBy: varchar('created_by', { length: 100 }).notNull(),
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
updatedBy: varchar('updated_by', { length: 100 }),
updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date()),
```

### 5.3 TypeScript Conventions
- Gunakan `zod` untuk validasi input di API endpoints
- Gunakan tipe yang sudah ada di `src/types/` — jangan duplikasi
- Tambahkan tipe baru di file yang relevan atau buat file baru dalam `src/types/`
- Hindari penggunaan `any` — gunakan `unknown` jika tipe belum diketahui

### 5.4 Database Conventions (PostgreSQL + Drizzle ORM)

1. **Gunakan Drizzle ORM untuk semua database operations** — jangan raw SQL
   ```typescript
   // ❌ Avoid
   const result = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
   
   // ✅ Use
   const result = await db.select().from(users).where(eq(users.id, userId));
   ```

2. **Schema Definitions** — Disimpan di `src/db/schema/*.ts`
   ```typescript
   // src/db/schema/public.ts
   export const users = pgTable('users', {
     id: uuid().primaryKey().defaultRandom(),
     email: varchar({ length: 255 }).notNull().unique(),
   });
   ```

3. **Migrations** — Generate dengan Drizzle Kit
   ```bash
   npx drizzle-kit generate   # Generate from schema changes
   npx drizzle-kit push       # Push schema directly (dev)
   ```

4. **Connection** — Via `src/db/connection.ts`
   ```typescript
   import { db } from './src/db/connection';
   ```

5. **Transactions**
   ```typescript
   await db.transaction(async (tx) => {
     await tx.insert(users).values(...);
     await tx.update(logs).set(...);
   });
   ```

6. **Query Pattern** — `db.execute()` returns `QueryResult<T>` with `.rows`
   ```typescript
   // For raw SQL:
   const result = await db.execute(sql`SELECT ...`);
   const rows = result.rows; // T[]
   
   // For Drizzle queries:
   const rows = await db.select().from(users); // T[] directly
   ```

7. **ID Strategy** — UUID everywhere
   ```typescript
   id: uuid().primaryKey().defaultRandom(),
   ```

8. **Error Handling** — PostgreSQL error codes
   ```typescript
   try {
     await db.insert(users).values({ email: 'user@example.com' });
   } catch (error) {
     if (error.code === '23505') {  // Unique constraint violation
       // Handle duplicate
     }
   }
   ```

---

## 6. Cara Kerja Agent

### Saat Memulai Sesi Baru
1. Baca `agents.md` ini (sudah dilakukan jika kamu membaca ini)
2. Cari folder requirement terbaru di `.requirements/` (sort by folder name descending)
3. Baca `specs.md`, `blueprint.md`, dan `tasks.md` dari folder requirement tersebut
4. Pahami konteks pekerjaan sebelum mulai mengerjakan apapun

### Saat Menerima Instruksi
1. Tentukan apakah instruksi ini adalah **requirement baru** atau **eksekusi tasks** dari requirement yang ada
2. Jika requirement baru: buat folder & file di `.requirements/` sesuai aturan di Bagian 2
3. Jika eksekusi tasks: baca `tasks.md` dan kerjakan tasks secara berurutan

### Saat Menyelesaikan Pekerjaan
1. Update `tasks.md` — tandai task selesai dengan `[x]`
2. Verifikasi tidak ada error (TypeScript, lint)
3. Laporkan hasil kerja secara ringkas kepada user

---

## 7. Referensi Cepat

| Kebutuhan | File/Folder |
|---|---|
| Tambah API endpoint FRS | `src/routes/financial/` |
| Tambah API endpoint CRM | `src/routes/crm/` |
| Tambah business logic FRS | `src/services/financial/` |
| Tambah business logic CRM | `src/services/crm/` |
| Tambah komponen FRS | `src/components/financial/` |
| Tambah komponen CFD (management/dashboard) | `src/components/MAFINDA/management/` atau `src/components/MAFINDA/dashboard/` |
| Tambah komponen CRM | `src/components/MAFINDA/crm/` |
| Tambah tipe TypeScript FRS | `src/types/financial/` |
| Tambah tipe TypeScript CRM | `src/types/crm.ts` |
| Tambah/ubah database schema | `src/db/schema/*.ts` + `npx drizzle-kit push` |
| Database connection | `src/db/connection.ts` |
| Tambah dokumentasi | `docs/` |
| Requirement baru | `.requirements/YYYYMMDD_NNN_nama/` |
| Jalankan dev server | `npm run dev` |
| Jalankan tests | `npm test` |
| Seed core data | `npx tsx init-and-seed.ts` |
| Seed CRM data | `npx tsx seed-crm.ts` |
