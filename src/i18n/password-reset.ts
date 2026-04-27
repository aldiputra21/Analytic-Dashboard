import { Locale } from './commons';

export interface PasswordResetCopy {
  pageTitle: string;
  subtitle: string;
  newPassword: string;
  confirmPassword: string;
  passwordStrength: string;
  resetButton: string;
  alerts: {
    successTitle: string;
    successDesc: string;
    errorTitle: string;
    errorDesc: string;
    invalidTokenTitle: string;
    invalidTokenDesc: string;
    expiredTokenTitle: string;
    expiredTokenDesc: string;
    requestNewReset: string;
    redirecting: string;
  };
  validation: {
    newPasswordRequired: string;
    confirmPasswordRequired: string;
    passwordsNotMatch: string;
    passwordWeak: string;
  };
}

export const passwordResetI18n: Record<Locale, PasswordResetCopy> = {
  id: {
    pageTitle: 'Reset Password',
    subtitle: 'Masukkan password baru Anda untuk mereset akun.',
    newPassword: 'Password Baru',
    confirmPassword: 'Konfirmasi Password',
    passwordStrength: 'Kekuatan Password',
    resetButton: 'Reset Password',
    alerts: {
      successTitle: 'Password Berhasil Direset',
      successDesc: 'Password Anda telah berhasil direset. Anda akan diarahkan ke halaman login dalam beberapa detik.',
      errorTitle: 'Reset Gagal',
      errorDesc: 'Terjadi kesalahan saat mereset password. Silakan coba lagi.',
      invalidTokenTitle: 'Token Tidak Valid',
      invalidTokenDesc: 'Token reset tidak valid atau telah kadaluarsa. Silakan minta reset password baru.',
      expiredTokenTitle: 'Token Kadaluarsa',
      expiredTokenDesc: 'Token reset telah kadaluarsa. Silakan minta administrator untuk mengirim ulang email reset password.',
      requestNewReset: 'Minta Reset Baru',
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
    pageTitle: 'Reset Password',
    subtitle: 'Enter your new password to reset your account.',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    passwordStrength: 'Password Strength',
    resetButton: 'Reset Password',
    alerts: {
      successTitle: 'Password Reset Successfully',
      successDesc: 'Your password has been successfully reset. You will be redirected to the login page in a few seconds.',
      errorTitle: 'Reset Failed',
      errorDesc: 'An error occurred while resetting your password. Please try again.',
      invalidTokenTitle: 'Invalid Token',
      invalidTokenDesc: 'The reset token is invalid or has expired. Please request a new password reset.',
      expiredTokenTitle: 'Token Expired',
      expiredTokenDesc: 'The reset token has expired. Please ask the administrator to resend the password reset email.',
      requestNewReset: 'Request New Reset',
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
