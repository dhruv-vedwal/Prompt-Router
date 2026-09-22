import { PrismaClient, Prisma } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export * from "./generated/prisma";
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

function createPool() {
  const rawUrl = process.env.DATABASE_URL!;
  const isLocal =
    rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");

  // Newer `pg` treats sslmode=require as verify-full, which rejects Aiven's chain.
  // Strip SSL query params and configure TLS on the Pool instead.
  const url = new URL(rawUrl);
  for (const key of [
    "sslmode",
    "sslrootcert",
    "sslcert",
    "sslkey",
    "sslaccept",
    "uselibpqcompat",
  ]) {
    url.searchParams.delete(key);
  }

  return new Pool({
    connectionString: url.toString(),
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });
}

const adapter = new PrismaPg(createPool());

export const prisma = new PrismaClient({
  adapter,
});
