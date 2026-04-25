export const userI18n = {
  id: {
    title: 'Manajemen Pengguna',
    subtitle: 'Kelola pengguna sistem dan izin akses mereka',
    addNew: 'Tambah Pengguna',
    searchPlaceholder: 'Cari berdasarkan nama, email, atau username...',
    tableHead: {
      name: 'Nama Lengkap',
      username: 'Username',
      email: 'Email',
      role: 'Peran',
      status: 'Status',
      actions: 'Aksi'
    },
    status: {
      active: 'Aktif',
      inactive: 'Nonaktif',
      empty: 'Tidak Ada Pengguna',
      emptyDesc: 'Belum ada pengguna yang terdaftar atau tidak ditemukan hasil pencarian.',
      submitting: 'Menyimpan...'
    },
    roles: {
      owner: 'Pemilik (Owner)',
      bod: 'Direksi (BOD)',
      subsidiary_manager: 'Manajer Anak Perusahaan'
    },
    modal: {
      createTitle: 'Tambah Pengguna Baru',
      editTitle: 'Edit Pengguna',
      viewTitle: 'Detail Pengguna',
      accessTitle: 'Kelola Akses Anak Perusahaan',
      fullName: 'Nama Lengkap',
      username: 'Username',
      email: 'Email',
      role: 'Peran',
      password: 'Kata Sandi',
      passwordNote: 'Kosongkan jika tidak ingin mengubah kata sandi',
      passwordPlaceholder: 'Min. 12 karakter (besar, kecil, angka, simbol)',
      subsidiaryAccess: 'Akses Anak Perusahaan',
      subsidiaryNote: 'Pengguna selain owner memerlukan setidaknya satu akses anak perusahaan.',
      cancel: 'Batal',
      submit: 'Simpan',
      close: 'Tutup',
      saveAccess: 'Simpan Akses'
    },
    alerts: {
      successSave: 'Pengguna berhasil dibuat',
      successUpdate: 'Pengguna berhasil diperbarui',
      successStatus: 'Status pengguna berhasil diperbarui',
      successAccess: 'Akses anak perusahaan berhasil diperbarui',
      errorFetch: 'Gagal memuat data pengguna',
      errorSave: 'Gagal menyimpan data pengguna',
      errorStatus: 'Gagal memperbarui status pengguna',
      errorAccess: 'Gagal memperbarui akses anak perusahaan',
      errorRequired: 'Mohon lengkapi semua field wajib'
    },
    validation: {
      fullNameMin: 'Nama minimal 3 karakter',
      usernameMin: 'Username minimal 4 karakter',
      emailInvalid: 'Format email tidak valid',
      passwordMin: 'Password minimal 12 karakter',
      passwordStrength: 'Password harus mengandung huruf besar, kecil, angka, dan simbol'
    }
  },
  en: {
    title: 'User Management',
    subtitle: 'Manage system users and their access permissions',
    addNew: 'Add New User',
    searchPlaceholder: 'Search by name, email, or username...',
    tableHead: {
      name: 'Full Name',
      username: 'Username',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      actions: 'Actions'
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      empty: 'No Users Found',
      emptyDesc: 'No users have been registered yet or no search results found.',
      submitting: 'Saving...'
    },
    roles: {
      owner: 'Owner',
      bod: 'Board of Directors (BOD)',
      subsidiary_manager: 'Subsidiary Manager'
    },
    modal: {
      createTitle: 'Add New User',
      editTitle: 'Edit User',
      viewTitle: 'User Details',
      accessTitle: 'Manage Subsidiary Access',
      fullName: 'Full Name',
      username: 'Username',
      email: 'Email',
      role: 'Role',
      password: 'Password',
      passwordNote: 'Leave blank to keep current password',
      passwordPlaceholder: 'Min. 12 chars (upper, lower, number, symbol)',
      subsidiaryAccess: 'Subsidiary Access',
      subsidiaryNote: 'Non-owner users need at least one subsidiary access.',
      cancel: 'Cancel',
      submit: 'Save',
      close: 'Close',
      saveAccess: 'Save Access'
    },
    alerts: {
      successSave: 'User created successfully',
      successUpdate: 'User updated successfully',
      successStatus: 'User status updated successfully',
      successAccess: 'Subsidiary access updated successfully',
      errorFetch: 'Failed to load users',
      errorSave: 'Failed to save user',
      errorStatus: 'Failed to update user status',
      errorAccess: 'Failed to update subsidiary access',
      errorRequired: 'Please fill all required fields'
    },
    validation: {
      fullNameMin: 'Full name must be at least 3 characters',
      usernameMin: 'Username must be at least 4 characters',
      emailInvalid: 'Invalid email format',
      passwordMin: 'Password must be at least 12 characters',
      passwordStrength: 'Password must contain uppercase, lowercase, numbers, and symbols'
    }
  }
};
