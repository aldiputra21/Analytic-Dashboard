import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import helmet from "helmet";
import { loadCRMRoles } from "./src/middleware/crmRbac.js";
import { createCustomerRouter, createContactRouter, createContactStandaloneRouter } from "./src/routes/crm/customers.js";
import { createInteractionRouter } from "./src/routes/crm/interactions.js";
import { createFRSRouter } from "./src/routes/financial/index.js";
import { getFRSConfig } from "./src/config/frsConfig.js";
import { createDepartmentRouter } from "./src/routes/management/departments.js";
import { createProjectRouter } from "./src/routes/management/projects.js";
import { createTargetRouter } from "./src/routes/management/targets.js";
import { createFinancialStatementRouter } from "./src/routes/management/financialStatements.js";
import { createMafindaDashboardRouter } from "./src/routes/dashboard/mafindaDashboard.js";
import { createOpportunityRouter, createPipelineRouter } from "./src/routes/crm/opportunities.js";
import { createQualificationRouter } from "./src/routes/crm/qualifications.js";
import { db } from "./src/db/connection.js";
import { users } from "./src/db/schema/public.js";
import { eq } from "drizzle-orm";

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
  const app = express();

  // Security headers
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());

  // Request Logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Simple auth middleware: reads user from X-User-Id header (dev) or session
  app.use(async (req: any, _res, next) => {
    const userId = req.headers['x-user-id'] as string | undefined;
    if (userId) {
      req.userId = userId;
      const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user) req.userId = undefined;
    }
    next();
  });

  // Load CRM roles for authenticated users
  app.use(loadCRMRoles());

  // ===== MANAGEMENT API ENDPOINTS =====
  app.use('/api/departments', createDepartmentRouter());
  app.use('/api/projects', createProjectRouter());
  app.use('/api/targets', createTargetRouter());
  app.use('/api/financial-statements', createFinancialStatementRouter());
  app.use('/api/dashboard', createMafindaDashboardRouter());

  // ===== CRM API ENDPOINTS =====
  app.use('/api/crm/customers', createCustomerRouter());
  app.use('/api/crm/customers/:customerId/contacts', createContactRouter());
  app.use('/api/crm/contacts', createContactStandaloneRouter());
  app.use('/api/crm/interactions', createInteractionRouter());
  app.use('/api/crm/opportunities', createOpportunityRouter());
  app.use('/api/crm/opportunities/:id/qualification', createQualificationRouter());
  app.use('/api/crm/pipeline', createPipelineRouter());

  // ===== FRS API ENDPOINTS =====
  app.use('/api/frs', createFRSRouter());

  // Global FRS error handler - consistent error response format (Requirements: 12.1)
  app.use('/api/frs', (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) ?? '';
    const status = err.status ?? err.statusCode ?? 500;
    console.error(`[FRS Error] ${req.method} ${req.url}:`, err.message);
    res.status(status).json({
      error: {
        code: err.code ?? 'FRS_INTERNAL_ERROR',
        message: status < 500 ? err.message : 'An internal error occurred',
        details: status < 500 ? err.details : undefined,
        field: err.field,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  });

  // API 404 Handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // ESM-compatible __dirname
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  const PORT = parseInt(process.env.PORT ?? "5000", 10);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
