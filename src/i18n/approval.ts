// i18n/approval.ts - Translations for the Dynamic Approval Module
import { Locale } from './commons';

export interface ApprovalCopy {
  title: string;
  subtitle: string;
  configTitle: string;
  configSubtitle: string;

  // Status labels
  status: {
    draft: string;
    pending: string;
    approved: string;
    rejected: string;
    cancelled: string;
  };

  // Tab labels
  tabs: {
    formData: string;
    approvalHistory: string;
    dataHistory: string;
  };

  // Sub-tabs for edit action
  subTabs: {
    requestData: string;
    originalData: string;
  };

  // Action buttons
  actions: {
    submitRequest: string;
    approve: string;
    reject: string;
    resubmit: string;
    cancelApproval: string;
    viewDiff: string;
  };

  // Table headers
  tableHead: {
    no: string;
    title: string;
    module: string;
    requester: string;
    currentStep: string;
    status: string;
    date: string;
    actions: string;
    version: string;
    submittedBy: string;
  };

  // Timeline labels
  timeline: {
    created: string;
    submit: string;
    approve: string;
    reject: string;
    cancel: string;
    resubmit: string;
    cycle: string;
  };

  // Badges
  badges: {
    awaitingMyAction: string;
  };

  // Modal labels
  modal: {
    approveTitle: string;
    approveDesc: string;
    rejectTitle: string;
    rejectNotesLabel: string;
    rejectNotesPlaceholder: string;
    cancelTitle: string;
    cancelNotesLabel: string;
    cancelNotesPlaceholder: string;
    diffTitle: string;
    compareVersion: string;
    previousVersion: string;
    noPayloadHistory: string;
  };

  // Toast messages
  toast: {
    draftCreated: string;
    submitted: string;
    approved: string;
    rejected: string;
    cancelled: string;
    errorSubmit: string;
    errorApprove: string;
    errorReject: string;
    errorCancel: string;
  };

  // Validation
  validation: {
    notesRequired: string;
  };

  // Empty states
  empty: string;
  emptyDesc: string;

  // Filters
  filters: {
    allStatus: string;
    search: string;
    searchPlaceholder: string;
  };

    // Workflow config
  config: {
    module: string;
    entityType: string;
    action: string;
    actionLabels: {
      create: string;
      edit: string;
      delete: string;
    };
    name: string;
    nameEn: string;
    callbackHandler: string;
    viewComponent: string;
    steps: string;
    stepOrder: string;
    stepType: string;
    requiredRole: string;
    isActive: string;
    addStep: string;
    removeStep: string;
    makerRole: string;
  };
}

export const approvalI18n: Record<Locale, ApprovalCopy> = {
  id: {
    title: 'Daftar Persetujuan',
    subtitle: 'Pantau dan kelola semua permohonan persetujuan',
    configTitle: 'Konfigurasi Approval',
    configSubtitle: 'Kelola workflow dan langkah persetujuan',

    status: {
      draft: 'Draft',
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      cancelled: 'Dibatalkan',
    },

    tabs: {
      formData: 'Data Permohonan',
      approvalHistory: 'Riwayat Approval',
      dataHistory: 'Riwayat Perubahan',
    },

    subTabs: {
      requestData: 'Data Permohonan',
      originalData: 'Data Awal',
    },

    actions: {
      submitRequest: 'Ajukan Permohonan',
      approve: 'Setujui',
      reject: 'Tolak',
      resubmit: 'Ajukan Ulang',
      cancelApproval: 'Batalkan Permohonan',
      viewDiff: 'Lihat Perubahan',
    },

    tableHead: {
      no: 'No.',
      title: 'Judul',
      module: 'Modul',
      requester: 'Pemohon',
      currentStep: 'Step Saat Ini',
      status: 'Status',
      date: 'Tanggal',
      actions: 'Aksi',
      version: 'Versi',
      submittedBy: 'Diajukan Oleh',
    },

    timeline: {
      created: 'Dibuat',
      submit: 'Diajukan',
      approve: 'Disetujui',
      reject: 'Ditolak',
      cancel: 'Dibatalkan',
      resubmit: 'Diajukan Ulang',
      cycle: 'Siklus ke-{n}',
    },

    badges: {
      awaitingMyAction: 'Menunggu Aksi Saya',
    },

    modal: {
      approveTitle: 'Konfirmasi Persetujuan',
      approveDesc: 'Apakah Anda yakin ingin menyetujui permohonan ini?',
      rejectTitle: 'Tolak Permohonan',
      rejectNotesLabel: 'Alasan Penolakan',
      rejectNotesPlaceholder: 'Masukkan alasan penolakan...',
      cancelTitle: 'Batalkan Permohonan',
      cancelNotesLabel: 'Alasan Pembatalan',
      cancelNotesPlaceholder: 'Masukkan alasan pembatalan...',
      diffTitle: 'Perbandingan Versi Data',
      compareVersion: 'Versi Ini',
      previousVersion: 'Versi Sebelumnya',
      noPayloadHistory: 'Tidak ada riwayat perubahan data',
    },

    toast: {
      draftCreated: 'Draft permohonan berhasil dibuat',
      submitted: 'Permohonan berhasil diajukan ke approver',
      approved: 'Permohonan berhasil disetujui',
      rejected: 'Permohonan berhasil ditolak',
      cancelled: 'Permohonan berhasil dibatalkan',
      errorSubmit: 'Gagal mengajukan permohonan',
      errorApprove: 'Gagal menyetujui permohonan',
      errorReject: 'Gagal menolak permohonan',
      errorCancel: 'Gagal membatalkan permohonan',
    },

    validation: {
      notesRequired: 'Catatan wajib diisi',
    },

    empty: 'Belum ada permohonan',
    emptyDesc: 'Permohonan approval akan muncul di sini',

    filters: {
      allStatus: 'Semua Status',
      search: 'Cari',
      searchPlaceholder: 'Cari berdasarkan judul...',
    },

    config: {
      module: 'Modul',
      entityType: 'Tipe Entitas',
      action: 'Aksi',
      actionLabels: {
        create: 'Tambah',
        edit: 'Ubah',
        delete: 'Hapus',
      },
      name: 'Nama Workflow (ID)',
      nameEn: 'Nama Workflow (EN)',
      callbackHandler: 'Callback Handler',
      viewComponent: 'View Component',
      steps: 'Langkah Persetujuan',
      stepOrder: 'Urutan',
      stepType: 'Tipe Step',
      requiredRole: 'Role yang Diperlukan',
      isActive: 'Aktif',
      addStep: 'Tambah Langkah',
      removeStep: 'Hapus Langkah',
      makerRole: 'Role Pembuat (Maker)',
    },
  },

  en: {
    title: 'Approvals',
    subtitle: 'Monitor and manage all approval requests',
    configTitle: 'Approval Configuration',
    configSubtitle: 'Manage approval workflows and steps',

    status: {
      draft: 'Draft',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    },

    tabs: {
      formData: 'Request Data',
      approvalHistory: 'Approval History',
      dataHistory: 'Change History',
    },

    subTabs: {
      requestData: 'Request Data',
      originalData: 'Original Data',
    },

    actions: {
      submitRequest: 'Submit Request',
      approve: 'Approve',
      reject: 'Reject',
      resubmit: 'Resubmit',
      cancelApproval: 'Cancel Request',
      viewDiff: 'View Changes',
    },

    tableHead: {
      no: 'No.',
      title: 'Title',
      module: 'Module',
      requester: 'Requester',
      currentStep: 'Current Step',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      version: 'Version',
      submittedBy: 'Submitted By',
    },

    timeline: {
      created: 'Created',
      submit: 'Submitted',
      approve: 'Approved',
      reject: 'Rejected',
      cancel: 'Cancelled',
      resubmit: 'Resubmitted',
      cycle: 'Cycle {n}',
    },

    badges: {
      awaitingMyAction: 'Awaiting My Action',
    },

    modal: {
      approveTitle: 'Confirm Approval',
      approveDesc: 'Are you sure you want to approve this request?',
      rejectTitle: 'Reject Request',
      rejectNotesLabel: 'Rejection Reason',
      rejectNotesPlaceholder: 'Enter rejection reason...',
      cancelTitle: 'Cancel Request',
      cancelNotesLabel: 'Cancellation Reason',
      cancelNotesPlaceholder: 'Enter cancellation reason...',
      diffTitle: 'Data Version Comparison',
      compareVersion: 'This Version',
      previousVersion: 'Previous Version',
      noPayloadHistory: 'No data change history available',
    },

    toast: {
      draftCreated: 'Draft request created successfully',
      submitted: 'Request submitted to approver',
      approved: 'Request approved successfully',
      rejected: 'Request rejected',
      cancelled: 'Request cancelled',
      errorSubmit: 'Failed to submit request',
      errorApprove: 'Failed to approve request',
      errorReject: 'Failed to reject request',
      errorCancel: 'Failed to cancel request',
    },

    validation: {
      notesRequired: 'Notes are required',
    },

    empty: 'No requests yet',
    emptyDesc: 'Approval requests will appear here',

    filters: {
      allStatus: 'All Statuses',
      search: 'Search',
      searchPlaceholder: 'Search by title...',
    },

    config: {
      module: 'Module',
      entityType: 'Entity Type',
      action: 'Action',
      actionLabels: {
        create: 'Create',
        edit: 'Edit',
        delete: 'Delete',
      },
      name: 'Workflow Name (ID)',
      nameEn: 'Workflow Name (EN)',
      callbackHandler: 'Callback Handler',
      viewComponent: 'View Component',
      steps: 'Approval Steps',
      stepOrder: 'Order',
      stepType: 'Step Type',
      requiredRole: 'Required Role',
      isActive: 'Active',
      addStep: 'Add Step',
      removeStep: 'Remove Step',
      makerRole: 'Maker Role',
    },
  },
};
