import { PrismaClient, Prisma } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";

export * from "./generated/prisma";
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

function createPool() {
  const rawUrl = process.env.DATABASE_URL!;
  const isLocal =
    rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");

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

  if (isLocal) {
    return new Pool({ connectionString: url.toString() });
  }

  const caPath = process.env.DATABASE_CA_CERT;
  if (caPath && fs.existsSync(caPath)) {
    return new Pool({
      connectionString: url.toString(),
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(caPath, "utf8"),
      },
    });
  }

  // Managed hosts (e.g. Aiven) often need TLS without a bundled CA unless
  // DATABASE_CA_CERT is set. Gate verify-off behind DB_SSL_INSECURE=1.
  if (process.env.DB_SSL_INSECURE === "1") {
    return new Pool({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
    });
  }

  return new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
  });
}

const adapter = new PrismaPg(createPool());

export const prisma = new PrismaClient({
  adapter,
});
