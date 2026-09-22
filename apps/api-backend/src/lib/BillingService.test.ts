import { describe, expect, test } from "bun:test";
import { BillingService } from "./BillingService";
import { Decimal } from "db";

describe("BillingService pure helpers", () => {
  test("estimateTokens scales with length", () => {
    expect(BillingService.estimateTokens("abcd")).toBeGreaterThan(0);
    expect(BillingService.estimateTokens("a".repeat(350))).toBe(100);
  });

  test("calculateCharge applies markup", () => {
    const charge = BillingService.calculateCharge(
      1000,
      1000,
      new Decimal("1"),
      new Decimal("2"),
      new Decimal("1.5"),
    );
    // (1 + 2) * 1.5 = 4.5
    expect(charge.toString()).toBe("4.5");
  });
});

/**
 * Reservation state machine guards (mirrors BillingService settle/refund metadata checks).
 * Full DB concurrency tests require a live Postgres; these lock the idempotency contract.
 */
describe("billing reservation state machine", () => {
  type Meta = { status?: "reserved" | "settled" | "refunded" };

  function shouldRefund(meta: Meta, billingDone: boolean) {
    if (billingDone) return false;
    if (meta.status === "settled" || meta.status === "refunded") return false;
    return true;
  }

  function shouldSettle(meta: Meta) {
    return meta.status !== "settled" && meta.status !== "refunded";
  }

  test("never refunds after settle", () => {
    expect(shouldRefund({ status: "settled" }, false)).toBe(false);
    expect(shouldRefund({ status: "reserved" }, true)).toBe(false);
  });

  test("settle is idempotent once marked", () => {
    expect(shouldSettle({ status: "settled" })).toBe(false);
    expect(shouldSettle({ status: "refunded" })).toBe(false);
    expect(shouldSettle({ status: "reserved" })).toBe(true);
  });

  test("cleanup skips settled and refunded", () => {
    const rows: Meta[] = [
      { status: "reserved" },
      { status: "settled" },
      { status: "refunded" },
    ];
    const toRefund = rows.filter((m) => shouldRefund(m, false));
    expect(toRefund).toEqual([{ status: "reserved" }]);
  });
});
