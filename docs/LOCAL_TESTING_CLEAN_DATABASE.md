# Local Testing with a Clean Database

Recommended local sequence:

```powershell
npm run prisma:repair
npm run seed:clean
npm run test:data:hygiene
npm run test:reference:data
npm run test:theme:matrix
```

If PostgreSQL is unavailable locally, continue static checks and report DB-dependent checks as blocked. Do not drop the database, delete migrations, or run destructive Docker volume commands.

Use `npm run seed:test-fixtures` only when a test explicitly requires local fake fixtures.
