# Forgot Password Flow — Blueprint

## Architecture

### Frontend
- Auth shell tetap berada di `src/components/financial/FRSApp.tsx`.
- Tambahkan auth view state: `login | forgot-password | reset-password`.
- `reset-password` membaca token dari query string `?auth=reset&token=...`.
- Semua view reuse layout split-screen, language selector, logo, dan auth card yang sama.

### Backend
- `public.users` mendapat dua kolom nullable:
  - `password_reset_token_hash`
  - `password_reset_expires_at`
- `authService` menambah function:
  - `requestPasswordReset(email, appUrl)`
  - `resetPasswordWithToken(token, newPassword)`
- `emailService` baru mengirim email reset password via nodemailer atau log fallback saat SMTP belum diisi.
- `auth` routes menambah endpoint:
  - `POST /api/frs/auth/forgot-password`
  - `POST /api/frs/auth/reset-password`

## Data Flow
1. User klik forgot password di login.
2. User submit email ke endpoint forgot password.
3. Backend mencari user aktif berdasarkan email.
4. Jika user ada, backend generate token acak, simpan hash + expiry, kirim email reset link.
5. Endpoint selalu mengembalikan respons sukses generik.
6. User membuka link reset, frontend membaca token query param dan menampilkan form reset.
7. User submit password baru.
8. Backend validasi token, expiry, dan password strength.
9. Backend hash password baru, clear reset token fields, update password metadata, tulis audit log.

## Security Decisions
- Gunakan respons generik pada forgot password untuk mencegah email enumeration.
- Simpan token reset dalam bentuk hash SHA-256, bukan plain token.
- TTL default: 1 jam.
- Token bersifat single-use dan dihapus setelah reset berhasil.

## Files Affected
- `src/components/financial/FRSApp.tsx`
- `src/i18n/login.ts`
- `src/hooks/financial/useAuth.ts`
- `src/routes/financial/auth.ts`
- `src/services/financial/authService.ts`
- `src/services/financial/emailService.ts`
- `src/db/schema/public.ts`
- `src/types/financial/user.ts`
- `.env.example`