import { prisma } from "db"

export abstract class PlaygroundService {
    static async createSession(userId: number, title: string = "New Chat") {
        return await prisma.chatSession.create({
            data: {
                userId,
                title
            }
        });
    }

    static async getChatHistory(userId: number) {
        return await prisma.chatSession.findMany({
            where: {
                userId
            },
            orderBy: {
                updatedAt: "desc"
            },
            include: {
                _count: {
                    select: { messages: true }
                }
            },
            take: 30
        });
    }

    static async getSessionMessages(userId: number, sessionId: string) {
        const session = await prisma.chatSession.findFirst({
            where: {
                id: sessionId,
                userId
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            }
        });

        if (!session) return null;
        return session.messages;
    }

    static async appendMessages(
        userId: number,
        sessionId: string,
        messages: { role: string; content: string }[],
    ) {
        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId },
            select: { id: true },
        });
        if (!session) return null;

        await prisma.$transaction([
            prisma.chatMessage.createMany({
                data: messages.map((m) => ({
                    sessionId,
                    role: m.role,
                    content: m.content,
                })),
            }),
            prisma.chatSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
            }),
        ]);

        return { ok: true };
    }

    static async updateSessionTitle(userId: number, sessionId: string, title: string) {
        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId },
            select: { id: true },
        });
        if (!session) return null;

        return await prisma.chatSession.update({
            where: { id: sessionId },
            data: { title },
        });
    }

    static async deleteSession(userId: number, sessionId: string) {
        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId },
            select: { id: true },
        });
        if (!session) return null;

        // ChatMessage cascades via schema onDelete
        return await prisma.chatSession.delete({
            where: { id: sessionId },
        });
    }
}
