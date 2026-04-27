import { Locale } from './commons';

export interface UserProfileCopy {
  pageTitle: string;
  sections: {
    profileInfo: string;
    changePassword: string;
    accountSecurity: string;
    recentActivity: string;
    corporateAccess: string;
  };
  profileInfo: {
    avatar: string;
    username: string;
    email: string;
    fullName: string;
    dropOrClick: string;
    avatarHint: string;
    updateProfile: string;
  };
  changePassword: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordStrength: string;
    changePasswordBtn: string;
  };
  accountSecurity: {
    lastLogin: string;
    lastLoginIp: string;
    passwordChanged: string;
    emailVerified: string;
    verified: string;
    unverified: string;
  };
  recentActivity: {
    dateTime: string;
    ipAddress: string;
    device: string;
    status: string;
    success: string;
    failed: string;
    noActivity: string;
  };
  corporateAccess: {
    role: string;
    scope: string;
    corporate: string;
    department: string;
    noCorporateAccess: string;
  };
  alerts: {
    successProfileUpdate: string;
    successPasswordChange: string;
    successAvatarUpload: string;
    errorProfileUpdate: string;
    errorPasswordChange: string;
    errorAvatarUpload: string;
    errorPasswordMismatch: string;
    errorPasswordWeak: string;
    errorCurrentPasswordWrong: string;
  };
  validation: {
    emailRequired: string;
    emailInvalid: string;
    fullNameRequired: string;
    fullNameMin: string;
    currentPasswordRequired: string;
    newPasswordRequired: string;
    confirmPasswordRequired: string;
    passwordsNotMatch: string;
    invalidFileType: string;
    fileTooLarge: string;
  };
}

export const userProfileI18n: Record<Locale, UserProfileCopy> = {
  id: {
    pageTitle: 'Profil Saya',
    sections: {
      profileInfo: 'Informasi Profil',
      changePassword: 'Ubah Password',
      accountSecurity: 'Keamanan Akun',
      recentActivity: 'Aktivitas Terbaru',
      corporateAccess: 'Akses Perusahaan',
    },
    profileInfo: {
      avatar: 'Avatar',
      username: 'Username',
      email: 'Email',
      fullName: 'Nama Lengkap',
      dropOrClick: 'Lepas atau klik',
      avatarHint: 'JPG, PNG atau WEBP\nMax 2MB',
      updateProfile: 'Perbarui Profil',
    },
    changePassword: {
      currentPassword: 'Password Saat Ini',
      newPassword: 'Password Baru',
      confirmPassword: 'Konfirmasi Password',
      passwordStrength: 'Kekuatan Password',
      changePasswordBtn: 'Ubah Password',
    },
    accountSecurity: {
      lastLogin: 'Login Terakhir',
      lastLoginIp: 'IP Address Login Terakhir',
      passwordChanged: 'Password Diubah',
      emailVerified: 'Email Terverifikasi',
      verified: 'Terverifikasi',
      unverified: 'Belum Terverifikasi',
    },
    recentActivity: {
      dateTime: 'Tanggal & Waktu',
      ipAddress: 'IP Address',
      device: 'Device/Browser',
      status: 'Status',
      success: 'Berhasil',
      failed: 'Gagal',
      noActivity: 'Tidak ada aktivitas login',
    },
    corporateAccess: {
      role: 'Role',
      scope: 'Scope',
      corporate: 'Perusahaan',
      department: 'Departemen',
      noCorporateAccess: 'Tidak ada akses perusahaan',
    },
    alerts: {
      successProfileUpdate: 'Profil berhasil diperbarui',
      successPasswordChange: 'Password berhasil diubah',
      successAvatarUpload: 'Avatar berhasil diunggah',
      errorProfileUpdate: 'Gagal memperbarui profil',
      errorPasswordChange: 'Gagal mengubah password',
      errorAvatarUpload: 'Gagal mengunggah avatar',
      errorPasswordMismatch: 'Password tidak cocok',
      errorPasswordWeak: 'Password terlalu lemah',
      errorCurrentPasswordWrong: 'Password saat ini salah',
    },
    validation: {
      emailRequired: 'Email wajib diisi',
      emailInvalid: 'Format email tidak valid',
      fullNameRequired: 'Nama lengkap wajib diisi',
      fullNameMin: 'Nama lengkap minimal 3 karakter',
      currentPasswordRequired: 'Password saat ini wajib diisi',
      newPasswordRequired: 'Password baru wajib diisi',
      confirmPasswordRequired: 'Konfirmasi password wajib diisi',
      passwordsNotMatch: 'Password tidak cocok',
      invalidFileType: 'Tipe file tidak valid',
      fileTooLarge: 'Ukuran file terlalu besar',
    },
  },
  en: {
    pageTitle: 'My Profile',
    sections: {
      profileInfo: 'Profile Information',
      changePassword: 'Change Password',
      accountSecurity: 'Account Security',
      recentActivity: 'Recent Activity',
      corporateAccess: 'Corporate Access',
    },
    profileInfo: {
      avatar: 'Avatar',
      username: 'Username',
      email: 'Email',
      fullName: 'Full Name',
      dropOrClick: 'Drop or click',
      avatarHint: 'JPG, PNG or WEBP\nMax 2MB',
      updateProfile: 'Update Profile',
    },
    changePassword: {
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      passwordStrength: 'Password Strength',
      changePasswordBtn: 'Change Password',
    },
    accountSecurity: {
      lastLogin: 'Last Login',
      lastLoginIp: 'Last Login IP Address',
      passwordChanged: 'Password Changed',
      emailVerified: 'Email Verified',
      verified: 'Verified',
      unverified: 'Unverified',
    },
    recentActivity: {
      dateTime: 'Date & Time',
      ipAddress: 'IP Address',
      device: 'Device/Browser',
      status: 'Status',
      success: 'Success',
      failed: 'Failed',
      noActivity: 'No login activity',
    },
    corporateAccess: {
      role: 'Role',
      scope: 'Scope',
      corporate: 'Corporate',
      department: 'Department',
      noCorporateAccess: 'No corporate access',
    },
    alerts: {
      successProfileUpdate: 'Profile updated successfully',
      successPasswordChange: 'Password changed successfully',
      successAvatarUpload: 'Avatar uploaded successfully',
      errorProfileUpdate: 'Failed to update profile',
      errorPasswordChange: 'Failed to change password',
      errorAvatarUpload: 'Failed to upload avatar',
      errorPasswordMismatch: 'Passwords do not match',
      errorPasswordWeak: 'Password is too weak',
      errorCurrentPasswordWrong: 'Current password is incorrect',
    },
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email format',
      fullNameRequired: 'Full name is required',
      fullNameMin: 'Full name must be at least 3 characters',
      currentPasswordRequired: 'Current password is required',
      newPasswordRequired: 'New password is required',
      confirmPasswordRequired: 'Confirm password is required',
      passwordsNotMatch: 'Passwords do not match',
      invalidFileType: 'Invalid file type',
      fileTooLarge: 'File too large',
    },
  },
};
