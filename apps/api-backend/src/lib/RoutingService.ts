import { prisma } from "db";
import logger from "./logger";

export abstract class RoutingService {
    /**
     * Finds the optimal provider based on Price, Latency, and Reliability.
     */
    static async selectProvider(modelId: number) {
        // 1. Get all candidate mappings
        const mappings = await prisma.modelProviderMapping.findMany({
            where: { modelId },
            include: { provider: true }
        });

        if (mappings.length === 0) return null;
        if (mappings.length === 1) return mappings[0];

        // 2. Fetch recent performance metrics for these mappings
        // We look at the last 10 conversations for each mapping to calculate health
        const performanceMetrics = await Promise.all(
            mappings.map(async (m) => {
                const recentConvos = await prisma.conversation.findMany({
                    where: { modelProviderMappingId: m.id },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: { status: true, durationMs: true }
                });

                const successRate = recentConvos.length > 0 
                    ? recentConvos.filter(c => c.status === 'COMPLETED').length / recentConvos.length 
                    : 1.0; // Assume healthy if no data

                const avgLatency = recentConvos.length > 0
                    ? recentConvos.reduce((sum, c) => sum + (c.durationMs || 0), 0) / recentConvos.length
                    : 0;

                return {
                    id: m.id,
                    successRate,
                    avgLatency,
                    totalPrice: Number(m.inputPricePer1k) + Number(m.outputPricePer1k)
                };
            })
        );

        // 3. Scoring Algorithm
        // We want: Lowest Price (Weight 60%), Highest Success (Weight 30%), Lowest Latency (Weight 10%)
        const scoredMappings = mappings.map(m => {
            const metrics = performanceMetrics.find(p => p.id === m.id)!;
            
            // Normalize metrics (simple version)
            // Price: Lower is better
            const priceScore = 1 / (metrics.totalPrice || 0.000001);
            
            // Reliability: Higher is better (Square it to heavily penalize failures)
            const reliabilityScore = Math.pow(metrics.successRate, 2);
            
            // Latency: Lower is better
            const latencyScore = metrics.avgLatency > 0 ? 1 / metrics.avgLatency : 1;

            const finalScore = (priceScore * 0.6) + (reliabilityScore * 0.3) + (latencyScore * 0.1);

            return { mapping: m, score: finalScore };
        });

        // 4. Sort and select
        scoredMappings.sort((a, b) => b.score - a.score);
        
        const best = scoredMappings[0].mapping;
        logger.info(`Routing Decision: Selected ${best.provider.name} for Model ${modelId} (Score: ${scoredMappings[0].score.toFixed(4)})`);
        
        return best;
    }
}
