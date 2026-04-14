# Forgot Password Flow — Specification

## Overview
Tambahkan flow forgot password lengkap untuk modul FRS agar user dapat meminta link reset password melalui email dan mengatur password baru dari link tersebut.

## Goals
1. Tambahkan halaman forgot password dengan visual dan layout yang sama seperti halaman login.
2. Kirim link reset password ke email user yang terdaftar.
3. Tambahkan halaman reset password yang dibuka dari link email.
4. Gunakan respons generik pada forgot password agar tidak membocorkan apakah email terdaftar.
5. Reuse password policy dan auth infrastructure yang sudah ada.

## User Stories
- Sebagai user, saya dapat membuka halaman forgot password dari login.
- Sebagai user, saya dapat memasukkan email dan menerima link reset password.
- Sebagai user, saya dapat membuka link reset password dan memasukkan password baru.
- Sebagai sistem, saya menolak token reset yang invalid atau expired.
- Sebagai sistem, saya mencatat request reset dan reset berhasil ke audit log.

## Acceptance Criteria
1. Halaman forgot password dan reset password memakai auth shell yang sama dengan login.
2. Endpoint forgot password selalu mengembalikan pesan sukses generik untuk email valid maupun tidak valid.
3. Link reset berisi token satu kali pakai dengan TTL terbatas.
4. Reset password berhasil menghapus token lama dan memperbarui password hash.
5. Password baru mengikuti aturan strength yang sama dengan login/auth service.

## Constraints
- Aplikasi saat ini tidak memakai React Router untuk auth view; implementasi harus kompatibel dengan pola app shell saat ini.
- SMTP dapat belum terkonfigurasi di lokal; fallback developer-friendly diperbolehkan selama tidak memutus flow pengembangan.