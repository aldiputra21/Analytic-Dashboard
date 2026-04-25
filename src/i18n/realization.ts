// i18n/realization.ts
import { Locale } from './commons';

export interface RealizationCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    entityType: string;
    entity: string;
    transactionDate: string;
    category: string;
    amount: string;
    attachments: string;
    actions: string;
  };
  status: {
    loading: string;
    submitting: string;
    empty: string;
    emptyDesc: string;
    uploading: string;
    deleting: string;
  };
  pagination: {
    showing: string;
    of: string;
    entries: string;
    rowsPerPage: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    entityType: string;
    department: string;
    project: string;
    departmentId: string;
    projectId: string;
    transactionDate: string;
    category: string;
    cashIn: string;
    cashOut: string;
    amount: string;
    notes: string;
    basicInfo: string;
    attachmentSection: string;
    dropOrClick: string;
    fileHint: string;
    cancel: string;
    submit: string;
    close: string;
    uploadAttachment: string;
    downloadAttachment: string;
    deleteAttachment: string;
    noAttachments: string;
  };
  filters: {
    entityType: string;
    category: string;
    dateRange: string;
    dateFrom: string;
    dateTo: string;
  };
  alerts: {
    errorRequired: string;
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteCancel: string;
    deleteDeleting: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    errorSave: string;
    errorDelete: string;
    errorFetch: string;
    errorNetwork: string;
    invalidFileType: string;
    invalidFileDesc: string;
    fileTooLarge: string;
    fileTooLargeDesc: string;
    successUpload: string;
    errorUpload: string;
    successDeleteAttachment: string;
    errorDeleteAttachment: string;
    errorFetchMasterData: string;
  };
  validation: {
    departmentRequired: string;
    projectRequired: string;
    transactionDateRequired: string;
    amountMin: string;
  };
}

export const realizationI18n: Record<Locale, RealizationCopy> = {
  id: {
    title: 'Realisasi Kas',
    subtitle: 'Catat realisasi kas (cash-in/cash-out) per departemen atau proyek.',
    addNew: 'Tambah Realisasi',
    searchPlaceholder: 'Cari departemen, proyek, atau catatan...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      entityType: 'Tipe Entitas',
      entity: 'Departemen / Proyek',
      transactionDate: 'Tanggal Transaksi',
      category: 'Kategori',
      amount: 'Jumlah',
      attachments: 'Lampiran',
      actions: 'Aksi',
    },
    status: {
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data realisasi kas yang terdaftar.',
      uploading: 'Mengunggah...',
      deleting: 'Menghapus...',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    modal: {
      createTitle: 'Tambah Realisasi Kas Baru',
      editTitle: 'Edit Realisasi Kas',
      viewTitle: 'Detail Realisasi Kas',
      entityType: 'Tipe Entitas',
      department: 'Departemen',
      project: 'Proyek',
      departmentId: 'Departemen',
      projectId: 'Proyek',
      transactionDate: 'Tanggal Transaksi',
      category: 'Kategori',
      cashIn: 'Kas Masuk',
      cashOut: 'Kas Keluar',
      amount: 'Jumlah',
      notes: 'Catatan',
      basicInfo: 'Informasi Dasar',
      attachmentSection: 'Lampiran File',
      dropOrClick: 'Lepas atau klik',
      fileHint: 'Dokumen pendukung (PDF, Excel, Word, Gambar)\nMax 10MB',
      cancel: 'Batal',
      submit: 'Simpan',
      close: 'Tutup',
      uploadAttachment: 'Unggah Lampiran',
      downloadAttachment: 'Unduh',
      deleteAttachment: 'Hapus',
      noAttachments: 'Belum ada lampiran',
    },
    filters: {
      entityType: 'Tipe Entitas',
      category: 'Kategori',
      dateRange: 'Rentang Tanggal',
      dateFrom: 'Dari Tanggal',
      dateTo: 'Sampai Tanggal',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus realisasi?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Realisasi dan lampiran terkait akan dihapus.',
      deleteConfirm: 'Ya, Hapus Realisasi',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Realisasi berhasil ditambahkan',
      successUpdate: 'Realisasi berhasil diperbarui',
      successDelete: 'Realisasi berhasil dihapus',
      errorSave: 'Gagal menyimpan realisasi',
      errorDelete: 'Gagal menghapus realisasi',
      errorFetch: 'Gagal memuat data realisasi',
      errorNetwork: 'Kesalahan jaringan',
      invalidFileType: 'Tipe file tidak valid',
      invalidFileDesc: 'Hanya file PDF, Excel, Word, dan Gambar yang diperbolehkan.',
      fileTooLarge: 'Ukuran file terlalu besar',
      fileTooLargeDesc: 'Ukuran file maksimal adalah 10MB.',
      successUpload: 'Lampiran berhasil diunggah',
      errorUpload: 'Gagal mengunggah lampiran',
      successDeleteAttachment: 'Lampiran berhasil dihapus',
      errorDeleteAttachment: 'Gagal menghapus lampiran',
      errorFetchMasterData: 'Gagal memuat data master (Departemen/Proyek)',
    },
    validation: {
      departmentRequired: 'Departemen wajib dipilih',
      projectRequired: 'Proyek wajib dipilih',
      transactionDateRequired: 'Tanggal transaksi wajib diisi',
      amountMin: 'Jumlah harus lebih besar dari 0',
    },
  },
  en: {
    title: 'Cash Realizations',
    subtitle: 'Record cash realizations (cash-in/cash-out) per department or project.',
    addNew: 'Add Realization',
    searchPlaceholder: 'Search department, project, or notes...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      entityType: 'Entity Type',
      entity: 'Department / Project',
      transactionDate: 'Transaction Date',
      category: 'Category',
      amount: 'Amount',
      attachments: 'Attachments',
      actions: 'Actions',
    },
    status: {
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No cash realizations registered yet.',
      uploading: 'Uploading...',
      deleting: 'Deleting...',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    modal: {
      createTitle: 'Add New Cash Realization',
      editTitle: 'Edit Cash Realization',
      viewTitle: 'Cash Realization Details',
      entityType: 'Entity Type',
      department: 'Department',
      project: 'Project',
      departmentId: 'Department',
      projectId: 'Project',
      transactionDate: 'Transaction Date',
      category: 'Category',
      cashIn: 'Cash In',
      cashOut: 'Cash Out',
      amount: 'Amount',
      notes: 'Notes',
      basicInfo: 'Basic Information',
      attachmentSection: 'File Attachments',
      dropOrClick: 'Drop or click',
      fileHint: 'Supporting documents (PDF, Excel, Word, Image)\nMax 10MB',
      cancel: 'Cancel',
      submit: 'Save',
      close: 'Close',
      uploadAttachment: 'Upload Attachment',
      downloadAttachment: 'Download',
      deleteAttachment: 'Delete',
      noAttachments: 'No attachments yet',
    },
    filters: {
      entityType: 'Entity Type',
      category: 'Category',
      dateRange: 'Date Range',
      dateFrom: 'From Date',
      dateTo: 'To Date',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete realization?',
      deleteDesc: 'This action cannot be undone. Realization and related attachments will be deleted.',
      deleteConfirm: 'Yes, Delete Realization',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Realization added successfully',
      successUpdate: 'Realization updated successfully',
      successDelete: 'Realization deleted successfully',
      errorSave: 'Failed to save realization',
      errorDelete: 'Failed to delete realization',
      errorFetch: 'Failed to load realization data',
      errorNetwork: 'Network error',
      invalidFileType: 'Invalid file type',
      invalidFileDesc: 'Only PDF, Excel, Word, and Image files are allowed.',
      fileTooLarge: 'File too large',
      fileTooLargeDesc: 'Maximum file size is 10MB.',
      successUpload: 'Attachment uploaded successfully',
      errorUpload: 'Failed to upload attachment',
      successDeleteAttachment: 'Attachment deleted successfully',
      errorDeleteAttachment: 'Failed to delete attachment',
      errorFetchMasterData: 'Failed to load master data (Department/Project)',
    },
    validation: {
      departmentRequired: 'Department is required',
      projectRequired: 'Project is required',
      transactionDateRequired: 'Transaction date is required',
      amountMin: 'Amount must be greater than 0',
    },
  },
};
