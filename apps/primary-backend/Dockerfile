# Use the latest Bun image for Prisma 6+ compatibility
FROM oven/bun:latest as base
WORKDIR /usr/src/app

# Copy the entire monorepo to ensure shared packages are available
COPY . .

# Install dependencies
RUN bun install

# Generate Prisma client for the DB package (pin Prisma 7 — bunx prisma alone may fetch Prisma 8, which has no `generate`)
WORKDIR /usr/src/app/packages/db
RUN bun run generate

# Go to the backend app
WORKDIR /usr/src/app/apps/primary-backend

# Expose the port Elysia runs on
EXPOSE 3000

# Start the server
CMD ["bun", "run", "src/index.ts"]
