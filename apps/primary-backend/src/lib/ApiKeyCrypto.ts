import { createHash, randomBytes } from "crypto";

const SHA256_HEX_LEN = 64;

/** Shared with api-backend SecurityService semantics for hashing/prefixes. */
export abstract class ApiKeyCrypto {
    static hashKey(key: string): string {
        return createHash("sha256").update(key).digest("hex");
    }

    static isHashed(storedKey: string): boolean {
        return storedKey.length === SHA256_HEX_LEN && /^[a-f0-9]+$/i.test(storedKey);
    }

    static generateKey(): string {
        return `sk-or-v1-${randomBytes(24).toString("hex")}`;
    }

    static keyPrefix(plaintext: string): string {
        return plaintext.slice(0, 12);
    }
}
