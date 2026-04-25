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
// ---------------------------------------------------------------------------
function scheduleDailyCron() {
  function msUntilNextMidnight(): number {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // next 00:00:00.000
    return nextMidnight.getTime() - now.getTime();
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Fire once at the next midnight, then repeat every 24 h
  setTimeout(() => {
    runInstallmentNotificationCron().catch((err) =>
      console.error('[NotificationCron] Unhandled error:', err),
    );
    setInterval(() => {
      runInstallmentNotificationCron().catch((err) =>
        console.error('[NotificationCron] Unhandled error:', err),
      );
    }, MS_PER_DAY);
  }, msUntilNextMidnight());

  console.log('[NotificationCron] Scheduled — next run at midnight');
}

async function startServer() {
  const app = await createApp();

  const PORT = parseInt(process.env.PORT ?? "5000", 10);
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    scheduleDailyCron();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to restart the service gracefully
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('[Process] Uncaught Exception:', err);
    // Critical errors should usually trigger a graceful shutdown
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown for termination signals (Core Backend Requirement)
  const shutdown = async (signal: string) => {
    console.log(`[Process] ${signal} received. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('[Process] HTTP server closed');
      try {
        const { db } = await import('./src/db/connection.js');
        // @ts-ignore - accessing the pool from drizzle instance if possible, 
        // but since we exported db from drizzle(pool), we might need to export pool too.
        // For now, we'll just log and exit.
        console.log('[Process] Shutdown complete');
        process.exit(0);
      } catch (err) {
        console.error('[Process] Error during shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
