import CryptoJS from "crypto-js";

const SHA256_HEX_LEN = 64;

export abstract class SecurityService {
    static hashKey(key: string): string {
        return CryptoJS.SHA256(key).toString();
    }

    /** True when the stored value looks like a SHA-256 hex digest. */
    static isHashed(storedKey: string): boolean {
        return storedKey.length === SHA256_HEX_LEN && /^[a-f0-9]+$/i.test(storedKey);
    }

    /**
     * Verifies an incoming key against a stored hash (or legacy plaintext).
     * Never treats a hash as plaintext — that caused re-hashing and bricked keys.
     */
    static verifyKey(incomingKey: string, storedKey: string): boolean {
        const hash = this.hashKey(incomingKey);
        if (hash === storedKey) return true;

        // Legacy: plaintext only when stored value is clearly not a hash
        if (!this.isHashed(storedKey) && incomingKey === storedKey) return true;

        return false;
    }

    static needsMigration(storedKey: string): boolean {
        return !this.isHashed(storedKey);
    }

    static generateKey(): string {
        const prefix = "sk-or-v1-";
        const random = CryptoJS.lib.WordArray.random(24).toString();
        return `${prefix}${random}`;
    }

    static keyPrefix(plaintext: string): string {
        return plaintext.slice(0, 12);
    }
}
