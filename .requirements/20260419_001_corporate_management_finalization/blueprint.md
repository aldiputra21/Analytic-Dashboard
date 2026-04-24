# Blueprint — Corporate Management Finalization

## Database Schema

### `cfd.cost_centers` [NEW]
```typescript
export const costCenters = cfdSchema.table('cost_centers', {
  id: uuid().primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references((): AnyPgColumn => costCenters.id),
  category: varchar({ length: 50 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
  code: varchar({ length: 20 }).notNull().unique(),
  description: text(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});
```

### `public.corporates` [UPDATE]
- Ensure `code` and `logo` exist and are handled in UI.

## API Endpoints

### `/api/cost-centers` [NEW]
- `GET /`: List with pagination and filters.
- `POST /`: Create.
- `PUT /:id`: Update.
- `DELETE /:id`: Delete.

### `/api/targets` [UPDATE]
- `POST /batch`: Batch upsert targets for a year.

## UI Components

### Navigation Update (`NAV_ITEMS`)
```typescript
{
  id: 'corporate-mgmt',
  label: 'Corporate Management',
  icon: Building2,
  group: 'main', // Changed from mafinda
  children: [
    { id: 'corporates', label: 'Corporates', ... },
    { id: 'cost-centers', label: 'Cost Centers', ... },
    { id: 'departments', label: 'Departments', ... },
    { id: 'projects', label: 'Projects', ... },
    { id: 'targets', label: 'Targets', ... },
  ]
}
```

### Searchable Dropdown (`SearchableSelect`)
- Uses `Popov` or `Select` from shadcn/ui with a search input.

### Target Table
- Rows: Month (1-12).
- Columns: Revenue, Cost.
- Actions: Add Month, Remove Month (if selective), or just show all 12 months.

## Multi-language (i18n)
- One file per module in `src/i18n/`.
- Keys: `title`, `subtitle`, `tableHead`, `fields`, `modal`, `alerts`, `status`.
