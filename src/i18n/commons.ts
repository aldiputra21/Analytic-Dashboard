// i18n/commons.ts - Shared translations across modules
export type Locale = 'id' | 'en';

export interface CommonsCopy {
  networkOnline: string;
  networkOffline: string;
  errorFetchMasterData: string;
  errorLoadTable: string;
  retry: string;
  save: string;
  cancel: string;
  back: string;
  submit: string;
  delete: string;
  edit: string;
  view: string;
  loading: string;
  saving: string;
  deleting: string;
  success: string;
  error: string;
  warning: string;
  apply: string;
  clear: string;
  search: string;
  all: string;
  export: string;
  exporting: string;
  rateLimit: string;
  comingSoon: string;
  comingSoonDesc: string;
}

export const commonsI18n: Record<Locale, CommonsCopy> = {
  id: {
    networkOnline: 'Koneksi kembali terhubung',
    networkOffline: 'Koneksi terputus. Bekerja dalam mode offline.',
    errorFetchMasterData: 'Gagal memuat data pendukung (dropdown)',
    errorLoadTable: 'Gagal memuat data tabel',
    retry: 'Coba Lagi',
    save: 'Simpan',
    cancel: 'Batal',
    back: 'Kembali',
    submit: 'Kirim',
    delete: 'Hapus',
    edit: 'Ubah',
    view: 'Lihat',
    loading: 'Memuat...',
    saving: 'Menyimpan...',
    deleting: 'Menghapus...',
    success: 'Berhasil',
    error: 'Terjadi Kesalahan',
    warning: 'Peringatan',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    search: 'Cari...',
    all: 'Semua',
    export: 'Ekspor',
    exporting: 'Mengekspor...',
    rateLimit: 'Terlalu banyak permintaan. Silakan tunggu {retryAfter} detik.',
    comingSoon: 'Segera Hadir',
    comingSoonDesc: 'Bagian ini akan segera tersedia.',
  },
  en: {
    networkOnline: 'Network connection restored',
    networkOffline: 'Network connection lost. Working in offline mode.',
    errorFetchMasterData: 'Failed to load master data (dropdown)',
    errorLoadTable: 'Failed to load table data',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    submit: 'Submit',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    loading: 'Loading...',
    saving: 'Saving...',
    deleting: 'Deleting...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    apply: 'Apply',
    clear: 'Clear',
    search: 'Search...',
    all: 'All',
    export: 'Export',
    exporting: 'Exporting...',
    rateLimit: 'Too many requests. Please wait {retryAfter} seconds.',
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'This section will be available soon.',
  },
};
