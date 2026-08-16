# Database

Database: PostgreSQL.

- Database migrations must be deterministic and reproducible.
- Do not modify existing committed migrations unless explicitly requested.
- Add indexes based on actual query patterns.
- Avoid N+1 queries.
- Use transactions when multiple writes must be atomic.
- Keep SQL/database-specific details inside the infrastructure layer.
- Validate data at application boundaries.
- Do not assume database constraints replace application validation.
- Prefer bulk operations for dataset imports.
- Dataset importing must be restartable or safely repeatable.