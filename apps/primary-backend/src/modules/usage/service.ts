import { prisma } from "db"

export abstract class UsageService {
    static async getUserUsage(userId: number) {
        const conversations = await prisma.conversation.findMany({
            where: {
                userId,
                status: "COMPLETED"
            },
            include: {
                modelProviderMapping: {
                    include: {
                        model: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // 1. Total Metrics
        const totalTokens = conversations.reduce((acc, curr) => acc + curr.inputTokenCount + curr.outputTokenCount, 0);
        const totalSpent = conversations.reduce((acc, curr) => acc + Number(curr.chargedCost ?? 0), 0);
        const totalRequests = conversations.length;

        // 2. Throughput Metrics (TPS) - Grouped by Model
        const modelThroughput: Record<string, { totalTokens: number, totalDurationMs: number, count: number }> = {};
        
        conversations.forEach(c => {
            if (!c.durationMs) return;
            const modelName = c.modelProviderMapping.model.name;
            if (!modelThroughput[modelName]) {
                modelThroughput[modelName] = { totalTokens: 0, totalDurationMs: 0, count: 0 };
            }
            modelThroughput[modelName].totalTokens += (c.inputTokenCount + c.outputTokenCount);
            modelThroughput[modelName].totalDurationMs += c.durationMs;
            modelThroughput[modelName].count += 1;
        });

        const throughput = Object.entries(modelThroughput).map(([name, stats]) => ({
            model: name,
            avgTps: stats.totalDurationMs > 0 
                ? (stats.totalTokens / (stats.totalDurationMs / 1000)) 
                : 0,
            avgLatency: stats.totalDurationMs / stats.count
        }));

        // 3. Daily Usage (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyUsageMap: Record<string, { tokens: number, cost: number }> = {};
        
        // Initialize last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            dailyUsageMap[dateStr] = { tokens: 0, cost: 0 };
        }

        conversations.forEach(c => {
            const dateStr = c.createdAt.toISOString().split("T")[0];
            if (dailyUsageMap[dateStr]) {
                dailyUsageMap[dateStr].tokens += (c.inputTokenCount + c.outputTokenCount);
                dailyUsageMap[dateStr].cost += Number(c.chargedCost ?? 0);
            }
        });

        const dailyUsage = Object.entries(dailyUsageMap)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            total: {
                tokens: totalTokens,
                spent: totalSpent,
                requests: totalRequests
            },
            throughput,
            dailyUsage
        };
    }
}
