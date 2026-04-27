import { Locale } from './commons';

export interface UserManagerCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  allVerificationStatus: string;
  tableHead: {
    name: string;
    email: string;
    emailVerified: string;
    status: string;
  };
  emailVerifiedLabels: {
    verified: string;
    unverified: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    username: string;
    email: string;
    fullName: string;
    isActive: string;
    basicInfo: string;
    accessAssignment: string;
    role: string;
    corporate: string;
    department: string;
    selectRole: string;
    selectCorporate: string;
    selectDepartment: string;
  };
  corporateAccessModal: {
    title: string;
    role: string;
    scope: string;
    corporate: string;
    department: string;
    addAccess: string;
    noAccess: string;
  };
  actions: {
    resendActivation: string;
    forceResetPassword: string;
    manageAccess: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    successStatus: string;
    successActivationSent: string;
    successResetSent: string;
    successAccessUpdated: string;
    errorSave: string;
    errorDelete: string;
    errorActivationSend: string;
    errorResetSend: string;
    errorAccessUpdate: string;
    errorLoadAccess: string;
    errorStatus: string;
  };
  validation: {
    usernameRequired: string;
    usernameMin: string;
    emailRequired: string;
    emailInvalid: string;
    fullNameRequired: string;
    fullNameMin: string;
    roleRequired: string;
    corporateRequired: string;
  };
}

export const userManagerI18n: Record<Locale, UserManagerCopy> = {
  id: {
    title: 'Manajemen User',
    subtitle: 'Kelola user dan akses perusahaan.',
    addNew: 'Tambah User',
    searchPlaceholder: 'Cari username atau email...',
    allVerificationStatus: 'Semua Status Verifikasi',
    tableHead: {
      name: 'Nama',
      email: 'Email',
      emailVerified: 'Email Terverifikasi',
      status: 'Status',
    },
    emailVerifiedLabels: {
      verified: 'Terverifikasi',
      unverified: 'Belum Terverifikasi',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada user yang terdaftar.',
    },
    modal: {
      createTitle: 'Tambah User Baru',
      editTitle: 'Edit User',
      username: 'Username',
      email: 'Email',
      fullName: 'Nama Lengkap',
      isActive: 'Aktif',
      basicInfo: 'Informasi Dasar',
      accessAssignment: 'Penugasan Akses',
      role: 'Role',
      corporate: 'Perusahaan',
      department: 'Departemen',
      selectRole: 'Pilih Role',
      selectCorporate: 'Pilih Perusahaan',
      selectDepartment: 'Pilih Departemen (Opsional)',
    },
    corporateAccessModal: {
      title: 'Kelola Akses Perusahaan',
      role: 'Role',
      scope: 'Scope',
      corporate: 'Perusahaan',
      department: 'Departemen',
      addAccess: 'Tambah Akses',
      noAccess: 'Tidak ada akses perusahaan',
    },
    actions: {
      resendActivation: 'Kirim Ulang Aktivasi',
      forceResetPassword: 'Reset Password',
      manageAccess: 'Kelola Akses',
    },
    alerts: {
      deleteTitle: 'Hapus user?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan.',
      successSave: 'User berhasil ditambahkan',
      successUpdate: 'User berhasil diperbarui',
      successDelete: 'User berhasil dihapus',
      successStatus: 'Status user berhasil diubah',
      successActivationSent: 'Email aktivasi berhasil dikirim',
      successResetSent: 'Email reset password berhasil dikirim',
      successAccessUpdated: 'Akses perusahaan berhasil diperbarui',
      errorSave: 'Gagal menyimpan user',
      errorDelete: 'Gagal menghapus user',
      errorActivationSend: 'Gagal mengirim email aktivasi',
      errorResetSend: 'Gagal mengirim email reset password',
      errorAccessUpdate: 'Gagal memperbarui akses perusahaan',
      errorLoadAccess: 'Gagal memuat data akses',
      errorStatus: 'Gagal mengubah status user',
    },
    validation: {
      usernameRequired: 'Username wajib diisi',
      usernameMin: 'Username minimal 3 karakter',
      emailRequired: 'Email wajib diisi',
      emailInvalid: 'Format email tidak valid',
      fullNameRequired: 'Nama lengkap wajib diisi',
      fullNameMin: 'Nama lengkap minimal 3 karakter',
      roleRequired: 'Role wajib diisi untuk user baru',
      corporateRequired: 'Perusahaan wajib diisi untuk user baru',
    },
  },
  en: {
    title: 'User Management',
    subtitle: 'Manage users and corporate access.',
    addNew: 'Add User',
    searchPlaceholder: 'Search username or email...',
    allVerificationStatus: 'All Verification Status',
    tableHead: {
      name: 'Name',
      email: 'Email',
      emailVerified: 'Email Verified',
      status: 'Status',
    },
    emailVerifiedLabels: {
      verified: 'Verified',
      unverified: 'Unverified',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'No users registered yet.',
    },
    modal: {
      createTitle: 'Add New User',
      editTitle: 'Edit User',
      username: 'Username',
      email: 'Email',
      fullName: 'Full Name',
      isActive: 'Active',
      basicInfo: 'Basic Information',
      accessAssignment: 'Access Assignment',
      role: 'Role',
      corporate: 'Corporate',
      department: 'Department',
      selectRole: 'Select Role',
      selectCorporate: 'Select Corporate',
      selectDepartment: 'Select Department (Optional)',
    },
    corporateAccessModal: {
      title: 'Manage Corporate Access',
      role: 'Role',
      scope: 'Scope',
      corporate: 'Corporate',
      department: 'Department',
      addAccess: 'Add Access',
      noAccess: 'No corporate access',
    },
    actions: {
      resendActivation: 'Resend Activation',
      forceResetPassword: 'Reset Password',
      manageAccess: 'Manage Access',
    },
    alerts: {
      deleteTitle: 'Delete user?',
      deleteDesc: 'This action cannot be undone.',
      successSave: 'User added successfully',
      successUpdate: 'User updated successfully',
      successDelete: 'User deleted successfully',
      successStatus: 'User status updated successfully',
      successActivationSent: 'Activation email sent successfully',
      successResetSent: 'Password reset email sent successfully',
      successAccessUpdated: 'Corporate access updated successfully',
      errorSave: 'Failed to save user',
      errorDelete: 'Failed to delete user',
      errorActivationSend: 'Failed to send activation email',
      errorResetSend: 'Failed to send password reset email',
      errorAccessUpdate: 'Failed to update corporate access',
      errorLoadAccess: 'Failed to load access data',
      errorStatus: 'Failed to update user status',
    },
    validation: {
      usernameRequired: 'Username is required',
      usernameMin: 'Username must be at least 3 characters',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email format',
      fullNameRequired: 'Full name is required',
      fullNameMin: 'Full name must be at least 3 characters',
      roleRequired: 'Role is required for new users',
      corporateRequired: 'Corporate is required for new users',
    },
  },
};
