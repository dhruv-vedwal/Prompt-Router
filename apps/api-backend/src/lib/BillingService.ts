import { prisma, Decimal } from "db";

export class BillingService {
  /**
   * Safe heuristic for token estimation: characters / 3.5
   * Most models are ~4 chars/token, so 3.5 is a safe overestimation.
   */
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

  /**
   * Reserves credits for a request.
   * Uses a 20% buffer to handle variation in output length.
   */
  static async reserve(userId: number, estimatedInputTokens: number, mapping: any) {
    const estimatedOutputTokens = 1000; // Default buffer for output
    const estimatedCost = this.calculateCharge(
      estimatedInputTokens,
      estimatedOutputTokens,
      mapping.inputPricePer1k,
      mapping.outputPricePer1k,
      mapping.markupMultiplier
    );

    // Reserve 120% of estimated cost
    const reservationBuffer = new Decimal("1.2");
    const amountToReserve = estimatedCost.mul(reservationBuffer);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });

      if (!user || user.balance.lt(amountToReserve)) {
        throw new Error("Insufficient balance to cover estimated cost");
      }

      // Deduct from balance, add to reserved
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: amountToReserve },
          reservedCredits: { increment: amountToReserve }
        }
      });

      // Log reservation
      return await tx.transaction.create({
        data: {
          userId,
          type: "RESERVE",
          amount: amountToReserve.negated(),
          metadata: {
            estimatedInputTokens,
            estimatedOutputTokens,
            providerMappingId: mapping.id
          }
        }
      });
    });
  }

  /**
   * Settles a request with actual token usage.
   * Refunds the reservation and charges the actual amount.
   */
  static async settle(
    userId: number,
    reservationId: number,
    actualInputTokens: number,
    actualOutputTokens: number,
    mapping: any,
    conversationId: number
  ) {
    const reservation = await prisma.transaction.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) throw new Error("Reservation not found");

    const reservedAmount = new Decimal(reservation.amount as any).abs();
    const actualCharge = this.calculateCharge(
      actualInputTokens,
      actualOutputTokens,
      mapping.inputPricePer1k,
      mapping.outputPricePer1k,
      mapping.markupMultiplier
    );

    const rawCost = new Decimal(actualInputTokens).div(1000).mul(mapping.inputPricePer1k)
      .plus(new Decimal(actualOutputTokens).div(1000).mul(mapping.outputPricePer1k));

    return await prisma.$transaction(async (tx) => {
      // Refund the reserved amount first
      await tx.user.update({
        where: { id: userId },
        data: {
          reservedCredits: { decrement: reservedAmount },
          balance: { increment: reservedAmount }
        }
      });

      // Deduct the actual final charge
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: actualCharge }
        }
      });

      // Log settlement transaction
      await tx.transaction.create({
        data: {
          userId,
          type: "SETTLE",
          amount: actualCharge.negated(),
          metadata: {
            reservationId,
            actualInputTokens,
            actualOutputTokens,
            actualCharge
          }
        }
      });

      // Update conversation with actual usage and cost
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          inputTokenCount: actualInputTokens,
          outputTokenCount: actualOutputTokens,
          rawCost: rawCost,
          chargedCost: actualCharge,
          margin: actualCharge.minus(rawCost),
          status: "COMPLETED"
        }
      });
    });
  }

  /**
   * Refund full reservation if request fails.
   */
  static async refund(userId: number, reservationId: number) {
    const reservation = await prisma.transaction.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) return;

    const reservedAmount = new Decimal(reservation.amount as any).abs();

    return await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          reservedCredits: { decrement: reservedAmount },
          balance: { increment: reservedAmount }
        }
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "REFUND",
          amount: reservedAmount,
          metadata: { reservationId }
        }
      });
    });
  }

  static async cleanupStaleReservations() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const staleReservations = await prisma.transaction.findMany({
      where: {
        type: "RESERVE",
        createdAt: { lt: tenMinutesAgo }
      }
    });

    for (const reservation of staleReservations) {
      const allTransactions = await prisma.transaction.findMany({
          where: {
              userId: reservation.userId,
              OR: [
                  { type: "SETTLE" },
                  { type: "REFUND" }
              ]
          }
      });

      const isProcessed = allTransactions.some(t => (t.metadata as any)?.reservationId === reservation.id);

      if (!isProcessed) {
        try {
          await this.refund(reservation.userId, reservation.id);
        } catch (e) {
          console.error(`Failed to cleanup reservation ${reservation.id}: ${e}`);
        }
      }
    }
  }
}
