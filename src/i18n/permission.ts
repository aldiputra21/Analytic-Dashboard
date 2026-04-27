import { Locale } from './commons';

export interface PermissionCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  tableHead: {
    key: string;
    module: string;
    description: string;
    status: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    key: string;
    keyHint: string;
    module: string;
    description: string;
    isActive: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    successStatus: string;
    errorSave: string;
    errorDelete: string;
  };
  validation: {
    keyRequired: string;
    keyFormat: string;
    moduleRequired: string;
    descriptionRequired: string;
  };
}

export const permissionI18n: Record<Locale, PermissionCopy> = {
  id: {
    title: 'Manajemen Permission',
    subtitle: 'Kelola hak akses sistem.',
    addNew: 'Tambah Permission',
    searchPlaceholder: 'Cari key atau module...',
    tableHead: {
      key: 'Key',
      module: 'Module',
      description: 'Deskripsi',
      status: 'Status',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada permission yang terdaftar.',
    },
    modal: {
      createTitle: 'Tambah Permission Baru',
      editTitle: 'Edit Permission',
      key: 'Key',
      keyHint: 'Format: module.resource.action (contoh: cfd.users.read)',
      module: 'Module',
      description: 'Deskripsi',
      isActive: 'Aktif',
    },
    alerts: {
      deleteTitle: 'Hapus permission?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan.',
      successSave: 'Permission berhasil ditambahkan',
      successUpdate: 'Permission berhasil diperbarui',
      successDelete: 'Permission berhasil dihapus',
      successStatus: 'Status permission berhasil diubah',
      errorSave: 'Gagal menyimpan permission',
      errorDelete: 'Gagal menghapus permission',
    },
    validation: {
      keyRequired: 'Key wajib diisi',
      keyFormat: 'Key harus mengikuti format module.resource.action',
      moduleRequired: 'Module wajib diisi',
      descriptionRequired: 'Deskripsi wajib diisi',
    },
  },
  en: {
    title: 'Permission Management',
    subtitle: 'Manage system access rights.',
    addNew: 'Add Permission',
    searchPlaceholder: 'Search key or module...',
    tableHead: {
      key: 'Key',
      module: 'Module',
      description: 'Description',
      status: 'Status',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'No permissions registered yet.',
    },
    modal: {
      createTitle: 'Add New Permission',
      editTitle: 'Edit Permission',
      key: 'Key',
      keyHint: 'Format: module.resource.action (example: cfd.users.read)',
      module: 'Module',
      description: 'Description',
      isActive: 'Active',
    },
    alerts: {
      deleteTitle: 'Delete permission?',
      deleteDesc: 'This action cannot be undone.',
      successSave: 'Permission added successfully',
      successUpdate: 'Permission updated successfully',
      successDelete: 'Permission deleted successfully',
      successStatus: 'Permission status updated successfully',
      errorSave: 'Failed to save permission',
      errorDelete: 'Failed to delete permission',
    },
    validation: {
      keyRequired: 'Key is required',
      keyFormat: 'Key must follow format module.resource.action',
      moduleRequired: 'Module is required',
      descriptionRequired: 'Description is required',
    },
  },
};
