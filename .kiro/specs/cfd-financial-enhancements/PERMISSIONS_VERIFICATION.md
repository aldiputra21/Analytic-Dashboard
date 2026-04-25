# Permissions & Role Permissions Verification

## Status: ✅ COMPLETE

Semua permission dan role permission untuk CFD Financial Enhancements telah ditambahkan ke `scripts/seed-public.ts`.

## Permissions Added to permissionCatalog

### Master Tables Permissions (9 permissions)
```
✅ public.banks.read
✅ public.banks.write
✅ public.banks.delete
✅ public.corporate_sectors.read
✅ public.corporate_sectors.write
✅ public.corporate_sectors.delete
✅ public.currencies.read
✅ public.currencies.write
✅ public.currencies.delete
✅ public.cost_center_categories.read
✅ public.cost_center_categories.write
✅ public.cost_center_categories.delete
✅ public.notification_configs.read
✅ public.notification_configs.write
✅ public.notification_configs.delete
```

### Financial Enhancements Permissions (6 permissions)
```
✅ cfd.realizations.read
✅ cfd.realizations.write
✅ cfd.realizations.delete
✅ cfd.bank_loans.read
✅ cfd.bank_loans.write
✅ cfd.bank_loans.delete
```

## Role Permission Mappings

### Owner Role
- ✅ **All permissions** (automatic via `permissionCatalog.map((p) => p.key)`)
- Includes all master table permissions (read/write/delete)
- Includes all financial enhancements permissions (read/write/delete)

### BOD (Board of Directors) Role
- ✅ **All `.read` permissions** (automatic via filter)
- Includes:
  - `public.banks.read`
  - `public.corporate_sectors.read`
  - `public.currencies.read`
  - `public.cost_center_categories.read`
  - `public.notification_configs.read`
  - `cfd.realizations.read`
  - `cfd.bank_loans.read`
  - All other `.read` permissions

### Subsidiary Manager Role
- ✅ **Master table read permissions** (added)
  - `public.banks.read`
  - `public.corporate_sectors.read`
  - `public.currencies.read`
  - `public.cost_center_categories.read`
  - `public.notification_configs.read`

- ✅ **Financial enhancements permissions** (already present)
  - `cfd.realizations.read`
  - `cfd.realizations.write`
  - `cfd.bank_loans.read`
  - `cfd.bank_loans.write`

- ❌ **Master table write/delete permissions** (owner only)
  - No `.write` or `.delete` for master tables

## How Permissions Are Seeded

### Step 1: Insert Permissions
```typescript
for (const permission of permissionCatalog) {
  await db.insert(permissions).values({
    key: permission.key,
    module: permission.module,
    description: permission.description,
    createdBy: SYSTEM_ACTOR_ID,
  }).onConflictDoNothing({ target: permissions.key });
}
```

### Step 2: Map Permissions to Roles
```typescript
for (const [roleName, permissionKeys] of Object.entries(rolePermissionMap)) {
  const roleId = roleByName.get(roleName);
  if (!roleId) continue;
  for (const permissionKey of permissionKeys) {
    const permissionId = permissionByKey.get(permissionKey);
    if (!permissionId) continue;
    await db.insert(rolePermissions).values({
      roleId,
      permissionId,
      grantedBy: adminUserId,
    }).onConflictDoNothing({ target: [rolePermissions.roleId, rolePermissions.permissionId] });
  }
}
```

## Verification Queries

### Check All Permissions
```sql
SELECT key, module, description 
FROM public.permissions 
WHERE key LIKE 'public.%' OR key LIKE 'cfd.%'
ORDER BY key;
```

### Check Owner Role Permissions
```sql
SELECT p.key, p.module
FROM public.role_permissions rp
JOIN public.permissions p ON rp.permission_id = p.id
JOIN public.roles r ON rp.role_id = r.id
WHERE r.name = 'owner'
ORDER BY p.key;
```

### Check Subsidiary Manager Role Permissions
```sql
SELECT p.key, p.module
FROM public.role_permissions rp
JOIN public.permissions p ON rp.permission_id = p.id
JOIN public.roles r ON rp.role_id = r.id
WHERE r.name = 'subsidiary_manager'
ORDER BY p.key;
```

### Check BOD Role Permissions
```sql
SELECT p.key, p.module
FROM public.role_permissions rp
JOIN public.permissions p ON rp.permission_id = p.id
JOIN public.roles r ON rp.role_id = r.id
WHERE r.name = 'bod'
ORDER BY p.key;
```

## Running the Seed

```bash
npx tsx scripts/seed-public.ts
```

All permissions and role mappings will be automatically inserted with `onConflictDoNothing()` to prevent duplicates.

## Related Documentation

- Task 18: Update `scripts/seed-public.ts` — ✅ COMPLETED
- Requirement 10: Keamanan & Otorisasi Akses — ✅ SATISFIED
