# API Design Clarification — Dropdown Endpoints

## Overview

This document clarifies the API design for dropdown/selector endpoints in the CFD Financial Enhancements feature.

## Key Principles

### 1. No Pagination for Dropdown Endpoints

**Dropdown endpoints should return ALL active items without pagination.**

- Endpoint: `GET /api/{resource}/dropdown`
- Response: Array of items (not paginated)
- Example: `GET /api/banks/dropdown` returns all active banks

### 2. Status Filtering Applied at Backend

**The backend MUST automatically filter for `status = 'active'` items.**

- Frontend does NOT send `status` parameter
- Backend applies the filter internally
- Only active items are returned

### 3. Endpoint Patterns

#### For Table Display (with pagination):
```
GET    /api/{resource}?search=&page=&pageSize=
```

Response:
```json
{
  "records": [...],
  "totalCount": 42
}
```

#### For Dropdown/Selector (no pagination, active only):
```
GET    /api/{resource}/dropdown
```

Response:
```json
[
  { "id": "uuid", "code": "BCA", "name": "Bank Central Asia", ... },
  { "id": "uuid", "code": "MANDIRI", "name": "Bank Mandiri", ... }
]
```

## Affected Endpoints

### Master Tables
- `GET /api/banks/dropdown` — All active banks
- `GET /api/corporate-sectors/dropdown` — All active sectors
- `GET /api/currencies/dropdown` — All active currencies
- `GET /api/cost-center-categories/dropdown` — All active categories

### Related Endpoints (if applicable)
- `GET /api/frs/corporates/dropdown` — All active corporates
- `GET /api/frs/departments/dropdown` — All active departments
- `GET /api/frs/projects/dropdown` — All active projects

## Frontend Implementation

When loading dropdown options:

```typescript
// ❌ WRONG - sending status parameter
const response = await fetch('/api/banks?status=active&pageSize=100');

// ✅ CORRECT - no status parameter, no pagination
const response = await fetch('/api/banks/dropdown');
const banks = await response.json(); // Array of items
```

## Backend Implementation

Example for banks endpoint:

```typescript
// GET /api/banks/dropdown
router.get('/dropdown', authenticate, async (req, res) => {
  // Backend automatically filters for active status
  const banks = await db.select()
    .from(banksTable)
    .where(eq(banksTable.status, 'active'))
    .orderBy(banksTable.name);
  
  res.json(banks);
});
```

## Benefits

1. **Simpler Frontend Code** — No pagination logic needed for dropdowns
2. **Consistent Backend Logic** — Status filtering is centralized
3. **Better UX** — All options visible at once for small datasets
4. **Reduced API Calls** — Single request returns all needed data

## Updated Requirements

The following requirements have been updated to reflect this design:

- Requirement 4.7 — Master Bank dropdown endpoint
- Requirement 5.10 — Bank Loan dropdown endpoints
- Requirement 7.5 — Corporate Sectors dropdown endpoint
- Requirement 8.5 — Currencies dropdown endpoint
- Requirement 9.5 — Cost Center Categories dropdown endpoint

## Implementation Checklist

- [ ] Add `/dropdown` endpoint to all master table routes
- [ ] Backend applies `status = 'active'` filter automatically
- [ ] Frontend calls `/dropdown` endpoint without status parameter
- [ ] Frontend does not use pagination for dropdown responses
- [ ] All dropdown endpoints return array (not paginated object)
- [ ] Update SearchableSelect components to use new endpoints
