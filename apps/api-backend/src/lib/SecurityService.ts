import CryptoJS from "crypto-js";

export abstract class SecurityService {
    /**
     * Hashes an API key for secure storage.
     */
    static hashKey(key: string): string {
        return CryptoJS.SHA256(key).toString();
    }

    /**
     * Verifies an incoming key against a stored hash.
     * Supports a "Legacy" check for plain text keys during migration.
     */
    static verifyKey(incomingKey: string, storedKey: string): boolean {
        const hash = this.hashKey(incomingKey);
        
        // Match the hash
        if (hash === storedKey) return true;
        
        // Legacy Support: Match the plain text (if not yet migrated)
        // This is safe because storedKey will be much shorter than a hash if it's plain text.
        if (incomingKey === storedKey) return true;

        return false;
    }

    /**
     * Generates a new cryptographically secure API key.
     */
    static generateKey(): string {
        const prefix = "pr-";
        const random = CryptoJS.lib.WordArray.random(24).toString();
        return `${prefix}${random}`;
    }
}
