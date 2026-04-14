import 'dotenv/config';
import { getFRSConfig } from "./src/config/frsConfig.js";
import { createApp } from './src/server/createApp.js';

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


async function startServer() {
  const app = await createApp();

  const PORT = parseInt(process.env.PORT ?? "5000", 10);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
