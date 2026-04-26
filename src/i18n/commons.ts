// i18n/commons.ts - Shared translations across modules
export type Locale = 'id' | 'en';

export interface CommonsCopy {
  networkOnline: string;
  networkOffline: string;
  errorFetchMasterData: string;
  errorLoadTable: string;
  errorRequired: string;
  retry: string;
  save: string;
  cancel: string;
  back: string;
  submit: string;
  delete: string;
  edit: string;
  view: string;
  add: string;
  loading: string;
  saving: string;
  deleting: string;
  success: string;
  error: string;
  warning: string;
  successSave: string;
  successUpdate: string;
  successDelete: string;
  errorSave: string;
  errorDelete: string;
  errorNetwork: string;
  apply: string;
  clear: string;
  search: string;
  all: string;
  export: string;
  exporting: string;
  rateLimit: string;
  comingSoon: string;
  comingSoonDesc: string;
  status: string;
  actions: string;
  active: string;
  inactive: string;
  activate: string;
  deactivate: string;
  close: string;
  months: string[];
  pagination: {
    page: string;
    of: string;
    rowsPerPage: string;
    total: string;
    showing: string;
    previous: string;
    next: string;
    entries: string;
  };
  shortMonths: string[];
}

export const commonsI18n: Record<Locale, CommonsCopy> = {
  id: {
    networkOnline: 'Koneksi kembali terhubung',
    networkOffline: 'Koneksi terputus. Bekerja dalam mode offline.',
    errorFetchMasterData: 'Gagal memuat data pendukung (dropdown)',
    errorLoadTable: 'Gagal memuat data tabel',
    errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
    retry: 'Coba Lagi',
    save: 'Simpan',
    cancel: 'Batal',
    back: 'Kembali',
    submit: 'Kirim',
    delete: 'Hapus',
    edit: 'Ubah',
    view: 'Lihat',
    add: 'Tambah',
    loading: 'Memuat...',
    saving: 'Menyimpan...',
    deleting: 'Menghapus...',
    success: 'Berhasil',
    error: 'Terjadi Kesalahan',
    warning: 'Peringatan',
    successSave: 'Data berhasil disimpan',
    successUpdate: 'Data berhasil diperbarui',
    successDelete: 'Data berhasil dihapus',
    errorSave: 'Gagal menyimpan data',
    errorDelete: 'Gagal menghapus data',
    errorNetwork: 'Terjadi kesalahan jaringan',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    search: 'Cari...',
    all: 'Semua',
    export: 'Ekspor',
    exporting: 'Mengekspor...',
    rateLimit: 'Terlalu banyak permintaan. Silakan tunggu {retryAfter} detik.',
    comingSoon: 'Segera Hadir',
    comingSoonDesc: 'Bagian ini akan segera tersedia.',
    status: 'Status',
    actions: 'Aksi',
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    activate: 'Aktifkan',
    deactivate: 'Nonaktifkan',
    close: 'Tutup',
    months: [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ],
    pagination: {
      page: 'Halaman',
      of: 'dari',
      rowsPerPage: 'Baris per halaman',
      total: 'Total',
      showing: 'Menampilkan',
      previous: 'Sebelumnya',
      next: 'Berikutnya',
      entries: 'entri',
    },
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  },
  en: {
    networkOnline: 'Network connection restored',
    networkOffline: 'Network connection lost. Working in offline mode.',
    errorFetchMasterData: 'Failed to load master data (dropdown)',
    errorLoadTable: 'Failed to load table data',
    errorRequired: 'Please fill in all required fields',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    submit: 'Submit',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add',
    loading: 'Loading...',
    saving: 'Saving...',
    deleting: 'Deleting...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    successSave: 'Data saved successfully',
    successUpdate: 'Data updated successfully',
    successDelete: 'Data deleted successfully',
    errorSave: 'Failed to save data',
    errorDelete: 'Failed to delete data',
    errorNetwork: 'Network error',
    apply: 'Apply',
    clear: 'Clear',
    search: 'Search...',
    all: 'All',
    export: 'Export',
    exporting: 'Exporting...',
    rateLimit: 'Too many requests. Please wait {retryAfter} seconds.',
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'This section will be available soon.',
    status: 'Status',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    activate: 'Activate',
    deactivate: 'Deactivate',
    close: 'Close',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    pagination: {
      page: 'Page',
      of: 'of',
      rowsPerPage: 'Rows per page',
      total: 'Total',
      showing: 'Showing',
      previous: 'Previous',
      next: 'Next',
      entries: 'entries',
    },
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
};
