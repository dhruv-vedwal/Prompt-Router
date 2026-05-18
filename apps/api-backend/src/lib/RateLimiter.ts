import logger from "./logger";

interface LimitBucket {
    requests: number[];
    tokens: number[];
}

export abstract class RateLimiter {
    // Memory-safe cache for local rate limiting
    // In production with multiple instances, this should be moved to Redis
    private static cache: Map<string, LimitBucket> = new Map();

    /**
     * Verifies if a request can proceed based on RPM and TPM limits.
     * @returns true if allowed, false if rate limited
     */
    static check(apiKeyId: number, rpmLimit: number, tpmLimit: number, estimatedTokens: number): { allowed: boolean; reason?: string } {
        const key = apiKeyId.toString();
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute window

        if (!this.cache.has(key)) {
            this.cache.set(key, { requests: [], tokens: [] });
        }

        const bucket = this.cache.get(key)!;

        // 1. Clean up old timestamps (sliding window)
        bucket.requests = bucket.requests.filter(t => now - t < windowMs);
        bucket.tokens = bucket.tokens.filter(t => now - t < windowMs);

        // 2. Check RPM
        if (bucket.requests.length >= rpmLimit) {
            logger.warn(`Rate Limit Hit (RPM): Key ${apiKeyId} (${bucket.requests.length}/${rpmLimit})`);
            return { allowed: false, reason: "RPM limit exceeded" };
        }

        // 3. Check TPM
        const currentTokens = bucket.tokens.length; // Simplified: every entry in 'tokens' array is 1 token
        // In a real TPM check, we sum the actual token counts in the window
        // For efficiency in this in-memory version, I'll store [timestamp, count] tuples if needed, 
        // but let's stick to a sum-based sliding window for accuracy.
        
        const totalTokensInWindow = this.sumTokens(bucket.tokens);
        if (totalTokensInWindow + estimatedTokens > tpmLimit) {
            logger.warn(`Rate Limit Hit (TPM): Key ${apiKeyId} (${totalTokensInWindow + estimatedTokens}/${tpmLimit})`);
            return { allowed: false, reason: "TPM limit exceeded" };
        }

        // 4. Record usage
        bucket.requests.push(now);
        // We push the timestamp multiple times to represent token weight 
        // or we store as [timestamp, weight]. Let's do [timestamp, weight] approach.
        // Actually, for this simple version, let's just store the tokens used.
        this.addTokens(bucket, now, estimatedTokens);

        return { allowed: true };
    }

    private static sumTokens(tokens: number[]): number {
        // In this implementation, tokens array stores weights directly for simplicity in the sliding window
        // But to keep it efficient, we'll just track the total.
        return tokens.length; // This is a placeholder for a more complex sum if needed.
    }

    private static addTokens(bucket: LimitBucket, timestamp: number, count: number) {
        // For the in-memory version, we'll just push 'count' number of entries
        // This is memory-intensive but accurate for a sliding window without Redis.
        // We cap it to prevent memory leaks in extreme cases.
        const safeCount = Math.min(count, 100000); 
        for (let i = 0; i < safeCount; i++) {
            bucket.tokens.push(timestamp);
        }
    }
    
    /**
     * Memory cleanup job to prevent leaks
     */
    static cleanup() {
        const now = Date.now();
        const windowMs = 60 * 1000;
        for (const [key, bucket] of this.cache.entries()) {
            bucket.requests = bucket.requests.filter(t => now - t < windowMs);
            bucket.tokens = bucket.tokens.filter(t => now - t < windowMs);
            if (bucket.requests.length === 0 && bucket.tokens.length === 0) {
                this.cache.delete(key);
            }
        }
    }
}
