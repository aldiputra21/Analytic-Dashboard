import 'dotenv/config';
import { getFRSConfig } from "./src/config/frsConfig.js";
import { createApp } from './src/server/createApp.js';
import { runInstallmentNotificationCron } from './src/services/financial/notificationCron.js';

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
// Notification cron — runs daily at 00:00
// Uses setInterval to schedule the job every 24 hours, with an initial
// alignment to the next midnight.
// Returns timer IDs for cleanup during shutdown.
// ---------------------------------------------------------------------------
function scheduleDailyCron(): { timeoutId: NodeJS.Timeout; intervalId?: NodeJS.Timeout } {
  function msUntilNextMidnight(): number {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // next 00:00:00.000
    return nextMidnight.getTime() - now.getTime();
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  let intervalId: NodeJS.Timeout | undefined;

  // Fire once at the next midnight, then repeat every 24 h
  const timeoutId = setTimeout(() => {
    runInstallmentNotificationCron().catch((err) =>
      console.error('[NotificationCron] Unhandled error:', err),
    );
    intervalId = setInterval(() => {
      runInstallmentNotificationCron().catch((err) =>
        console.error('[NotificationCron] Unhandled error:', err),
      );
    }, MS_PER_DAY);
  }, msUntilNextMidnight());

  console.log('[NotificationCron] Scheduled — next run at midnight');
  return { timeoutId, intervalId };
}

async function startServer() {
  const app = await createApp();

  const PORT = parseInt(process.env.PORT ?? "5000", 10);
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Store cron timers for cleanup
  const cronTimers = scheduleDailyCron();

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
    clearTimeout(cronTimers.timeoutId);
    if (cronTimers.intervalId) {
      clearInterval(cronTimers.intervalId);
    }
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
