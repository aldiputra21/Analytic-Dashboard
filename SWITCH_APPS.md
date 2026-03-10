# How to Switch Between Apps

## Current Setup

Aplikasi saat ini menggunakan **MAFINDA App** sebagai default.

## Switch to MAFINDA App (Current)

Edit `src/main.tsx`:

```typescript
import MafindaApp from './App-MAFINDA.tsx'; // MAFINDA App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MafindaApp />
  </StrictMode>,
);
```

## Switch to Original App

Edit `src/main.tsx`:

```typescript
import App from './App.tsx'; // Original App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

## Files

- **MAFINDA App**: `src/App-MAFINDA.tsx`
- **Original App**: `src/App.tsx` (preserved, not modified)
- **Entry Point**: `src/main.tsx`

## Note

Both apps use the same backend (`server.ts`), but:
- MAFINDA App uses new MAFINDA tables and APIs
- Original App uses legacy `financial_statements` table

The database schema includes both for backward compatibility.
