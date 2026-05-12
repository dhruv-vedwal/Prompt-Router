import { prisma } from "db"

const ONRAMP_AMOUNT = 1000;

export abstract class PaymentsService {

    static async onramp(userId: number) {
        const [user] = await prisma.$transaction([
            prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    balance: {
                        increment: ONRAMP_AMOUNT
                    }
                }
            }),
            prisma.transaction.create({
                data: {
                    userId,
                    type: "ONRAMP",
                    amount: ONRAMP_AMOUNT,
                    metadata: { source: "test_gateway" }
                }
            }),
            prisma.onrampTransaction.create({
                data: {
                    userId,
                    amount: ONRAMP_AMOUNT,
                    status: "completed"
                }
            })
        ])

        return user.balance.toString();
    }
}
