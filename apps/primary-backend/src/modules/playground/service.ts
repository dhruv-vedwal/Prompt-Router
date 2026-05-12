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

    static async updateSessionTitle(userId: number, sessionId: string, title: string) {
        return await prisma.chatSession.update({
            where: {
                id: sessionId,
                userId
            },
            data: {
                title
            }
        });
    }

    static async deleteSession(userId: number, sessionId: string) {
        return await prisma.chatSession.delete({
            where: {
                id: sessionId,
                userId
            }
        });
    }
}
