/**
 * Shared CORS / boot helpers (duplicated lightly so api-backend stays independent of primary).
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

export function listenPort(fallback: number): number {
  const n = Number(process.env.PORT);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
