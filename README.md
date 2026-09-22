# PromptRouter Monorepo

A high-performance, modular AI Router built with **Bun**, **Turborepo**, and **ElysiaJS**.

## Architecture

- **`apps/api-backend`**: The router engine (LLM proxy + billing). Port **4000**.
- **`apps/primary-backend`**: Auth, API keys, admin, playground proxy. Port **3000**.
- **`apps/dashboard-frontend`**: React dashboard. Port **3001** in dev.
- **`packages/db`**: Shared Prisma database package.

## Getting Started

### 1. Installation
```bash
bun install
```

### 2. Database Setup
Copy `.env.example` values into `packages/db/.env` (and root/backend envs as needed), then:
```bash
cd packages/db
bun run generate
bun run db:migrate
# optional local seed (refused in production unless ALLOW_DB_SEED=true):
bun run prisma/seed.ts
cd ../..
```

### 3. Development
```bash
bun dev
```

Required env highlights:
- `JWT_SECRET` (≥16 chars)
- `FRONTEND_ORIGIN` (comma-separated allowlist in production)
- `COOKIE_SAME_SITE=none` only for cross-site cookie deployments (also set Secure)
- `INTERNAL_SERVICE_SECRET` (playground → router auth)
- `ROUTER_API_URL` (primary-backend → api-backend)
- `DB_SSL_INSECURE=1` only when managed Postgres needs verify-off TLS (prefer `DATABASE_CA_CERT`)

## Docker

```bash
docker-compose up --build
```

Services: Postgres, primary-backend (`:3000`), api-backend (`:4000`), frontend (`:80`).

Frontend image **requires** build-args `API_URL` and `ROUTER_API_URL` (no localhost in production builds).

## Testing

```bash
# Unit / regression (Bun)
cd apps/api-backend && bun test
cd apps/primary-backend && bun test

# Legacy Vitest smoke (primary-backend)
cd apps/primary-backend && bun run test
```

