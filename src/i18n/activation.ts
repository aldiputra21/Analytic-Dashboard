import { Locale } from './commons';

export interface ActivationCopy {
  pageTitle: string;
  subtitle: string;
  username: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
  passwordStrength: string;
  activateButton: string;
  alerts: {
    successTitle: string;
    successDesc: string;
    errorTitle: string;
    errorDesc: string;
    invalidTokenTitle: string;
    invalidTokenDesc: string;
    expiredTokenTitle: string;
    expiredTokenDesc: string;
    contactAdmin: string;
    redirecting: string;
  };
  validation: {
    newPasswordRequired: string;
    confirmPasswordRequired: string;
    passwordsNotMatch: string;
    passwordWeak: string;
  };
}

export const activationI18n: Record<Locale, ActivationCopy> = {
  id: {
    pageTitle: 'Aktivasi Akun',
    subtitle: 'Selamat datang! Silakan atur password Anda untuk mengaktifkan akun.',
    username: 'Username',
    email: 'Email',
    newPassword: 'Password Baru',
    confirmPassword: 'Konfirmasi Password',
    passwordStrength: 'Kekuatan Password',
    activateButton: 'Aktivasi Akun',
    alerts: {
      successTitle: 'Akun Berhasil Diaktifkan',
      successDesc: 'Akun Anda telah berhasil diaktifkan. Anda akan diarahkan ke halaman login dalam beberapa detik.',
      errorTitle: 'Aktivasi Gagal',
      errorDesc: 'Terjadi kesalahan saat mengaktifkan akun. Silakan coba lagi.',
      invalidTokenTitle: 'Token Tidak Valid',
      invalidTokenDesc: 'Token aktivasi tidak valid atau telah kadaluarsa. Silakan hubungi administrator.',
      expiredTokenTitle: 'Token Kadaluarsa',
      expiredTokenDesc: 'Token aktivasi telah kadaluarsa. Silakan minta administrator untuk mengirim ulang email aktivasi.',
      contactAdmin: 'Hubungi Administrator',
      redirecting: 'Mengalihkan ke halaman login dalam {seconds} detik...',
    },
    validation: {
      newPasswordRequired: 'Password baru wajib diisi',
      confirmPasswordRequired: 'Konfirmasi password wajib diisi',
      passwordsNotMatch: 'Password tidak cocok',
      passwordWeak: 'Password terlalu lemah. Gunakan kombinasi huruf besar, kecil, angka, dan simbol.',
    },
  },
  en: {
    pageTitle: 'Activate Account',
    subtitle: 'Welcome! Please set your password to activate your account.',
    username: 'Username',
    email: 'Email',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    passwordStrength: 'Password Strength',
    activateButton: 'Activate Account',
    alerts: {
      successTitle: 'Account Activated Successfully',
      successDesc: 'Your account has been successfully activated. You will be redirected to the login page in a few seconds.',
      errorTitle: 'Activation Failed',
      errorDesc: 'An error occurred while activating your account. Please try again.',
      invalidTokenTitle: 'Invalid Token',
      invalidTokenDesc: 'The activation token is invalid or has expired. Please contact the administrator.',
      expiredTokenTitle: 'Token Expired',
      expiredTokenDesc: 'The activation token has expired. Please ask the administrator to resend the activation email.',
      contactAdmin: 'Contact Administrator',
      redirecting: 'Redirecting to login page in {seconds} seconds...',
    },
    validation: {
      newPasswordRequired: 'New password is required',
      confirmPasswordRequired: 'Confirm password is required',
      passwordsNotMatch: 'Passwords do not match',
      passwordWeak: 'Password is too weak. Use a combination of uppercase, lowercase, numbers, and symbols.',
    },
  },
};
