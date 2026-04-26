# Graceful Shutdown Fix — 2026-04-26

## Problem
Service memerlukan multiple CTRL+C untuk shutdown karena:
1. **Cron timers tidak di-cleanup** — `setInterval` dan `setTimeout` untuk notification cron tidak di-clear saat shutdown
2. **Database pool tidak di-close** — Drizzle pool tidak di-close dengan benar
3. **Vite HMR WebSocket tidak di-close** — Port 24678 (Vite HMR) tetap terbuka, menyebabkan "Port already in use" saat restart
4. **Race condition** — Server close callback tidak proper, menyebabkan process tidak exit dengan clean

## Solution

### 1. Export Database Pool (`src/db/connection.ts`)
```typescript
export { pool };
```
Memungkinkan shutdown handler untuk menutup pool connection dengan benar.

### 2. Refactor Cron Scheduling (`server.ts`)
- `scheduleDailyCron()` sekarang return `{ timeoutId, intervalId }` untuk tracking
- Timer IDs disimpan di `startServer()` untuk cleanup saat shutdown

### 3. Store & Close Vite Server (`src/server/createApp.ts` & `server.ts`)
- Vite server instance disimpan di `app.viteServer` saat middleware di-attach
- Saat shutdown, Vite server di-close terlebih dahulu untuk menutup HMR WebSocket
- Ini mencegah "Port 24678 already in use" error saat restart

### 4. Improved Graceful Shutdown (`server.ts`)
Shutdown sequence:
1. Clear cron timers immediately
2. **Close Vite HMR server** (WebSocket)
3. Close HTTP server
4. Close database pool
5. Exit process

Dengan timeout protection:
- 10 detik untuk server close
- 15 detik hard timeout untuk force exit

## Testing
```bash
npm run dev
# Tekan CTRL+C sekali — service harus shutdown dengan clean
# Tekan CTRL+C lagi untuk start — tidak ada "Port already in use" error
```

Expected output:
```
[Process] SIGINT received. Starting graceful shutdown...
[Process] Cron jobs cleared
[Process] Vite HMR server closed
[Process] HTTP server closed
[Process] Database pool closed
[Process] Shutdown complete
```

## Impact
- ✅ Single CTRL+C untuk shutdown
- ✅ No hanging processes
- ✅ No "Port 24678 already in use" error
- ✅ Clean database connection closure
- ✅ Proper Vite HMR cleanup
- ✅ Proper resource cleanup
