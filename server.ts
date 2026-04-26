import 'dotenv/config';
import { getFRSConfig } from "./src/config/frsConfig.js";
import { createApp } from './src/server/createApp.js';
import { runInstallmentNotificationCron } from './src/services/financial/notificationCron.js';

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
  const shutdown = async (signal: string) => {
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

    // Close server with timeout
    const serverCloseTimeout = setTimeout(() => {
      console.error('[Process] Server close timeout - forcing exit');
      process.exit(1);
    }, 10000); // 10 second timeout

    server.close(async () => {
      clearTimeout(serverCloseTimeout);
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

    // Force close any remaining connections after timeout
    setTimeout(() => {
      console.warn('[Process] Forcing shutdown - some connections may not have closed gracefully');
      process.exit(0);
    }, 15000); // 15 second hard timeout
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
