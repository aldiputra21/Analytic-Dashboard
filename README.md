<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Corporate Finance Dashboard (CFD)

Full-stack financial dashboard & CRM for PT Titian Servis Indonesia. Built with React 19, Express 4, PostgreSQL (Neon), and Drizzle ORM.

## Latest Implementation Notes

- Excel import/export implementation uses `exceljs`.
- FRS bulk import supports `.csv` and `.xlsx` formats (`.xls` is not supported).
- FRS notifications use per-user inbox with SSE stream and polling fallback.
- Permissions are normalized via `permissions` and `role_permissions`, with session invalidation using `authz_version`.
- Detailed change log: `docs/changelog/2026-04-17-security-notification-permission-refactor.md`.

## Run Locally

**Prerequisites:** Node.js 20+, PostgreSQL database (or Neon account)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and set:
   - `DATABASE_URL` — PostgreSQL connection string
   - `GEMINI_API_KEY` — Gemini API key (optional, for AI features)
   - `JWT_SECRET` — Secret for JWT tokens
3. Push database schema:
   ```bash
   npx drizzle-kit push
   ```
4. Seed initial data:
   ```bash
   npx tsx init-and-seed.ts    # Core data (users, corporates, departments)
   npx tsx seed-data.ts         # Historical financial data
   npx tsx seed-crm.ts          # CRM demo data
   ```
5. Run the app:
   ```bash
   npm run dev
   ```
