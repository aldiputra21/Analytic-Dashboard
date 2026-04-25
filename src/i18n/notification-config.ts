// i18n/notification-config.ts
import { Locale } from './commons';

export interface NotificationConfigCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    module: string;
    eventType: string;
    role: string;
    isActive: string;
    actions: string;
  };
  module: {
    label: string;
    placeholder: string;
    bankLoan: string;
    realization: string;
    cashFlow: string;
  };
  eventType: {
    label: string;
    placeholder: string;
    installmentDue: string;
    installmentOverdue: string;
    loanCreated: string;
    realizationCreated: string;
    realizationApproved: string;
  };
  role: {
    label: string;
    placeholder: string;
  };
  isActive: {
    label: string;
    active: string;
    inactive: string;
  };
  status: {
    loading: string;
    submitting: string;
    empty: string;
    emptyDesc: string;
  };
  pagination: {
    showing: string;
    of: string;
    entries: string;
    rowsPerPage: string;
  };
  filter: {
    module: string;
    eventType: string;
    isActive: string;
    allModules: string;
    allEventTypes: string;
    allStatuses: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    module: string;
    eventType: string;
    role: string;
    isActive: string;
    cancel: string;
    submit: string;
    close: string;
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
    successToggle: string;
    errorSave: string;
    errorDelete: string;
    errorFetch: string;
    errorNetwork: string;
    errorDuplicate: string;
  };
  validation: {
    moduleRequired: string;
    eventTypeRequired: string;
    roleRequired: string;
  };
}

export const notificationConfigI18n: Record<Locale, NotificationConfigCopy> = {
  id: {
    title: 'Konfigurasi Notifikasi',
    subtitle: 'Kelola pengaturan notifikasi untuk setiap modul dan peran pengguna.',
    addNew: 'Tambah Konfigurasi',
    searchPlaceholder: 'Cari modul atau tipe event...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      module: 'Modul',
      eventType: 'Tipe Event',
      role: 'Peran',
      isActive: 'Aktif',
      actions: 'Aksi',
    },
    module: {
      label: 'Modul',
      placeholder: 'Masukkan nama modul',
      bankLoan: 'Pinjaman Bank',
      realization: 'Realisasi',
      cashFlow: 'Arus Kas',
    },
    eventType: {
      label: 'Tipe Event',
      placeholder: 'Masukkan tipe event',
      installmentDue: 'Cicilan Jatuh Tempo',
      installmentOverdue: 'Cicilan Terlambat',
      loanCreated: 'Pinjaman Dibuat',
      realizationCreated: 'Realisasi Dibuat',
      realizationApproved: 'Realisasi Disetujui',
    },
    role: {
      label: 'Peran',
      placeholder: 'Pilih peran penerima notifikasi',
    },
    isActive: {
      label: 'Status Aktif',
      active: 'Aktif',
      inactive: 'Nonaktif',
    },
    status: {
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada konfigurasi notifikasi yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    filter: {
      module: 'Modul',
      eventType: 'Tipe Event',
      isActive: 'Status',
      allModules: 'Semua Modul',
      allEventTypes: 'Semua Event',
      allStatuses: 'Semua Status',
    },
    modal: {
      createTitle: 'Tambah Konfigurasi Notifikasi',
      editTitle: 'Edit Konfigurasi Notifikasi',
      viewTitle: 'Detail Konfigurasi Notifikasi',
      module: 'Modul',
      eventType: 'Tipe Event',
      role: 'Peran',
      isActive: 'Aktifkan Notifikasi',
      cancel: 'Batal',
      submit: 'Simpan',
      close: 'Tutup',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus konfigurasi notifikasi?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Konfigurasi notifikasi ini akan dihapus.',
      deleteConfirm: 'Ya, Hapus Konfigurasi',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Konfigurasi notifikasi berhasil ditambahkan',
      successUpdate: 'Konfigurasi notifikasi berhasil diperbarui',
      successDelete: 'Konfigurasi notifikasi berhasil dihapus',
      successToggle: 'Status notifikasi berhasil diubah',
      errorSave: 'Gagal menyimpan konfigurasi notifikasi',
      errorDelete: 'Gagal menghapus konfigurasi notifikasi',
      errorFetch: 'Gagal memuat data konfigurasi notifikasi',
      errorNetwork: 'Kesalahan jaringan',
      errorDuplicate: 'Kombinasi modul, tipe event, dan peran sudah ada',
    },
    validation: {
      moduleRequired: 'Modul wajib dipilih',
      eventTypeRequired: 'Tipe event wajib dipilih',
      roleRequired: 'Peran wajib dipilih',
    },
  },
  en: {
    title: 'Notification Configuration',
    subtitle: 'Manage notification settings for each module and user role.',
    addNew: 'Add Configuration',
    searchPlaceholder: 'Search module or event type...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      module: 'Module',
      eventType: 'Event Type',
      role: 'Role',
      isActive: 'Active',
      actions: 'Actions',
    },
    module: {
      label: 'Module',
      placeholder: 'Enter module name',
      bankLoan: 'Bank Loan',
      realization: 'Realization',
      cashFlow: 'Cash Flow',
    },
    eventType: {
      label: 'Event Type',
      placeholder: 'Enter event type',
      installmentDue: 'Installment Due',
      installmentOverdue: 'Installment Overdue',
      loanCreated: 'Loan Created',
      realizationCreated: 'Realization Created',
      realizationApproved: 'Realization Approved',
    },
    role: {
      label: 'Role',
      placeholder: 'Select notification recipient role',
    },
    isActive: {
      label: 'Active Status',
      active: 'Active',
      inactive: 'Inactive',
    },
    status: {
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No notification configurations registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    filter: {
      module: 'Module',
      eventType: 'Event Type',
      isActive: 'Status',
      allModules: 'All Modules',
      allEventTypes: 'All Events',
      allStatuses: 'All Statuses',
    },
    modal: {
      createTitle: 'Add Notification Configuration',
      editTitle: 'Edit Notification Configuration',
      viewTitle: 'Notification Configuration Detail',
      module: 'Module',
      eventType: 'Event Type',
      role: 'Role',
      isActive: 'Enable Notification',
      cancel: 'Cancel',
      submit: 'Save',
      close: 'Close',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete notification configuration?',
      deleteDesc: 'This action cannot be undone. This notification configuration will be deleted.',
      deleteConfirm: 'Yes, Delete Configuration',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Notification configuration added successfully',
      successUpdate: 'Notification configuration updated successfully',
      successDelete: 'Notification configuration deleted successfully',
      successToggle: 'Notification status updated successfully',
      errorSave: 'Failed to save notification configuration',
      errorDelete: 'Failed to delete notification configuration',
      errorFetch: 'Failed to load notification configuration data',
      errorNetwork: 'Network error',
      errorDuplicate: 'Combination of module, event type, and role already exists',
    },
    validation: {
      moduleRequired: 'Module is required',
      eventTypeRequired: 'Event type is required',
      roleRequired: 'Role is required',
    },
  },
};
