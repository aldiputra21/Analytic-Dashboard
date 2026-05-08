# Cloudflare Setup Guide

Dokumen ini mencakup dua skenario penggunaan Cloudflare untuk CFD:

- **[Opsi 1 — Cloudflare Proxy](#opsi-1--cloudflare-proxy)** — Untuk aplikasi yang diakses melalui internet publik. Memberikan proteksi DDoS, WAF, dan CDN.
- **[Opsi 2 — Cloudflare Tunnel](#opsi-2--cloudflare-tunnel)** — Untuk aplikasi internal yang hanya diakses oleh tim (Zero Trust). Tidak ada port yang terbuka ke internet.

---

## Perbandingan Dua Opsi

| | Cloudflare Proxy | Cloudflare Tunnel |
|---|---|---|
| **Cocok untuk** | Akses publik (internet) | Akses internal (tim/kantor) |
| **Cara kerja** | DNS + proxy CDN Cloudflare | Agent di server membuat tunnel ke Cloudflare |
| **Port server terbuka** | Ya (80, 443) | Tidak ada — semua via outbound tunnel |
| **Biaya** | Free tier cukup | Free tier cukup |
| **Keamanan** | DDoS + WAF otomatis | Zero Trust, tidak ada attack surface |
| **Perlu domain** | Ya | Ya |

**Rekomendasi:**
- Aplikasi bisa diakses dari luar kantor → **Opsi 1**
- Aplikasi hanya untuk internal kantor / akses remote via browser → **Opsi 2**

---

## Prasyarat Umum

- Akun Cloudflare (gratis di [cloudflare.com](https://cloudflare.com))
- Domain yang sudah dibeli (dari Namecheap, GoDaddy, Niagahoster, dll.)

---

## Opsi 1 — Cloudflare Proxy

### Langkah 1 — Tambahkan Domain ke Cloudflare

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Klik **Add a Site**
3. Masukkan nama domain: `example.com`
4. Pilih plan **Free** → Klik **Continue**
5. Cloudflare akan scan DNS record yang sudah ada → Klik **Continue**

### Langkah 2 — Update Nameserver di Registrar

Cloudflare akan menampilkan dua nameserver, contoh:
```
aria.ns.cloudflare.com
bob.ns.cloudflare.com
```

1. Login ke panel registrar domain (Namecheap, GoDaddy, Niagahoster, dll.)
2. Cari menu **Nameservers** atau **DNS Settings**
3. Ganti nameserver ke nameserver Cloudflare di atas
4. Simpan perubahan

> Propagasi DNS membutuhkan waktu **5–30 menit** (bisa hingga 24 jam di kasus tertentu).

5. Kembali ke Cloudflare → Klik **Done, check nameservers**
6. Tunggu hingga status domain berubah menjadi **Active** (Cloudflare akan kirim email konfirmasi)

### Langkah 3 — Buat DNS Record

1. Di Cloudflare Dashboard, buka domain → tab **DNS → Records**
2. Klik **Add record**:

| Type | Name | Content | Proxy status |
|---|---|---|---|
| `A` | `cfd` | `<IP_SERVER>` | Proxied (orange cloud ☁️) |

Contoh: subdomain `cfd.example.com` mengarah ke IP server dengan proxy aktif.

> Pastikan **Proxy status** adalah **Proxied** (ikon awan oranye), bukan DNS only (awan abu-abu). Proxy aktif = traffic melewati Cloudflare (DDoS protection + WAF).

### Langkah 4 — Konfigurasi SSL/TLS

Ini langkah **paling kritis**. Pengaturan SSL yang salah menyebabkan redirect loop atau koneksi tidak terenkripsi.

1. Di Cloudflare Dashboard → **SSL/TLS → Overview**
2. Pilih mode: **Full (Strict)**

| Mode | Artinya | Gunakan? |
|---|---|---|
| Off | HTTP saja, tidak ada enkripsi | ❌ Jangan |
| Flexible | Cloudflare ke user pakai HTTPS, Cloudflare ke server pakai HTTP | ❌ Jangan (insecure) |
| Full | HTTPS di semua jalur, tapi sertifikat server tidak divalidasi | ⚠️ Boleh jika perlu |
| **Full (Strict)** | HTTPS di semua jalur + sertifikat server divalidasi | ✅ Gunakan ini |

> **Kenapa Full (Strict)?** Coolify sudah generate sertifikat Let's Encrypt di server. Full (Strict) memastikan koneksi Cloudflare → server juga terenkripsi dan sertifikatnya valid.

### Langkah 5 — Aktifkan Always Use HTTPS

1. **SSL/TLS → Edge Certificates**
2. Aktifkan **Always Use HTTPS** → On
3. Aktifkan **Automatic HTTPS Rewrites** → On

### Langkah 6 — Konfigurasi Firewall (Direkomendasikan)

#### Blokir Traffic Bukan dari Cloudflare

Agar server hanya bisa diakses melalui Cloudflare (bukan langsung via IP):

```bash
# Di server, install ufw jika belum ada
apt install ufw -y

# Izinkan SSH (jangan sampai terkunci)
ufw allow 22

# Izinkan Coolify panel (akses terbatas)
ufw allow from <IP_KANTOR> to any port 8000

# Izinkan traffic dari Cloudflare saja di port 80 dan 443
# Download IP range Cloudflare terbaru:
for ip in $(curl -s https://www.cloudflare.com/ips-v4); do
  ufw allow from $ip to any port 80
  ufw allow from $ip to any port 443
done

# Aktifkan firewall
ufw --force enable
ufw status
```

> Script di atas menggunakan IP range resmi Cloudflare. Jalankan ulang setiap beberapa bulan karena IP range bisa berubah.

#### Security Level & WAF (Free Tier)

1. **Security → Settings:**
   - **Security Level:** Medium (default sudah bagus untuk internal corporate tools)
   - **Bot Fight Mode:** On

2. **Security → WAF:**
   - Di Free tier, Cloudflare WAF managed rules tidak tersedia penuh
   - Namun, proteksi DDoS Layer 3/4 otomatis aktif di semua plan termasuk Free

#### Rate Limiting Cloudflare (Free Tier)

Free tier menyediakan 1 rate limiting rule:

1. **Security → WAF → Rate limiting rules → Create rule**
2. Konfigurasi untuk proteksi brute force login:
   - **Rule name:** Block login brute force
   - **Field:** URI Path, **Operator:** equals, **Value:** `/api/frs/auth/login`
   - **Rate:** 10 requests per 1 minute per IP
   - **Action:** Block (duration: 10 minutes)
3. Klik **Deploy**

### Langkah 7 — Verifikasi

```bash
# Cek header response — harus ada 'cf-ray' dari Cloudflare
curl -I https://cfd.example.com

# Expected output (sebagian):
# HTTP/2 200
# cf-ray: <id>
# server: cloudflare
```

Cek juga di browser: ikon gembok di address bar harus menunjukkan sertifikat valid.

---

## Opsi 2 — Cloudflare Tunnel

Cloudflare Tunnel (dulu Argo Tunnel) menghubungkan server ke Cloudflare tanpa membuka port apapun ke internet. Server hanya membuat koneksi outbound ke Cloudflare.

```
[User] → [Cloudflare Edge] → [Encrypted Tunnel] → [cloudflared agent di server] → [App :5000]
```

### Langkah 1 — Tambahkan Domain ke Cloudflare

Sama seperti [Opsi 1 Langkah 1–2](#langkah-1--tambahkan-domain-ke-cloudflare). Domain harus sudah aktif di Cloudflare.

### Langkah 2 — Install `cloudflared` di Server

```bash
# Download dan install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
dpkg -i cloudflared.deb
cloudflared --version
```

### Langkah 3 — Login dan Authorize

```bash
cloudflared tunnel login
```

Perintah ini akan menampilkan URL. Buka URL tersebut di browser, login ke akun Cloudflare, dan pilih domain yang akan digunakan. File credentials akan tersimpan otomatis di `~/.cloudflared/cert.pem`.

### Langkah 4 — Buat Tunnel

```bash
# Buat tunnel dengan nama 'cfd-tunnel'
cloudflared tunnel create cfd-tunnel
```

Output akan menampilkan **Tunnel ID** (format UUID). Catat ID ini.

```bash
# Verifikasi tunnel terbuat
cloudflared tunnel list
```

### Langkah 5 — Buat File Konfigurasi Tunnel

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Isi file config:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Route traffic cfd.example.com ke aplikasi lokal di port 5000
  - hostname: cfd.example.com
    service: http://localhost:5000
  # Semua request lain → 404
  - service: http_status:404
```

Ganti `<TUNNEL_ID>` dengan ID tunnel dari langkah sebelumnya.

### Langkah 6 — Buat DNS Record via Cloudflare Tunnel

```bash
# Otomatis buat CNAME record di Cloudflare DNS
cloudflared tunnel route dns cfd-tunnel cfd.example.com
```

Perintah ini membuat record:
```
CNAME  cfd  →  <TUNNEL_ID>.cfargotunnel.com  (Proxied)
```

> Tidak perlu A record dengan IP server — tidak ada IP yang diekspos.

### Langkah 7 — Jalankan Tunnel sebagai Service (Systemd)

Agar tunnel otomatis berjalan saat server reboot:

```bash
# Install sebagai systemd service
cloudflared service install

# Start service
systemctl start cloudflared
systemctl enable cloudflared

# Cek status
systemctl status cloudflared
```

### Langkah 8 — Verifikasi

```bash
# Di server, cek tunnel aktif
cloudflared tunnel info cfd-tunnel

# Dari browser atau curl (dari luar server)
curl -I https://cfd.example.com
# Harus return HTTP/2 200
```

### Langkah 9 — Zero Trust Access (Opsional tapi Direkomendasikan)

Untuk membatasi akses hanya ke email/domain perusahaan tertentu:

1. Di Cloudflare Dashboard → **Zero Trust** (menu kiri)
2. Buka **Access → Applications → Add an application**
3. Pilih **Self-hosted**
4. Konfigurasi:
   - **Application name:** CFD Dashboard
   - **Application domain:** `cfd.example.com`
5. Buat **Access Policy**:
   - **Policy name:** Allow company team
   - **Action:** Allow
   - **Include:** Emails ending in `@example.com` (domain perusahaan)
6. Klik **Save**

Dengan ini, setiap akses ke `cfd.example.com` akan melalui halaman login Cloudflare Zero Trust terlebih dahulu sebelum sampai ke aplikasi.

---

## Konfigurasi Coolify + Cloudflare

Jika menggunakan **Coolify + Cloudflare Proxy (Opsi 1)**, ada satu konfigurasi tambahan yang dibutuhkan di Coolify.

### Masalah: IP User Ter-mask

Saat Cloudflare Proxy aktif, semua request ke server tampak berasal dari IP Cloudflare, bukan IP user asli. Ini mempengaruhi rate limiting berbasis IP di Express.

### Solusi: Trust Cloudflare Proxy Headers

Aplikasi sudah menggunakan Express, dan header `CF-Connecting-IP` dari Cloudflare perlu dipercaya. Verifikasi bahwa `trust proxy` sudah dikonfigurasi di [src/server/createApp.ts](../../src/server/createApp.ts).

Jika belum ada, tambahkan di awal konfigurasi Express:

```typescript
// Trust Cloudflare proxy — CF-Connecting-IP header akan dipakai sebagai req.ip
app.set('trust proxy', true);
```

### SSL di Coolify: Generate Sertifikat untuk Full (Strict)

Agar mode Cloudflare **Full (Strict)** bisa berjalan, Coolify harus punya sertifikat SSL valid di server.

1. Di Coolify, buka aplikasi CFD → tab **Domains**
2. Pastikan domain sudah diisi: `cfd.example.com`
3. Aktifkan **Generate SSL Certificate** (Coolify menggunakan Let's Encrypt)
4. Klik **Save** dan **Deploy**

Coolify otomatis handle renewal sertifikat Let's Encrypt.

---

## Ringkasan Pilihan

```
Aplikasi diakses dari internet publik?
  └─ Ya → Opsi 1: Cloudflare Proxy
              ├─ SSL/TLS: Full (Strict)
              ├─ Always Use HTTPS: On
              └─ Firewall: Izinkan hanya IP Cloudflare

Aplikasi hanya untuk internal tim/kantor?
  └─ Ya → Opsi 2: Cloudflare Tunnel
              ├─ Tidak perlu buka port di server
              └─ Tambahkan Zero Trust Access untuk auth email perusahaan
```
