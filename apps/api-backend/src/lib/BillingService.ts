import { prisma, Decimal } from "db";

type ReservationMeta = {
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  providerMappingId?: number;
  status?: "reserved" | "settled" | "refunded";
};

export class BillingService {
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5);
  }

  static calculateCharge(
    inputTokens: number,
    outputTokens: number,
    inputPricePer1k: Decimal,
    outputPricePer1k: Decimal,
    markupMultiplier: Decimal
  ): Decimal {
    const inputCost = new Decimal(inputTokens).div(1000).mul(inputPricePer1k);
    const outputCost = new Decimal(outputTokens).div(1000).mul(outputPricePer1k);
    return inputCost.plus(outputCost).mul(markupMultiplier);
  }

  static async reserve(userId: number, estimatedInputTokens: number, mapping: any) {
    const estimatedOutputTokens = 1000;
    const estimatedCost = this.calculateCharge(
      estimatedInputTokens,
      estimatedOutputTokens,
      mapping.inputPricePer1k,
      mapping.outputPricePer1k,
      mapping.markupMultiplier
    );

    const reservationBuffer = new Decimal("1.2");
    const amountToReserve = estimatedCost.mul(reservationBuffer);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: userId,
          balance: { gte: amountToReserve },
        },
        data: {
          balance: { decrement: amountToReserve },
          reservedCredits: { increment: amountToReserve },
        },
      });

      if (updated.count === 0) {
        throw new Error("Insufficient balance to cover estimated cost");
      }

      return await tx.transaction.create({
        data: {
          userId,
          type: "RESERVE",
          amount: amountToReserve.negated(),
          metadata: {
            estimatedInputTokens,
            estimatedOutputTokens,
            providerMappingId: mapping.id,
            status: "reserved",
          } satisfies ReservationMeta,
        },
      });
    });
  }

  static async settle(
    userId: number,
    reservationId: number,
    actualInputTokens: number,
    actualOutputTokens: number,
    mapping: any,
    conversationId: number
  ) {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.transaction.findUnique({
        where: { id: reservationId },
      });

      if (!reservation || reservation.type !== "RESERVE") {
        throw new Error("Reservation not found");
      }

      const meta = (reservation.metadata ?? {}) as ReservationMeta;
      if (meta.status === "settled" || meta.status === "refunded") {
        return { alreadyProcessed: true };
      }

      const reservedAmount = new Decimal(reservation.amount as any).abs();
      let actualCharge = this.calculateCharge(
        actualInputTokens,
        actualOutputTokens,
        mapping.inputPricePer1k,
        mapping.outputPricePer1k,
        mapping.markupMultiplier
      );

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      if (!user) throw new Error("User not found");

      // After releasing reservation, available = balance + reservedAmount
      const available = new Decimal(user.balance as any).plus(reservedAmount);
      if (actualCharge.gt(available)) {
        actualCharge = available;
      }

      const rawCost = new Decimal(actualInputTokens).div(1000).mul(mapping.inputPricePer1k)
        .plus(new Decimal(actualOutputTokens).div(1000).mul(mapping.outputPricePer1k));

      await tx.user.update({
        where: { id: userId },
        data: {
          reservedCredits: { decrement: reservedAmount },
          balance: {
            // release reservation then charge actual
            increment: reservedAmount.minus(actualCharge),
          },
        },
      });

      await tx.transaction.update({
        where: { id: reservationId },
        data: {
          metadata: { ...meta, status: "settled" },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "SETTLE",
          amount: actualCharge.negated(),
          metadata: {
            reservationId,
            actualInputTokens,
            actualOutputTokens,
            actualCharge: actualCharge.toString(),
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          inputTokenCount: actualInputTokens,
          outputTokenCount: actualOutputTokens,
          rawCost: rawCost,
          chargedCost: actualCharge,
          margin: actualCharge.minus(rawCost),
          status: "COMPLETED",
        },
      });

      return { alreadyProcessed: false };
    });
  }

  static async refund(userId: number, reservationId: number) {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.transaction.findUnique({
        where: { id: reservationId },
      });

      if (!reservation || reservation.type !== "RESERVE") return;

      const meta = (reservation.metadata ?? {}) as ReservationMeta;
      if (meta.status === "settled" || meta.status === "refunded") {
        return;
      }

      const reservedAmount = new Decimal(reservation.amount as any).abs();

      await tx.user.update({
        where: { id: userId },
        data: {
          reservedCredits: { decrement: reservedAmount },
          balance: { increment: reservedAmount },
        },
      });

      await tx.transaction.update({
        where: { id: reservationId },
        data: {
          metadata: { ...meta, status: "refunded" },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "REFUND",
          amount: reservedAmount,
          metadata: { reservationId },
        },
      });
    });
  }

  static async cleanupStaleReservations() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const staleReservations = await prisma.transaction.findMany({
      where: {
        type: "RESERVE",
        createdAt: { lt: tenMinutesAgo },
      },
    });

    for (const reservation of staleReservations) {
      const meta = (reservation.metadata ?? {}) as ReservationMeta;
      if (meta.status === "settled" || meta.status === "refunded") continue;

      try {
        await this.refund(reservation.userId, reservation.id);
      } catch (e) {
        console.error(`Failed to cleanup reservation ${reservation.id}: ${e}`);
      }
    }
  }
}
