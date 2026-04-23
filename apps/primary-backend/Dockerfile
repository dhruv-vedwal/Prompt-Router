# Use Bun official image
FROM oven/bun:1.1 as base
WORKDIR /usr/src/app

# Copy the entire monorepo to ensure shared packages are available
COPY . .

# Install dependencies
RUN bun install

# Generate Prisma client for the DB package
WORKDIR /usr/src/app/packages/db
RUN bunx prisma generate

# Go to the backend app
WORKDIR /usr/src/app/apps/primary-backend

# Expose the port Elysia runs on
EXPOSE 3000

# Start the server
CMD ["bun", "run", "src/index.ts"]
