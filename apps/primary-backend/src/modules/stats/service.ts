import { prisma } from "db"

export abstract class StatsService {
    static async getPlatformStats() {
        const conversations = await prisma.conversation.findMany({
            select: {
                inputTokenCount: true,
                outputTokenCount: true,
                chargedCost: true,
                margin: true,
                status: true,
                rawCost: true
            }
        });

        const totalTokens = conversations.reduce((acc, curr) => acc + curr.inputTokenCount + curr.outputTokenCount, 0);
        const totalRevenue = conversations.reduce((acc, curr) => acc + Number(curr.chargedCost ?? 0), 0);
        const totalMargin = conversations.reduce((acc, curr) => acc + Number(curr.margin ?? 0), 0);
        const totalCost = conversations.reduce((acc, curr) => acc + Number(curr.rawCost ?? 0), 0);

        const averageMargin = conversations.length > 0 ? (totalMargin / totalRevenue) * 100 : 0;
        const successRate = conversations.length > 0 
            ? (conversations.filter(c => c.status === "COMPLETED").length / conversations.length) * 100 
            : 100;

        // Group by provider for health (simplified)
        const providers = await prisma.provider.findMany({
            include: {
                modelProviderMappings: {
                    include: {
                        conversations: {
                            take: 10,
                            orderBy: { id: "desc" }
                        }
                    }
                }
            }
        });

        const providerHealth = providers.map(p => {
            const lastConvs = p.modelProviderMappings.flatMap(m => m.conversations);
            const recentSuccess = lastConvs.filter(c => c.status === "COMPLETED").length;
            const healthScore = lastConvs.length > 0 ? (recentSuccess / lastConvs.length) * 100 : 100;

            return {
                id: p.id.toString(),
                name: p.name,
                latency: "120ms", // Mocked for now
                status: healthScore > 90 ? "Optimal" : healthScore > 50 ? "Degraded" : "Critical",
                isWarning: healthScore <= 90
            }
        });

        return {
            metrics: {
                totalTokens,
                totalRevenue,
                totalMargin,
                totalCost,
                averageMargin,
                successRate,
                activeSessions: 42 // Mocked
            },
            providerHealth
        }
    }
}
