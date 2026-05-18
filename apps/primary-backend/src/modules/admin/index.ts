import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { prisma } from "db";

export const app = new Elysia({ prefix: "admin" })
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET!
        })
    )
    .resolve(async ({ cookie: { auth }, status, jwt}) => {
        if (!auth) return status(401)
        const decoded = await jwt.verify(auth.value as string);
        if (!decoded || !decoded.userId) return status(401)
        
        // Ensure user is an admin (For now we'll assume any logged in user can access admin for dev, 
        // but in prod you'd check a 'role' field in the DB)
        return {
            userId: decoded.userId as string
        }
    })
    // --- USER MANAGEMENT ---
    .get("/users", async ({ query }) => {
        return await prisma.user.findMany({
            where: query.search ? {
                email: { contains: query.search, mode: 'insensitive' }
            } : {},
            include: {
                _count: { select: { apiKeys: true, conversations: true } }
            },
            orderBy: { id: 'desc' }
        });
    })
    .post("/users/:id/topup", async ({ params: { id }, body }) => {
        const amount = Number(body.amount);
        return await prisma.$transaction(async (tx) => {
            // 1. Create Onramp Transaction
            await tx.transaction.create({
                data: {
                    userId: Number(id),
                    type: "ONRAMP",
                    amount: amount,
                    metadata: { reason: body.reason || "Manual Admin Top-up" }
                }
            });

            // 2. Update User Credits
            return await tx.user.update({
                where: { id: Number(id) },
                data: { balance: { increment: amount } }
            });
        });
    }, {
        body: t.Object({
            amount: t.Number(),
            reason: t.Optional(t.String())
        })
    })
    // --- MODEL & PROVIDER MANAGEMENT ---
    .put("/models/:id", async ({ params: { id }, body }) => {
        return await prisma.model.update({
            where: { id: Number(id) },
            data: body
        });
    }, {
        body: t.Object({
            name: t.Optional(t.String()),
            slug: t.Optional(t.String()),
            description: t.Optional(t.String())
        })
    })
    .put("/mappings/:id", async ({ params: { id }, body }) => {
        return await prisma.modelProviderMapping.update({
            where: { id: Number(id) },
            data: body
        });
    }, {
        body: t.Object({
            inputPricePer1k: t.Optional(t.Number()),
            outputPricePer1k: t.Optional(t.Number()),
            markupMultiplier: t.Optional(t.Number()),
            enabled: t.Optional(t.Boolean())
        })
    });
