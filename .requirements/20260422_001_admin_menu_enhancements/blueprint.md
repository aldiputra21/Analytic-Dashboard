# Blueprint - Admin Menu Enhancements

## Architecture & Component Changes

1. **`src/components/financial/admin/CorporateManager.tsx`**
   - Import `AnimatePresence` dan komponen Skeleton dari UI library.
   - Tambah mode `'view'` di `FormState`. Saat view, semua input disable.
   - Layout form: `<div className="flex gap-4"><div className="w-[40%]">Kode</div><div className="w-[60%]">Sektor</div></div>`
   - Ambil data sektor dan currency via hook config (e.g. `useSystemConfig('corporate_sectors')`).
   - Ubah fetch/update status function untuk support konfirmasi (`Dialog`).

2. **`src/components/financial/admin/CostCenterManager.tsx`**
   - Hapus komponen header section di form. Update struktur div form menjadi 2 kolom.
   - Implement mode `'view'`.
   - Update footer datatable memanggil custom Pager / layout flex sama seperti Neraca.
   - Ambil data kategori dari config (`cost_center_categories`).

3. **`src/components/financial/admin/DepartmentManager.tsx`**
   - Hapus komponen header section di form. Update struktur form 2 kolom.
   - Implement mode `'view'`.
   - Update footer datatable.
   - Filter dropdown Corporate berdasarkan `user_corporate_accesses` (melalui hook `useCorporates` atau data dari backend).
   - Perbaiki bug "0 records". Cek file `src/routes/management/departments.ts` atau terkait jika memanggil endpoint API, mungkin list endpoint perlu diperiksa (role scope check bug).

4. **`src/components/financial/admin/ProjectManager.tsx`**
   - Layout form dan hapus fitur yg tidak diminta.
   - Implement mode `'view'`.
   - Dropdown Department diganti `SearchableSelect` (atau sejenisnya), list difilter via access.

5. **`src/components/MAFINDA/management/TargetManager.tsx` (or `src/components/financial/admin/TargetManager.tsx` depending on current usage)**
   - Perbaiki dropdown layout (70/30).
   - Implement slider "Terkait Proyek?" -> conditional render `<select>` project.
   - Implement mode `'view'`.
   - Auto-scroll form to alert box on submit error.

6. **File Translations (e.g., `src/i18n/*.ts`)**
   - Tambah key untuk dropdown bulan, target terkait proyek, message sukses/error.

7. **Database / Seeding (`src/db/seeds/` / `init-and-seed.ts` dll)**
   - Buat helper script atau update `seed` file untuk insert key `system_configs`:
     - `corporate_sectors`
     - `currencies`
     - `cost_center_categories`

8. **API / Backend Changes**
   - `src/routes/financial/corporates.ts` / service terkait: simpan file upload dengan nama `<id>.<ext>`.
   - `src/routes/management/departments.ts`: check list endpoint jika role based access menyebabkan return 0 records padahal user harusnya bisa melihat data.

## UI/UX Wireframe Notes
- **Datatable Footer:** Flex container dengan justify-between. Kiri: Info record & selector page size. Kanan: Pagination buttons.
- **Form Read Only:** Input element ditambahkan `disabled` atau diganti tag `<p>` / layout text biasa (lebih disukai input disabled untuk konsistensi form layout).
- **Tooltip Hover Status:** Gunakan element/library standard dari template (misalnya div group-hover atau title attribute) di badge status.
