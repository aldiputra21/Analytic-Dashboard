// i18n/weekly-cash-flow.ts
export type Locale = 'id' | 'en';

export interface WeeklyCashFlowCopy {
  title: string;
  subtitle: string;
  inputNew: string;
  searchPlaceholder: string;
  pagination: {
    showing: string;
    of: string;
    entries: string;
    rowsPerPage: string;
  };
  actions: {
    view: string;
    edit: string;
    delete: string;
  };
  tableHead: {
    period: string;
    week: string;
    corporateProject: string;
    cashIn: string;
    cashOut: string;
    netFlow: string;
    actions: string;
  };
  apply: string;
  clear: string;
  status: {
    empty: string;
    emptyDesc: string;
    loading: string;
    submitting: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    period: string;
    week: string;
    entityType: string;
    projectRelated: string;
    selectEntity: string;
    corporate: string;
    project: string;
    yes: string;
    no: string;
    projectSelectionDisabled: string;
    operatingActivity: string;
    investing: string;
    financing: string;
    netCashFlow: string;
    notes: string;
    notesPlaceholder: string;
    cancel: string;
    submit: string;
    month: string;
    year: string;
    code: string;
  };
  fields: {
    cashIn: string;
    cashOut: string;
    in: string;
    out: string;
  };
  alerts: {
    errorRequired: string;
    success: string;
    error: string;
    warning: string;
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteCancel: string;
    deleteDeleting: string;
    successDelete: string;
    errorDelete: string;
    successSave: string;
    successUpdate: string;
    errorSave: string;
    errorFetch: string;
    errorNetwork: string;
  };
}

export const weeklyCashFlowI18n: Record<Locale, WeeklyCashFlowCopy> = {
  id: {
    title: 'Arus Kas Mingguan',
    subtitle: 'Monitoring likuiditas mingguan per perusahaan atau proyek.',
    inputNew: 'Input Arus Kas',
    searchPlaceholder: 'Cari proyek...',
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman'
    },
    actions: {
      view: 'Detail',
      edit: 'Edit',
      delete: 'Hapus'
    },
    tableHead: {
      period: 'Periode',
      week: 'Minggu',
      corporateProject: 'Perusahaan / Proyek',
      cashIn: 'Kas Masuk',
      cashOut: 'Kas Keluar',
      netFlow: 'Kas Bersih',
      actions: 'Aksi',
    },
    apply: 'Terapkan',
    clear: 'Bersihkan',
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Coba sesuaikan filter atau tambahkan data baru.',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
    },
    modal: {
      createTitle: 'Input Arus Kas',
      editTitle: 'Perbarui Data',
      viewTitle: 'Detail Arus Kas',
      period: 'Periode',
      week: 'Minggu',
      entityType: 'Tipe Entitas',
      projectRelated: 'Terkait Proyek?',
      selectEntity: 'Pilih',
      corporate: 'Perusahaan',
      project: 'Proyek',
      yes: 'Ya',
      no: 'Tidak',
      projectSelectionDisabled: 'Pilihan proyek dinonaktifkan',
      operatingActivity: 'Aktivitas Operasional',
      investing: 'Investasi',
      financing: 'Pendanaan',
      netCashFlow: 'Arus Kas Bersih (Mingguan)',
      notes: 'Catatan tambahan',
      notesPlaceholder: 'Tambahkan catatan jika diperlukan...',
      cancel: 'Batal',
      submit: 'Simpan',
      month: 'Bulan',
      year: 'Tahun',
      code: 'Kode',
    },
    fields: {
      cashIn: 'Kas Masuk',
      cashOut: 'Kas Keluar',
      in: 'Masuk',
      out: 'Keluar',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      success: 'Berhasil',
      error: 'Error',
      warning: 'Peringatan',
      deleteTitle: 'Hapus data arus kas?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data arus kas untuk periode ini akan dihapus permanen dari sistem.',
      deleteConfirm: 'Ya, Hapus Arus Kas',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successDelete: 'Data arus kas berhasil dihapus',
      errorDelete: 'Gagal menghapus data',
      successSave: 'Data arus kas berhasil disimpan',
      successUpdate: 'Data arus kas diperbarui',
      errorSave: 'Gagal menyimpan data',
      errorFetch: 'Gagal memuat data arus kas',
      errorNetwork: 'Kesalahan jaringan',
    },
  },
  en: {
    title: 'Weekly Cash Flow',
    subtitle: 'Weekly liquidity monitoring per corporate or project.',
    inputNew: 'Input Cash Flow',
    searchPlaceholder: 'Search project...',
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page'
    },
    actions: {
      view: 'Details',
      edit: 'Edit',
      delete: 'Delete'
    },
    tableHead: {
      period: 'Period',
      week: 'Week',
      corporateProject: 'Corporate / Project',
      cashIn: 'Cash In',
      cashOut: 'Cash Out',
      netFlow: 'Net Flow',
      actions: 'Actions',
    },
    apply: 'Apply',
    clear: 'Clear',
    status: {
      empty: 'No Data',
      emptyDesc: 'Try adjusting filters or add new data.',
      loading: 'Loading Data...',
      submitting: 'Saving...',
    },
    modal: {
      createTitle: 'Input Cash Flow',
      editTitle: 'Update Data',
      viewTitle: 'Cash Flow Details',
      period: 'Period',
      week: 'Week',
      entityType: 'Entity Type',
      projectRelated: 'Project Related?',
      selectEntity: 'Select',
      corporate: 'Corporate',
      project: 'Project',
      yes: 'Yes',
      no: 'No',
      projectSelectionDisabled: 'Project selection disabled',
      operatingActivity: 'Operating Activity',
      investing: 'Investing',
      financing: 'Financing',
      netCashFlow: 'Net Cash Flow (Weekly)',
      notes: 'Additional Notes',
      notesPlaceholder: 'Add notes if needed...',
      cancel: 'Cancel',
      submit: 'Save',
      month: 'Month',
      year: 'Year',
      code: 'Code',
    },
    fields: {
      cashIn: 'Cash In',
      cashOut: 'Cash Out',
      in: 'In',
      out: 'Out',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      deleteTitle: 'Delete cash flow data?',
      deleteDesc: 'This action cannot be undone. Cash flow data for this period will be permanently deleted from the system.',
      deleteConfirm: 'Yes, Delete Cash Flow',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successDelete: 'Cash flow data deleted successfully',
      errorDelete: 'Failed to delete data',
      successSave: 'Cash flow data saved successfully',
      successUpdate: 'Cash flow data updated',
      errorSave: 'Failed to save data',
      errorFetch: 'Failed to load cash flow data',
      errorNetwork: 'Network error',
    },
  },
};
