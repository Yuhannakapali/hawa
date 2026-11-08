# Coding Standards (hawa)

Project rules. They extend the global `~/.claude/CODING_STANDARDS.md` and win on conflict.

## Backend

- **Use TypeORM for database access in `packages/api`; don't use Drizzle or other query-builder ORMs.** The user wants a simpler, conventional ORM. (2026-10-30)
- **One TypeORM entity per file, at `packages/api/src/db/entities/<name>.entity.ts`; never group entities in one file.** A shared `entities.ts` was flagged as hard to maintain. (2026-10-30)
