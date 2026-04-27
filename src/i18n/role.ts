import { Locale } from './commons';

export interface RoleCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  tableHead: {
    name: string;
    scope: string;
    description: string;
    permissions: string;
    status: string;
  };
  scopeLabels: {
    system: string;
    corporate: string;
    department: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    basicInfo: string;
    name: string;
    namePlaceholder: string;
    scope: string;
    description: string;
    descriptionPlaceholder: string;
    isActive: string;
    managePermissions: string;
  };
  permissionsModal: {
    title: string;
    selectAll: string;
    deselectAll: string;
    noPermissions: string;
    save: string;
    selected: string;
    loading: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    successStatus: string;
    successPermissions: string;
    errorSave: string;
    errorDelete: string;
    errorPermissions: string;
  };
  validation: {
    nameRequired: string;
    nameMin: string;
    scopeRequired: string;
    descriptionRequired: string;
  };
}

export const roleI18n: Record<Locale, RoleCopy> = {
  id: {
    title: 'Manajemen Role',
    subtitle: 'Kelola role dan permission sistem.',
    addNew: 'Tambah Role',
    searchPlaceholder: 'Cari nama role...',
    tableHead: {
      name: 'Nama',
      scope: 'Scope',
      description: 'Deskripsi',
      permissions: 'Permission',
      status: 'Status',
    },
    scopeLabels: {
      system: 'Sistem',
      corporate: 'Perusahaan',
      department: 'Departemen',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada role yang terdaftar.',
    },
    modal: {
      createTitle: 'Tambah Role Baru',
      editTitle: 'Edit Role',
      basicInfo: 'Informasi Dasar',
      name: 'Nama Role',
      namePlaceholder: 'misal: Admin, Manajer, User',
      scope: 'Scope',
      description: 'Deskripsi',
      descriptionPlaceholder: 'Jelaskan tujuan role ini...',
      isActive: 'Aktif',
      managePermissions: 'Kelola Permission',
    },
    permissionsModal: {
      title: 'Kelola Permission untuk Role',
      selectAll: 'Pilih Semua',
      deselectAll: 'Batal Pilih Semua',
      noPermissions: 'Tidak ada permission tersedia',
      save: 'Simpan Permission',
      selected: '{count} Terpilih',
      loading: 'Memuat permission...',
    },
    alerts: {
      deleteTitle: 'Hapus role?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan.',
      successSave: 'Role berhasil ditambahkan',
      successUpdate: 'Role berhasil diperbarui',
      successDelete: 'Role berhasil dihapus',
      successStatus: 'Status role berhasil diubah',
      successPermissions: 'Permission role berhasil diperbarui',
      errorSave: 'Gagal menyimpan role',
      errorDelete: 'Gagal menghapus role',
      errorPermissions: 'Gagal memperbarui permission role',
    },
    validation: {
      nameRequired: 'Nama role wajib diisi',
      nameMin: 'Nama role minimal 3 karakter',
      scopeRequired: 'Scope wajib dipilih',
      descriptionRequired: 'Deskripsi wajib diisi',
    },
  },
  en: {
    title: 'Role Management',
    subtitle: 'Manage roles and system permissions.',
    addNew: 'Add Role',
    searchPlaceholder: 'Search role name...',
    tableHead: {
      name: 'Name',
      scope: 'Scope',
      description: 'Description',
      permissions: 'Permissions',
      status: 'Status',
    },
    scopeLabels: {
      system: 'System',
      corporate: 'Corporate',
      department: 'Department',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'No roles registered yet.',
    },
    modal: {
      createTitle: 'Add New Role',
      editTitle: 'Edit Role',
      basicInfo: 'Basic Information',
      name: 'Role Name',
      namePlaceholder: 'e.g. Admin, Manager, User',
      scope: 'Scope',
      description: 'Description',
      descriptionPlaceholder: "Describe the role's purpose...",
      isActive: 'Active',
      managePermissions: 'Manage Permissions',
    },
    permissionsModal: {
      title: 'Manage Permissions for Role',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      noPermissions: 'No permissions available',
      save: 'Save Permissions',
      selected: '{count} Selected',
      loading: 'Loading permissions...',
    },
    alerts: {
      deleteTitle: 'Delete role?',
      deleteDesc: 'This action cannot be undone.',
      successSave: 'Role added successfully',
      successUpdate: 'Role updated successfully',
      successDelete: 'Role deleted successfully',
      successStatus: 'Role status updated successfully',
      successPermissions: 'Role permissions updated successfully',
      errorSave: 'Failed to save role',
      errorDelete: 'Failed to delete role',
      errorPermissions: 'Failed to update role permissions',
    },
    validation: {
      nameRequired: 'Role name is required',
      nameMin: 'Role name must be at least 3 characters',
      scopeRequired: 'Scope is required',
      descriptionRequired: 'Description is required',
    },
  },
};
