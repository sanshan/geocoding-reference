# Geocoding project

Project name: Geocoding
Version: 1.0.0

This is an Nx monorepo.

Primary stack:

- TypeScript
- Node.js
- NestJS backend
- React frontend
- PostgreSQL
- pnpm
- Nx

General rules:

- Respect Nx project boundaries.
- Prefer existing workspace libraries over duplicated implementations.
- Application-specific code belongs in apps.
- Reusable code belongs in appropriately scoped libraries only when reuse is justified.
- Do not create libraries preemptively.
- Do not bypass Nx by introducing unrelated build scripts.
- Use pnpm, not npm or yarn.
- Keep backend and frontend contracts explicit.
- Validate all external input.
- Do not expose database entities directly as API contracts.