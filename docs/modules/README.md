# Module Documentation Index

Dokumentasi lengkap untuk setiap modul di Corporate Finance Dashboard (CFD).

---

## Available Modules

### 1. Approval System
**File:** [`approval-system.md`](approval-system.md)  
**Status:** ✅ Production Ready  
**Description:** Sistem approval dinamis untuk workflow persetujuan multi-step dengan role-based access control.

**Key Features:**
- Dynamic workflow configuration
- Multi-step approval process
- Role-based approval routing
- Callback handlers for business logic
- Approval history tracking

**Integration Guide:** [`docs/guides/integrating-approval.md`](../guides/integrating-approval.md)

---

### 2. Export & Upload Module
**File:** [`export-upload-module.md`](export-upload-module.md)  
**Status:** ✅ Production Ready  
**Description:** Modul untuk ekspor data massal ke Excel/CSV dan impor data via template Excel dengan approval workflow integration.

**Key Features:**
- Bulk data export (Excel/CSV)
- Template-based bulk upload
- Server-side validation with Zod
- Approval workflow integration
- Upload history tracking
- Audit trail with detailed metadata

**Supported Modules:** 11 modules (7 financial + 4 master data)

**Integration Guide:** [`docs/guides/integrating-export-upload.md`](../guides/integrating-export-upload.md)

---

### 3. Dynamic Excel Report
**File:** [`dynamic-excel-report.md`](dynamic-excel-report.md)  
**Status:** ✅ Production Ready  
**Description:** Sistem untuk generate laporan Excel dinamis dengan template yang dapat dikonfigurasi.

**Key Features:**
- Template-based report generation
- Dynamic data binding
- Multi-sheet support
- Custom formatting

---

## Module Integration Checklist

Saat mengintegrasikan modul baru, pastikan:

- [ ] **Documentation**
  - [ ] Buat file dokumentasi di `docs/modules/{module-name}.md`
  - [ ] Update `docs/modules/README.md` (file ini)
  - [ ] Buat integration guide di `docs/guides/integrating-{module-name}.md`

- [ ] **Database**
  - [ ] Update `docs/database/schema.md` dengan tabel baru
  - [ ] Tambahkan migration files
  - [ ] Tambahkan seed scripts

- [ ] **Permissions**
  - [ ] Tambahkan permissions baru ke `permissions` table
  - [ ] Assign permissions ke roles yang sesuai
  - [ ] Update RBAC documentation

- [ ] **Agent Rules**
  - [ ] Update `AGENTS.md` dengan aturan integrasi modul
  - [ ] Tambahkan contoh usage patterns
  - [ ] Dokumentasikan best practices

- [ ] **Testing**
  - [ ] Buat manual test checklist
  - [ ] Buat automated verification tests
  - [ ] Test TypeScript compilation (`npx tsc --noEmit`)

---

## Documentation Standards

### File Naming
- Gunakan `kebab-case.md`
- Format: `{module-name}.md`
- Example: `export-upload-module.md`

### Structure
Setiap dokumentasi modul harus memiliki:

1. **Overview** - Ringkasan fitur dan tujuan modul
2. **Architecture** - Struktur komponen dan database
3. **API Design** - Endpoint dan request/response format
4. **Frontend Components** - Komponen UI dan props
5. **Integration Guide** - Langkah-langkah integrasi
6. **Testing** - Manual dan automated test guidelines
7. **Troubleshooting** - Common issues dan solutions
8. **References** - Link ke dokumentasi terkait

### Code Examples
- Gunakan syntax highlighting yang sesuai
- Berikan contoh lengkap yang dapat langsung digunakan
- Tambahkan komentar untuk menjelaskan bagian kompleks

### Updates
- Update `Last Updated` date setiap kali ada perubahan
- Tambahkan changelog di bagian bawah jika perubahan signifikan
- Maintain backward compatibility information

---

## Quick Links

### Guides
- [Integrating Approval System](../guides/integrating-approval.md)
- [Integrating Export & Upload](../guides/integrating-export-upload.md)

### Architecture
- [RBAC System](../architecture/rbac-system.md)
- [Database Schema](../database/schema.md)

### Development
- [Agent Instructions](../../AGENTS.md)
- [API Reference](../api/)

---

**Last Updated:** 2026-05-07  
**Maintained By:** Development Team
