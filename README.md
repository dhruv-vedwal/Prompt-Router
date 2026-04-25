# OpenRouter Monorepo

A high-performance, modular AI Router built with **Bun**, **Turborepo**, and **ElysiaJS**.

## 🏗️ Architecture

This project is structured as a monorepo containing three distinct applications and several shared packages:

- **`apps/api-backend`**: The "Router" engine. Proxies requests to LLM providers (OpenAI, Gemini, Anthropic) and manages credit deduction. Runs on port **4000**.
- **`apps/primary-backend`**: Core business logic and management. Handles auth, JWT, and CRUD for API keys/user credits. Runs on port **3000**.
- **`apps/dashboard-frontend`**: React 19 dashboard for users to manage their keys and track usage. Runs on port **3001**.
- **`packages/db`**: Shared Prisma database layer used by both backends.

---

## 🚀 Getting Started

### 1. Installation
Install all dependencies from the root directory:
```bash
bun install
```

### 2. Database Setup
Configure your database URL in `packages/db/.env`, then:
```bash
cd packages/db
bunx prisma generate
bunx prisma db push
cd ../..
```

### 3. Development
Run all services simultaneously:
```bash
bun dev
```

---

## 🛠️ DevOps & Testing

We have implemented a production-ready DevOps pipeline to ensure code quality and easy deployment.

### 🧪 Automated Testing
Run tests across the stack using **Vitest**:

*   **Backend:** `cd apps/primary-backend && bun run test`
*   **Frontend:** `cd apps/dashboard-frontend && bun run test`

### 🐳 Docker Deployment
The entire stack is containerized for consistent environments.
```bash
# Start Database, Backend, and Frontend (Nginx)
docker-compose up --build
```
*   **Frontend:** `http://localhost` (Port 80)
*   **Backend API:** `http://localhost:3000`
*   **Postgres:** `localhost:5432`

### 🤖 CI/CD Pipeline
A `Jenkinsfile` is included in the root to automate the following on every push:
1.  **Install:** `bun install`
2.  **Database:** `bunx prisma generate`
3.  **Test:** Runs Vitest for both Backend and Frontend.
4.  **Build:** Builds Docker images for all services.
5.  **Deploy:** Restarts services with the latest code.

### 📝 Logging
The backend uses **Winston** for structured logging.
*   **Development:** Pretty, color-coded console output.
*   **Production/Docker:** Structured JSON logs for easier monitoring.

---

## 🧐 Architectural Deep Dive

### → WHY was it written this way?
1. **Vertical Separation of Concerns:** Most routers fail because their "Business Logic" (user management/payments) slows down their "Hot Path" (AI request proxying). By splitting `primary-backend` and `api-backend`, we ensure that dashboard traffic doesn't compete for resources with AI requests.
2. **Independent Scalability:** In production, you might need 10 instances of the `api-backend` to handle traffic, but only 1 instance of the `dashboard-frontend`. This architecture allows that.
3. **Type Safety Across the Stack:** Using a Monorepo with Bun/TypeScript ensures that a database schema change in `packages/db` is immediately reflected in all three applications.

### → WHEN should you use this pattern vs alternatives?
- **Use this pattern when:** You are building a high-scale service meant to be used by both machines (via API) and humans (via Dashboard).
- **Alternative (Monolith):** If you are building a simple app where the frontend and backend are tightly coupled and logic isn't split into distinct "Engine" and "Management" roles, a standard Next.js monolith may be simpler.

### → WHAT CS concepts does this connect to?
- **Proxy Pattern:** The `api-backend` is a classic implementation of a Reverse Proxy, where a client sends a request to one endpoint, and the server decides which external service (OpenAI vs Gemini) to relay it to.
- **Service-Oriented Architecture (SOA):** Breaking a system into smaller, self-contained functional units.
- **Distributed Computing:** Managing multiple services that must communicate (Frontend ↔ Backend ↔ Database) in a synchronized manner.
- **Eventual Consistency:** Deducting credits in the database as a side effect of a successful API call.

### → WHERE can you go deeper?
- **ElysiaJS Performance:** Read about how [ElysiaJS](https://elysiajs.com/) uses static code analysis to be one of the fastest Bun frameworks.
- **System Design (API Gateways):** Research how companies like OpenRouter or Akamai design their routing layers.
- **Turborepo Orchestration:** Check out the [Turborepo Docs](https://turbo.build/repo/docs) to understand how it handles caching and task execution.

