import { PrismaClient, Prisma } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

export * from "./generated/prisma";
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

const connectionString = process.env.DATABASE_URL!;
const isLocal =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

// Managed hosts (e.g. Aiven) often present a chain Node/pg rejects by default.
const adapter = new PrismaPg({
  connectionString,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

export const prisma = new PrismaClient({
  adapter,
});

