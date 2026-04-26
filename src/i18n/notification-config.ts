import { Locale } from './commons';

export interface NotificationConfigCopy {
  title: string;
  subtitle: string;
  addNew: string;
  tableHead: {
    module: string;
    eventType: string;
    role: string;
    isActive: string;
  };
  filter: {
    module: string;
    allStatuses: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    module: string;
    eventType: string;
    role: string;
  };
  module: {
    placeholder: string;
  };
  eventType: {
    placeholder: string;
  };
  role: {
    placeholder: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    errorSave: string;
    errorUpdate: string;
    errorDelete: string;
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
    subtitle: 'Atur siapa yang menerima notifikasi untuk modul dan event tertentu.',
    addNew: 'Tambah Konfigurasi',
    tableHead: {
      module: 'Modul',
      eventType: 'Tipe Event',
      role: 'Role Penerima',
      isActive: 'Status',
    },
    filter: {
      module: 'Cari modul...',
      allStatuses: 'Semua Status',
    },
    status: {
      empty: 'Tidak ada konfigurasi',
      emptyDesc: 'Belum ada konfigurasi notifikasi yang dibuat.',
    },
    modal: {
      createTitle: 'Tambah Konfigurasi Notifikasi',
      editTitle: 'Edit Konfigurasi Notifikasi',
      viewTitle: 'Detail Konfigurasi Notifikasi',
      module: 'Modul Sistem',
      eventType: 'Jenis Kejadian (Event)',
      role: 'Role Penerima',
    },
    module: {
      placeholder: 'Contoh: cfd, crm, public',
    },
    eventType: {
      placeholder: 'Contoh: target.created, corporate.updated',
    },
    role: {
      placeholder: 'Pilih role...',
    },
    alerts: {
      deleteTitle: 'Hapus konfigurasi?',
      deleteDesc: 'Tindakan ini akan menghapus pengaturan notifikasi untuk role ini.',
      successSave: 'Konfigurasi berhasil disimpan',
      successUpdate: 'Konfigurasi berhasil diperbarui',
      successDelete: 'Konfigurasi berhasil dihapus',
      errorSave: 'Gagal menyimpan konfigurasi',
      errorUpdate: 'Gagal memperbarui konfigurasi',
      errorDelete: 'Gagal menghapus konfigurasi',
      errorDuplicate: 'Konfigurasi untuk modul, event, dan role ini sudah ada',
    },
    validation: {
      moduleRequired: 'Modul harus diisi',
      eventTypeRequired: 'Tipe event harus diisi',
      roleRequired: 'Role harus dipilih',
    },
  },
  en: {
    title: 'Notification Configuration',
    subtitle: 'Manage who receives notifications for specific modules and events.',
    addNew: 'Add Configuration',
    tableHead: {
      module: 'Module',
      eventType: 'Event Type',
      role: 'Recipient Role',
      isActive: 'Status',
    },
    filter: {
      module: 'Search module...',
      allStatuses: 'All Statuses',
    },
    status: {
      empty: 'No configuration found',
      emptyDesc: 'No notification configurations have been created yet.',
    },
    modal: {
      createTitle: 'Add Notification Configuration',
      editTitle: 'Edit Notification Configuration',
      viewTitle: 'Notification Config Details',
      module: 'System Module',
      eventType: 'Event Type',
      role: 'Recipient Role',
    },
    module: {
      placeholder: 'Example: cfd, crm, public',
    },
    eventType: {
      placeholder: 'Example: target.created, corporate.updated',
    },
    role: {
      placeholder: 'Select role...',
    },
    alerts: {
      deleteTitle: 'Delete configuration?',
      deleteDesc: 'This will remove the notification settings for this role.',
      successSave: 'Configuration saved successfully',
      successUpdate: 'Configuration updated successfully',
      successDelete: 'Configuration deleted successfully',
      errorSave: 'Failed to save configuration',
      errorUpdate: 'Failed to update configuration',
      errorDelete: 'Failed to delete configuration',
      errorDuplicate: 'Configuration for this module, event, and role already exists',
    },
    validation: {
      moduleRequired: 'Module is required',
      eventTypeRequired: 'Event type is required',
      roleRequired: 'Role must be selected',
    },
  },
};
