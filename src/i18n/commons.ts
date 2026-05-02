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
  deleteConfirm: string;
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
  errorValidation: string;
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
  logout: string;
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
  passwordStrength: {
    weak: string;
    fair: string;
    good: string;
    strong: string;
  };
  selectCorporate: string;
  createdAt: string;
  noData: string;
  errors: {
    [key in keyof typeof import('../utils/errors').ErrorCode]?: string;
  };
  saveChanges: string;
  confirmDelete: string;
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
    deleteConfirm: 'Apakah Anda yakin ingin menghapus data ini?',
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
    errorValidation: 'Mohon periksa kembali inputan Anda',
    errorNetwork: 'Kesalahan jaringan, silakan coba lagi',
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
    logout: 'Keluar',
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
    passwordStrength: {
      weak: 'Lemah',
      fair: 'Cukup',
      good: 'Baik',
      strong: 'Kuat',
    },
    errors: {
      AUTH_UNAUTHORIZED: 'Sesi berakhir, silakan login kembali',
      AUTH_FORBIDDEN: 'Anda tidak memiliki akses ke fitur ini',
      AUTH_TOKEN_EXPIRED: 'Token telah kedaluwarsa',
      AUTH_TOKEN_INVALID: 'Token tidak valid',
      AUTH_INVALID_CREDENTIALS: 'Email atau password salah',
      RATE_LIMIT_EXCEEDED: 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.',
      WEAK_PASSWORD: 'Password terlalu lemah',
      INVALID_RESET_TOKEN: 'Link reset password tidak valid',
      ACCESS_DENIED: 'Akses ditolak',
      CORPORATE_ACCESS_DENIED: 'Anda tidak memiliki akses ke perusahaan ini',
      DEPARTMENT_ACCESS_DENIED: 'Anda tidak memiliki akses ke departemen ini',
      VALIDATION_ERROR: 'Data tidak valid',
      INVALID_INPUT: 'Input tidak sesuai format',
      MISSING_REQUIRED_FIELD: 'Field wajib belum diisi',
      DUPLICATE_ENTRY: 'Data sudah ada di sistem',
      EMAIL_ALREADY_EXISTS: 'Email sudah terdaftar',
      USERNAME_ALREADY_EXISTS: 'Username sudah digunakan',
      NOT_FOUND: 'Data tidak ditemukan',
      USER_NOT_FOUND: 'User tidak ditemukan',
      CORPORATE_NOT_FOUND: 'Perusahaan tidak ditemukan',
      ROLE_NOT_FOUND: 'Peran tidak ditemukan',
      PROJECT_NOT_FOUND: 'Proyek tidak ditemukan',
      COST_CENTER_NOT_FOUND: 'Cost center tidak ditemukan',
      TARGET_NOT_FOUND: 'Target tidak ditemukan',
      TARGET_DELETED: 'Target berhasil dihapus',
      SUBSIDIARY_NOT_FOUND: 'Anak perusahaan tidak ditemukan',
      BANK_NOT_FOUND: 'Bank tidak ditemukan',
      CURRENCY_NOT_FOUND: 'Mata uang tidak ditemukan',
      CORPORATE_SECTOR_NOT_FOUND: 'Sektor korporasi tidak ditemukan',
      COST_CENTER_CATEGORY_NOT_FOUND: 'Kategori cost center tidak ditemukan',
      NOTIFICATION_CONFIG_NOT_FOUND: 'Konfigurasi notifikasi tidak ditemukan',
      NOTIFICATION_NOT_FOUND: 'Notifikasi tidak ditemukan',
      INTERNAL_SERVER_ERROR: 'Terjadi kesalahan pada server',
      DELETE_PROTECTED: 'Data tidak bisa dihapus karena masih digunakan',
      AUTH_UPDATE_FAILED: 'Gagal memperbarui data user',
      AUTH_ACTIVATION_FAILED: 'Gagal mengirim aktivasi',
      AUTH_RESET_FAILED: 'Gagal mereset password',
      EMAIL_SEND_FAILED: 'Gagal mengirim email',
      PERIOD_REQUIRED: 'Periode wajib diisi',
      MAINTENANCE_MODE: 'Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.',
      FILE_TOO_LARGE: 'Ukuran file terlalu besar',
      INVALID_FILE_TYPE: 'Format file tidak didukung',
    },
    selectCorporate: 'Pilih Perusahaan',
    createdAt: 'Dibuat Pada',
    noData: 'Tidak ada data ditemukan',
    saveChanges: 'Simpan Perubahan',
    confirmDelete: 'Konfirmasi Hapus',
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
    deleteConfirm: 'Are you sure you want to delete this item?',
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
    errorValidation: 'Please check your inputs',
    errorNetwork: 'Network error, please try again',
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
    logout: 'Log Out',
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
    passwordStrength: {
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
    },
    errors: {
      AUTH_UNAUTHORIZED: 'Session expired, please login again',
      AUTH_FORBIDDEN: 'You do not have access to this feature',
      AUTH_TOKEN_EXPIRED: 'Token has expired',
      AUTH_TOKEN_INVALID: 'Invalid token',
      AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
      RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
      WEAK_PASSWORD: 'Password is too weak',
      INVALID_RESET_TOKEN: 'Invalid password reset link',
      ACCESS_DENIED: 'Access denied',
      CORPORATE_ACCESS_DENIED: 'You do not have access to this corporate',
      DEPARTMENT_ACCESS_DENIED: 'You do not have access to this department',
      VALIDATION_ERROR: 'Invalid data provided',
      INVALID_INPUT: 'Invalid input format',
      MISSING_REQUIRED_FIELD: 'Required fields are missing',
      DUPLICATE_ENTRY: 'Data already exists in the system',
      EMAIL_ALREADY_EXISTS: 'Email is already registered',
      USERNAME_ALREADY_EXISTS: 'Username is already taken',
      NOT_FOUND: 'Resource not found',
      USER_NOT_FOUND: 'User not found',
      CORPORATE_NOT_FOUND: 'Corporate not found',
      ROLE_NOT_FOUND: 'Role not found',
      PROJECT_NOT_FOUND: 'Project not found',
      COST_CENTER_NOT_FOUND: 'Cost center not found',
      TARGET_NOT_FOUND: 'Target not found',
      TARGET_DELETED: 'Target deleted successfully',
      SUBSIDIARY_NOT_FOUND: 'Subsidiary not found',
      BANK_NOT_FOUND: 'Bank not found',
      CURRENCY_NOT_FOUND: 'Currency not found',
      CORPORATE_SECTOR_NOT_FOUND: 'Corporate sector not found',
      COST_CENTER_CATEGORY_NOT_FOUND: 'Cost center category not found',
      NOTIFICATION_CONFIG_NOT_FOUND: 'Notification configuration not found',
      NOTIFICATION_NOT_FOUND: 'Notification not found',
      INTERNAL_SERVER_ERROR: 'Internal server error occurred',
      DELETE_PROTECTED: 'Resource cannot be deleted because it is in use',
      AUTH_UPDATE_FAILED: 'Failed to update user data',
      AUTH_ACTIVATION_FAILED: 'Failed to send activation',
      AUTH_RESET_FAILED: 'Failed to reset password',
      EMAIL_SEND_FAILED: 'Failed to send email',
      PERIOD_REQUIRED: 'Period is required',
      MAINTENANCE_MODE: 'System is currently under maintenance. Please try again later.',
      FILE_TOO_LARGE: 'File size is too large',
      INVALID_FILE_TYPE: 'Unsupported file format',
    },
    selectCorporate: 'Select Corporate',
    createdAt: 'Created At',
    noData: 'No data found',
    saveChanges: 'Save Changes',
    confirmDelete: 'Confirm Delete',
  },
};
