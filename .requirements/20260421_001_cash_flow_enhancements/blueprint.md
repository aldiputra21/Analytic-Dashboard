# Blueprint: Cash Flow Enhancements

## Architecture

### Backend
- **Service**: `financialStatementService.ts` -> `getCashFlows` will be updated to handle a `search` string.
- **Query**: Use `ilike` on `projects.name` and `projects.description` within the `getCashFlows` function.
- **Route**: `financialStatements.ts` -> GET `/cash-flow` will parse `search` from query string.

### Frontend
- **State**: Add `filterSearch` to `WeeklyCashFlowManager`.
- **Component**: Add search text input in the filter bar.
- **Component**: Replace `entityType` buttons with a `Switch` or custom Toggle component.
- **Layout**: Update Grid layout for Investing and Financing form sections.

## Data Flow
1. User types in search box.
2. `handleApplyFilter` or `onChange` (debounced) triggers `fetchData`.
3. Frontend sends `search` param to `/api/financial-statements/cash-flow`.
4. Backend executes query with `OR (projects.name ILIKE ... OR projects.description ILIKE ...)`.
5. Frontend renders filtered results.
