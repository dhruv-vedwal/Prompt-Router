import { PrismaClient, Prisma } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

export * from "./generated/prisma";
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({
  adapter,
});

