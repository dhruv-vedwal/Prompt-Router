import { prisma } from "db";
import { SecurityService } from "./SecurityService";
import logger from "./logger";

export type ResolvedApiKey = {
  id: number;
  rpmLimit: number;
  tpmLimit: number;
  user: { id: number; balance: any; reservedCredits: any };
};

/**
 * Resolve an API key via prefix lookup when possible, falling back to scan for legacy rows.
 * Migrates plaintext keys to hashes once. Updates lastUsed.
 */
export async function resolveApiKey(incomingKey: string): Promise<ResolvedApiKey | null> {
  const prefix = SecurityService.keyPrefix(incomingKey);

  let candidates = await prisma.apiKey.findMany({
    where: { disabled: false, deleted: false, keyPrefix: prefix },
    select: { user: true, id: true, apiKey: true, rpmLimit: true, tpmLimit: true, keyPrefix: true },
  });

  if (candidates.length === 0) {
    candidates = await prisma.apiKey.findMany({
      where: { disabled: false, deleted: false },
      select: { user: true, id: true, apiKey: true, rpmLimit: true, tpmLimit: true, keyPrefix: true },
    });
  }

  const match = candidates.find((k) => SecurityService.verifyKey(incomingKey, k.apiKey));
  if (!match) return null;

  if (SecurityService.needsMigration(match.apiKey)) {
    await prisma.apiKey.update({
      where: { id: match.id },
      data: {
        apiKey: SecurityService.hashKey(incomingKey),
        keyPrefix: prefix,
      },
    });
    logger.info(`Key ${match.id} migrated to secure hash.`);
  } else if (!match.keyPrefix) {
    await prisma.apiKey.update({
      where: { id: match.id },
      data: { keyPrefix: prefix },
    });
  }

  await prisma.apiKey.update({
    where: { id: match.id },
    data: { lastUsed: new Date() },
  });

  return {
    id: match.id,
    rpmLimit: match.rpmLimit,
    tpmLimit: match.tpmLimit,
    user: match.user,
  };
}

/** Internal playground auth: primary-backend proves identity via shared secret. */
export async function resolveInternalUser(userId: number): Promise<ResolvedApiKey | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, balance: true, reservedCredits: true },
  });
  if (!user) return null;

  let key = await prisma.apiKey.findFirst({
    where: { userId, deleted: false, disabled: false },
    orderBy: { id: "asc" },
  });

  if (!key) {
    // Synthetic billing row for users without a key yet (playground proxy)
    key = await prisma.apiKey.create({
      data: {
        userId,
        name: "Playground Internal",
        apiKey: SecurityService.hashKey(`internal-${userId}-${Date.now()}`),
        keyPrefix: "internal-",
        disabled: false,
      },
    });
  }

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsed: new Date() },
  });

  return {
    id: key.id,
    rpmLimit: key.rpmLimit,
    tpmLimit: key.tpmLimit,
    user,
  };
}
