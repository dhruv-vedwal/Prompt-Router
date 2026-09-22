/**
 * Shared CORS origin parsing for credentialed cross-origin dashboards.
 * FRONTEND_ORIGIN: comma-separated allowlist. Empty = reflect request in development only.
 */
export function corsOrigins(): true | string | string[] {
  const raw = process.env.FRONTEND_ORIGIN?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "FRONTEND_ORIGIN is unset in production — CORS will deny credentialed cross-origin requests.",
      );
      return [];
    }
    return true;
  }
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length === 1 ? list[0]! : list;
}

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters");
  }
  return secret;
}

export function listenPort(fallback: number): number {
  const n = Number(process.env.PORT);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
