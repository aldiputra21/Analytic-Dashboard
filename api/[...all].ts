import 'dotenv/config';
import { getFRSConfig } from '../src/config/frsConfig.js';
import { createApp } from '../src/server/createApp.js';

try {
  getFRSConfig();
  console.log('[FRS] Configuration validated successfully');
} catch (err: any) {
  console.error(err.message);
}

console.log('[DB] Using PostgreSQL via Drizzle ORM');

const appPromise = createApp({
  enableViteMiddleware: false,
  serveStaticClient: false,
});

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
