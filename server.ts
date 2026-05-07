import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getFRSConfig } from "./src/config/frsConfig.js";
import { createApp } from './src/server/createApp.js';
import { db } from './src/db/connection.js';
import { systemConfigs } from './src/db/schema/public.js';
import { runInstallmentNotificationCron } from './src/services/financial/notificationCron.js';
import { runCleanup } from './src/services/financial/reportCleanupService.js';

// Initialize approval callbacks (must be imported to register handlers)
import './src/services/approval/approvalCallbacks.js';

// Validate FRS configuration on startup (Requirements: 14.3)
try {
  getFRSConfig();
  console.log('[FRS] Configuration validated successfully');
} catch (err: any) {
  console.error(err.message);
  // Don't exit in dev - allow server to start with defaults
}

// Database connection is handled by src/db/connection.ts via DATABASE_URL
console.log('[DB] Using PostgreSQL via Drizzle ORM');

// ---------------------------------------------------------------------------
// Cron scheduling — configurable via system_configs key 'cron_schedule'
// Two independent daily jobs:
//   1. runInstallmentNotificationCron  → notificationHour : notificationMinute
//   2. runCleanup                      → cleanupHour      : cleanupMinute
// Defaults: notification 00:00, cleanup 00:05
// ---------------------------------------------------------------------------
interface CronSchedule {
  notificationHour: number;
  notificationMinute: number;
  cleanupHour: number;
  cleanupMinute: number;
}

interface CronTimers {
  notificationTimeoutId: NodeJS.Timeout;
  notificationIntervalId?: NodeJS.Timeout;
  cleanupTimeoutId: NodeJS.Timeout;
  cleanupIntervalId?: NodeJS.Timeout;
}

async function getCronSchedule(): Promise<CronSchedule> {
  const defaults: CronSchedule = {
    notificationHour: 0,
    notificationMinute: 0,
    cleanupHour: 0,
    cleanupMinute: 5,
  };
  try {
    const rows = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'cron_schedule'));
    if (rows.length === 0) return defaults;
    const val = rows[0].value as Partial<CronSchedule>;
    return {
      notificationHour:   typeof val.notificationHour   === 'number' ? val.notificationHour   : defaults.notificationHour,
      notificationMinute: typeof val.notificationMinute === 'number' ? val.notificationMinute : defaults.notificationMinute,
      cleanupHour:        typeof val.cleanupHour        === 'number' ? val.cleanupHour        : defaults.cleanupHour,
      cleanupMinute:      typeof val.cleanupMinute      === 'number' ? val.cleanupMinute      : defaults.cleanupMinute,
    };
  } catch (err) {
    console.error('[CronSchedule] Failed to read schedule from DB, using defaults:', err);
    return defaults;
  }
}

function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function scheduleDaily(
  label: string,
  hour: number,
  minute: number,
  job: () => Promise<unknown>,
): { timeoutId: NodeJS.Timeout; intervalId?: NodeJS.Timeout } {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  let intervalId: NodeJS.Timeout | undefined;

  const timeoutId = setTimeout(() => {
    job().catch((err) => console.error(`[${label}] Unhandled error:`, err));
    intervalId = setInterval(() => {
      job().catch((err) => console.error(`[${label}] Unhandled error:`, err));
    }, MS_PER_DAY);
  }, msUntilNext(hour, minute));

  const pad = (n: number) => String(n).padStart(2, '0');
  console.log(`[${label}] Scheduled — next run at ${pad(hour)}:${pad(minute)}`);
  return { timeoutId, intervalId };
}

async function scheduleDailyCrons(): Promise<CronTimers> {
  const s = await getCronSchedule();

  const notif   = scheduleDaily('NotificationCron', s.notificationHour, s.notificationMinute, runInstallmentNotificationCron);
  const cleanup = scheduleDaily('ReportCleanup',    s.cleanupHour,      s.cleanupMinute,      runCleanup);

  return {
    notificationTimeoutId:  notif.timeoutId,
    notificationIntervalId: notif.intervalId,
    cleanupTimeoutId:       cleanup.timeoutId,
    cleanupIntervalId:      cleanup.intervalId,
  };
}

async function startServer() {
  const app = await createApp();

  const PORT = parseInt(process.env.PORT ?? "5000", 10);
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Store cron timers for cleanup
  const cronTimers = await scheduleDailyCrons();

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('[Process] Uncaught Exception:', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown for termination signals
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`[Process] ${signal} received. Starting graceful shutdown...`);

    // Clear cron timers immediately
    clearTimeout(cronTimers.notificationTimeoutId);
    if (cronTimers.notificationIntervalId) clearInterval(cronTimers.notificationIntervalId);
    clearTimeout(cronTimers.cleanupTimeoutId);
    if (cronTimers.cleanupIntervalId) clearInterval(cronTimers.cleanupIntervalId);
    console.log('[Process] Cron jobs cleared');

    // Close Vite server if it exists (HMR WebSocket)
    const viteServer = (app as any).viteServer;
    if (viteServer) {
      try {
        await viteServer.close();
        console.log('[Process] Vite HMR server closed');
      } catch (err) {
        console.error('[Process] Error closing Vite server:', err);
      }
    }

    // Hybrid shutdown strategy: Staged connection closure
    const isProd = process.env.NODE_ENV === 'production';
    const shutdownTimeout = isProd ? 10000 : 3000;

    // 1. Close idle connections immediately to allow faster shutdown
    if (typeof (server as any).closeIdleConnections === 'function') {
      (server as any).closeIdleConnections();
    }

    // 2. Handle active connections based on environment
    if (isProd) {
      console.log(`[Process] Production mode: Giving active requests 5s to finish...`);
      // In production, wait 5s before force-closing active connections
      setTimeout(() => {
        if (typeof (server as any).closeAllConnections === 'function') {
          (server as any).closeAllConnections();
        }
      }, 5000);
    } else {
      // In development, close everything immediately for instant feedback
      if (typeof (server as any).closeAllConnections === 'function') {
        (server as any).closeAllConnections();
      }
    }

    // Set a hard timeout to force exit if server.close() hangs indefinitely
    const forceExitTimeout = setTimeout(() => {
      console.warn('[Process] Graceful shutdown timed out - forcing exit');
      process.exit(0);
    }, shutdownTimeout);

    server.close(async () => {
      clearTimeout(forceExitTimeout);
      console.log('[Process] HTTP server closed');

      try {
        // Close database connection
        const { pool } = await import('./src/db/connection.js');
        if (pool) {
          await pool.end();
          console.log('[Process] Database pool closed');
        }
      } catch (err) {
        console.error('[Process] Error closing database:', err);
      }

      console.log('[Process] Shutdown complete');
      process.exit(0);
    });

    // Remove listeners so the next CTRL+C will kill the process immediately (default Node behavior)
    // if the user gets impatient or if the graceful shutdown hangs
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
