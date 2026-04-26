export const subsidiaryI18n = {
  id: {
    title: 'Manajemen Anak Perusahaan',
    subtitle: 'Kelola data anak perusahaan, periode fiskal, dan tarif pajak',
    addNew: 'Tambah Anak Perusahaan',
    searchPlaceholder: 'Cari berdasarkan nama atau sektor...',
    tableHead: {
      name: 'Nama Perusahaan',
      industrySector: 'Sektor Industri',
      fiscalYearStart: 'Awal Tahun Fiskal',
      currency: 'Mata Uang',
      taxRate: 'Tarif Pajak (%)',
    },
    status: {
      empty: 'Tidak Ada Anak Perusahaan',
      emptyDesc: 'Belum ada anak perusahaan yang terdaftar atau tidak ditemukan hasil pencarian.',
    },
    modal: {
      createTitle: 'Tambah Anak Perusahaan Baru',
      editTitle: 'Edit Anak Perusahaan',
      viewTitle: 'Detail Anak Perusahaan',
      name: 'Nama Anak Perusahaan',
      industrySector: 'Sektor Industri',
      fiscalYearStart: 'Bulan Awal Fiskal',
      currency: 'Mata Uang',
      taxRate: 'Tarif Pajak (%)',
      taxRatePlaceholder: 'Contoh: 22',
      fiscalYearStartPlaceholder: 'Pilih bulan awal (1-12)',
    },
    alerts: {
      deleteTitle: 'Hapus Anak Perusahaan?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Semua data terkait anak perusahaan ini akan tetap ada namun referensi mungkin terpengaruh.',
      errorSave: 'Gagal menyimpan data anak perusahaan',
      errorDelete: 'Gagal menghapus anak perusahaan',
    },
    validation: {
      nameMin: 'Nama minimal 3 karakter',
      industrySectorRequired: 'Sektor industri wajib diisi',
      fiscalYearStartMonthRange: 'Bulan fiskal harus antara 1 dan 12',
      taxRateRange: 'Tarif pajak harus antara 0 dan 100',
    }
  },
  en: {
    title: 'Subsidiary Management',
    subtitle: 'Manage subsidiary data, fiscal periods, and tax rates',
    addNew: 'Add New Subsidiary',
    searchPlaceholder: 'Search by name or sector...',
    tableHead: {
      name: 'Company Name',
      industrySector: 'Industry Sector',
      fiscalYearStart: 'Fiscal Year Start',
      currency: 'Currency',
      taxRate: 'Tax Rate (%)',
    },
    status: {
      empty: 'No Subsidiaries Found',
      emptyDesc: 'No subsidiaries have been registered yet or no search results found.',
    },
    modal: {
      createTitle: 'Add New Subsidiary',
      editTitle: 'Edit Subsidiary',
      viewTitle: 'Subsidiary Details',
      name: 'Subsidiary Name',
      industrySector: 'Industry Sector',
      fiscalYearStart: 'Fiscal Start Month',
      currency: 'Currency',
      taxRate: 'Tax Rate (%)',
      taxRatePlaceholder: 'Example: 22',
      fiscalYearStartPlaceholder: 'Select start month (1-12)',
    },
    alerts: {
      deleteTitle: 'Delete Subsidiary?',
      deleteDesc: 'This action cannot be undone. All data related to this subsidiary will remain but references might be affected.',
      errorSave: 'Failed to save subsidiary',
      errorDelete: 'Failed to delete subsidiary',
    },
    validation: {
      nameMin: 'Name must be at least 3 characters',
      industrySectorRequired: 'Industry sector is required',
      fiscalYearStartMonthRange: 'Fiscal month must be between 1 and 12',
      taxRateRange: 'Tax rate must be between 0 and 100',
    }
  }
};
