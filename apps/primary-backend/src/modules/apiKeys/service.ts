import { prisma } from "db"
import { ApiKeyCrypto } from "../../lib/ApiKeyCrypto";

export abstract class ApiKeyService {
    static async createApiKey(name: string, userId: number): Promise<{
        id: string,
        apiKey: string
    }> {
        const plaintext = ApiKeyCrypto.generateKey();
        const apiKeyDb = await prisma.apiKey.create({
            data: {
                name,
                apiKey: ApiKeyCrypto.hashKey(plaintext),
                keyPrefix: ApiKeyCrypto.keyPrefix(plaintext),
                userId
            }
        })

        return {
            id: apiKeyDb.id.toString(),
            apiKey: plaintext,
        }
    }

    static async getApiKeys(userId: number) {
        const apiKeys = await prisma.apiKey.findMany({
            where: {
                userId: userId,
                deleted: false
            }
        })

        return apiKeys.map(apiKey => ({
            id: apiKey.id.toString(),
            keyPrefix: apiKey.keyPrefix || ApiKeyCrypto.keyPrefix(apiKey.apiKey),
            name: apiKey.name,
            creditsConsumed: apiKey.creditsConsumed.toString(),
            lastUsed: apiKey.lastUsed,
            createdAt: apiKey.createdAt,
            disabled: apiKey.disabled
        }))
    }

    static async updateApiKeyDisabled(apiKeyId: number, userId: number, disabled: boolean) {
        await prisma.apiKey.update({
            where: {
                id: apiKeyId,
                userId
            },
            data: {
                disabled
            }
        })
    }

    static async delete(id: number, userId: number) {
        await prisma.apiKey.update({
            where: {
                id,
                userId
            },
            data: {
                deleted: true
            }
        })
    }

    /** First active key id for playground proxy (secret never leaves the DB hashed). */
    static async getFirstActiveKeyId(userId: number): Promise<number | null> {
        const key = await prisma.apiKey.findFirst({
            where: { userId, deleted: false, disabled: false },
            orderBy: { id: "asc" },
            select: { id: true },
        });
        return key?.id ?? null;
    }
}
