import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { prisma } from "db";
import { requireJwtSecret } from "../../lib/env";

export const app = new Elysia({ prefix: "admin" })
    .use(
        jwt({
            name: 'jwt',
            secret: requireJwtSecret()
        })
    )
    .resolve(async ({ cookie: { auth }, status, jwt }) => {
        if (!auth) return status(401)
        const decoded = await jwt.verify(auth.value as string);
        if (!decoded || !decoded.userId) return status(401)

        const user = await prisma.user.findUnique({
            where: { id: Number(decoded.userId) },
            select: { id: true, role: true },
        });
        if (!user || user.role !== "ADMIN") {
            return status(403, { message: "Forbidden" });
        }

        return {
            userId: user.id.toString(),
            role: user.role,
        }
    })
    // --- USER MANAGEMENT ---
    .get("/users", async ({ query }) => {
        return await prisma.user.findMany({
            where: query.search ? {
                email: { contains: query.search, mode: 'insensitive' }
            } : {},
            select: {
                id: true,
                email: true,
                balance: true,
                reservedCredits: true,
                role: true,
                _count: { select: { apiKeys: true, conversations: true } },
            },
            orderBy: { id: 'desc' }
        });
    })
    .post("/users/:id/topup", async ({ params: { id }, body, status }) => {
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return status(400, { message: "Amount must be a positive number" });
        }
        return await prisma.$transaction(async (tx) => {
            await tx.transaction.create({
                data: {
                    userId: Number(id),
                    type: "ONRAMP",
                    amount: amount,
                    metadata: { reason: body.reason || "Manual Admin Top-up" }
                }
            });

            return await tx.user.update({
                where: { id: Number(id) },
                data: { balance: { increment: amount } },
                select: {
                    id: true,
                    email: true,
                    balance: true,
                    role: true,
                },
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
            data: {
                ...(body.name !== undefined ? { name: body.name } : {}),
                ...(body.slug !== undefined ? { slug: body.slug } : {}),
            }
        });
    }, {
        body: t.Object({
            name: t.Optional(t.String()),
            slug: t.Optional(t.String()),
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
