# 📖 OpenRouter: The Complete Architectural & Technical Manual

This is the definitive guide to the OpenRouter monorepo. It explains not just **what** the code does, but the **engineering philosophy** behind why it was built this way.

---

## 🏛️ Part 1: The Project Manifesto

### → WHY was it written this way?
The primary goal was **Operational Isolation**. 
In classic monolithic applications, if your AI processing logic (which can be slow and resource-heavy) gets a sudden surge of traffic, it can crash the entire system—including the dashboard where users pay for more credits. 

By splitting the code into **`api-backend`** (The Engine) and **`primary-backend`** (The Brain), we ensure that the "Hot Path" and the "Management Path" never interfere with each other.

### → WHEN should you use this pattern vs alternatives?
*   **Use this pattern:** When you are building a platform that provides a programmable service. It is perfect for SaaS, API Proxies, or any distributed system where the "Dashboard" and the "Engine" have completely different performance profiles.
*   **Alternative (The Monolith):** Use a single Next.js or Rails app if you are building a social network or a simple blog where the user and the logic always travel together.

### → WHAT CS concepts does this connect to?
-   **Micro-Frontend / Micro-Services:** Although contained in one repo, these are independent applications.
-   **Inversion of Control (IoC):** The `api-backend` doesn't know how to create users; it simply trusts the `primary-backend` has done so.
-   **Atomic Operations:** Ensuring that when an AI call finishes, the credit deduction is guaranteed.

### → WHERE can you go deeper?
-   **Distributed Systems:** Learn about "Circuit Breakers" and "Rate Limiting."
-   **Database Consistency:** Study "Transactional isolation levels" in PostgreSQL and Prisma.

---

## 🏗️ Part 2: Architectural Framework

The project uses a **Monorepo Structure** orchestrated by **Turborepo**.

-   **`apps/`**: Contains the head-end applications (API, Dashboard, Backend).
-   **`packages/`**: Contains shared libraries (Database, UI, Configuration).

---

## 🔬 Part 3: Technical Breakdown (The Stack)

### 1. Bun & Turborepo (The Orchestrators)
**Bun** is an all-in-one JS runtime. **Turbo** is the task manager. together they allow you to run the entire distributed system with one command.

**📝 Clip (`/package.json`):**
```json
{
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev"
  }
}
```
**Deep Dive:** `workspaces` tells Bun to link internal packages. When `primary-backend` imports `db`, Bun doesn't look at the internet; it looks inside `packages/db`. This allows for **Zero-Config Internal Sharing**.

---

### 2. ElysiaJS & Eden Treaty (End-to-End Type Safety)
This is the most "advanced" part of the stack. Elysia allows the backend to export its **types** to the frontend.

**📝 Clip (`/apps/dashboard-frontend/src/providers/Eden.tsx`):**
```typescript
import { treaty } from '@elysiajs/eden'
import type { App } from 'app' // This 'app' is the backend server!

const client = treaty<App>('localhost:3000');
```
**Deep Dive:** Notice `import type { App } from 'app'`. This is a type reference to the code running in `primary-backend`. Because of this, when you type `client.login.post(...)` in the frontend, you get **autocomplete** for the entire backend API. If you change a route in the backend, the frontend code will show a TypeScript error immediately.

---

### 3. Prisma (Data Modeling)
Prisma acts as the source of truth for your data structure.

**📝 Clip (`/packages/db/prisma/schema.prisma`):**
```prisma
model User {
  id      Int    @id @default(autoincrement())
  credits Int    @default(1000)
  apiKeys ApiKey[]
}
```
**Deep Dive:** Prisma uses a "Declarative" language. You define **what** you want, and Prisma generates the **how** (SQL). The `apiKeys ApiKey[]` line tells Prisma to build a "One-to-Many" relationship where one user can have unlimited keys.

---

### 4. TanStack Query (The State Manager)
TanStack Query (React Query) manages the "Mirror" of the backend data inside the frontend.

**📝 Clip (`/apps/dashboard-frontend/src/pages/ApiKeys.tsx`):**
```typescript
const apiKeysQuery = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
        const response = await elysiaClient["api-keys"].get();
        return response.data;
    },
});
```
**Deep Dive:** This isn't just about fetching data. React Query provides **Automatic Retries**, **Stale-While-Revalidate caching**, and **Infinite Scrolling** support. It eliminates 95% of the boilerplate code usually required for `fetch()` and `useEffect()`.

---

## 🛠️ Part 4: Developer Workflow

### Adding a new feature to the whole project:
1.  **DB:** Add the field to `schema.prisma` and run `bunx prisma db push`.
2.  **API:** Add a new route in the `primary-backend` controllers.
3.  **Frontend:** Simply call the new route via `useElysiaClient()`. Because of the Eden Treaty, your new route will already have autocomplete in the frontend!

---

## 📡 Part 5: Component Communication Map

| Request Flow | Service | Responsibility |
| :--- | :--- | :--- |
| **User Access** | `dashboard-frontend` | Renders UI, talks to Primary Backend |
| **Authentication** | `primary-backend` | Issues JWTs, checks passwords |
| **Key Usage** | `api-backend` | Validates API Key against DB, proxies LLM call |
| **Billing** | `api-backend` | Deducts credits from DB on completion |
