# Coding Standards (hawa)

Project rules. They extend the global `~/.claude/CODING_STANDARDS.md` and win on conflict.

## Backend

- **Use TypeORM for database access in `packages/api`; don't use Drizzle or other query-builder ORMs.** The user wants a simpler, conventional ORM. (2026-10-30)
