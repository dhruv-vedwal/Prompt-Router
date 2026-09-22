FROM oven/bun:1.2.5 AS base
WORKDIR /usr/src/app

COPY . .

RUN bun install

WORKDIR /usr/src/app/packages/db
RUN bun run generate

WORKDIR /usr/src/app/apps/api-backend

EXPOSE 4000

CMD ["bun", "run", "src/index.ts"]
