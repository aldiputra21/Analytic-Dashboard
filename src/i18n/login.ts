// i18n strings for the Login page
// Usage: import { loginI18n } from '../i18n/login';
// Then: const copy = loginI18n[language];

import { Locale } from './commons';

export interface LoginCopy {
  locale: Locale;
  localeName: string;
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  forgotPassword: string;
  forgotTitle: string;
  forgotSubtitle: string;
  forgotHelper: string;
  forgotSuccessTitle: string;
  forgotSuccessMessage: string;
  resetTitle: string;
  resetSubtitle: string;
  resetHelper: string;
  resetSuccessTitle: string;
  resetSuccessMessage: string;
  rememberDevice: string;
  submit: string;
  submitting: string;
  sendResetLink: string;
  sendingResetLink: string;
  resetPassword: string;
  resettingPassword: string;
  backToLogin: string;
  resetLinkInvalid: string;
  passwordMismatch: string;
  passwordRequirements: string;
  passwordResetComplete: string;
  errorInvalidCredentials: string;
  errorSessionExpired: string;
  errorNetwork: string;
  errorServer: string;
  errorWeakPassword: string;
  errorValidation: string;
  noAccount: string;
  contactAdministrator: string;
  featureOne: string;
  featureTwo: string;
}

export const loginI18n: Record<Locale, LoginCopy> = {
  id: {
    locale: 'id',
    localeName: 'ID',
    title: 'Masuk',
    subtitle: 'Masukkan kredensial Anda untuk mengakses dashboard eksekutif',
    emailLabel: 'Username / Alamat Email',
    emailPlaceholder: 'nama@perusahaan.com',
    passwordLabel: 'Kata Sandi',
    passwordPlaceholder: 'Masukkan kata sandi Anda',
    confirmPasswordLabel: 'Konfirmasi Kata Sandi Baru',
    confirmPasswordPlaceholder: 'Ulangi kata sandi baru',
    forgotPassword: 'Lupa Password?',
    forgotTitle: 'Lupa Password',
    forgotSubtitle: 'Masukkan username atau email yang terdaftar untuk menerima link reset password.',
    forgotHelper: 'Kami akan mengirimkan link reset password ke email akun tersebut jika terdaftar.',
    forgotSuccessTitle: 'Periksa Email Anda',
    forgotSuccessMessage: 'Jika akun ditemukan, link reset password telah dikirim ke email yang terdaftar.',
    resetTitle: 'Buat Password Baru',
    resetSubtitle: 'Masukkan password baru untuk menyelesaikan proses reset akun Anda.',
    resetHelper: 'Gunakan password yang kuat dan belum pernah digunakan sebelumnya.',
    resetSuccessTitle: 'Password Berhasil Diperbarui',
    resetSuccessMessage: 'Silakan masuk kembali menggunakan password baru Anda.',
    rememberDevice: 'Ingat perangkat ini',
    submit: 'Masuk',
    submitting: 'Memproses...',
    sendResetLink: 'Kirim Link Reset',
    sendingResetLink: 'Mengirim Link...',
    resetPassword: 'Reset Password',
    resettingPassword: 'Memperbarui Password...',
    backToLogin: 'Kembali ke Halaman Login',
    resetLinkInvalid: 'Link reset password tidak valid atau sudah kedaluwarsa.',
    passwordMismatch: 'Konfirmasi password harus sama dengan password baru.',
    passwordRequirements: 'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus.',
    passwordResetComplete: 'Password berhasil diperbarui. Anda dapat masuk kembali sekarang.',
    errorInvalidCredentials: 'Username atau password salah.',
    errorSessionExpired: 'Sesi Anda berakhir. Silakan masuk kembali.',
    errorNetwork: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
    errorServer: 'Terjadi kesalahan pada server. Coba lagi beberapa saat.',
    errorWeakPassword: 'Password tidak memenuhi persyaratan keamanan.',
    errorValidation: 'Data yang dimasukkan tidak valid.',
    noAccount: 'Belum punya akun?',
    contactAdministrator: 'Hubungi Administrator',
    featureOne: 'DASHBOARD KEUANGAN KORPORAT',
    featureTwo: 'MANAJEMEN HUBUNGAN PELANGGAN',
  },
  en: {
    locale: 'en',
    localeName: 'EN',
    title: 'Sign In',
    subtitle: 'Enter your credentials to access the executive dashboard',
    emailLabel: 'Username / Email Address',
    emailPlaceholder: 'name@company.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPasswordLabel: 'Confirm New Password',
    confirmPasswordPlaceholder: 'Repeat your new password',
    forgotPassword: 'Forgot Password?',
    forgotTitle: 'Forgot Password',
    forgotSubtitle: 'Enter your registered username or email address to receive a password reset link.',
    forgotHelper: 'We will send a password reset link to the account email if it exists.',
    forgotSuccessTitle: 'Check Your Email',
    forgotSuccessMessage: 'If the account exists, a password reset link has been sent to the registered email address.',
    resetTitle: 'Create a New Password',
    resetSubtitle: 'Enter a new password to complete the reset process for your account.',
    resetHelper: 'Use a strong password that you have not used before.',
    resetSuccessTitle: 'Password Updated',
    resetSuccessMessage: 'Please sign in again with your new password.',
    rememberDevice: 'Remember this device',
    submit: 'Sign In',
    submitting: 'Signing in...',
    sendResetLink: 'Send Reset Link',
    sendingResetLink: 'Sending Link...',
    resetPassword: 'Reset Password',
    resettingPassword: 'Updating Password...',
    backToLogin: 'Back to Login',
    resetLinkInvalid: 'The password reset link is invalid or has expired.',
    passwordMismatch: 'Password confirmation must match the new password.',
    passwordRequirements: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
    passwordResetComplete: 'Password updated successfully. You can sign in again now.',
    errorInvalidCredentials: 'Invalid username or password.',
    errorSessionExpired: 'Your session has expired. Please sign in again.',
    errorNetwork: 'Unable to connect to the server. Check your internet connection.',
    errorServer: 'A server error occurred. Please try again later.',
    errorWeakPassword: 'Password does not meet security requirements.',
    errorValidation: 'Invalid input provided.',
    noAccount: "Don't have an account?",
    contactAdministrator: 'Contact Administrator',
    featureOne: 'CORPORATE FINANCIAL DASHBOARD',
    featureTwo: 'CUSTOMER RELATIONSHIP MANAGEMENT',
  },
};

export const loginLocales: Locale[] = ['id', 'en'];
