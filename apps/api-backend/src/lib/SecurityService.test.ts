import { describe, expect, test } from "bun:test";
import { SecurityService } from "./SecurityService";

describe("SecurityService API key hashing", () => {
  test("generateKey uses CSPRNG-style prefix", () => {
    const key = SecurityService.generateKey();
    expect(key.startsWith("sk-or-v1-")).toBe(true);
    expect(key.length).toBeGreaterThan(20);
  });

  test("hashKey is stable SHA-256 hex", () => {
    const hash = SecurityService.hashKey("sk-or-v1-test");
    expect(hash).toHaveLength(64);
    expect(SecurityService.isHashed(hash)).toBe(true);
    expect(SecurityService.hashKey("sk-or-v1-test")).toBe(hash);
  });

  test("verifyKey matches hash without treating hash as plaintext", () => {
    const plaintext = "sk-or-v1-abc123secret";
    const hash = SecurityService.hashKey(plaintext);
    expect(SecurityService.verifyKey(plaintext, hash)).toBe(true);
    expect(SecurityService.verifyKey("wrong", hash)).toBe(false);
    // Re-hashing a hash must NOT verify against the original plaintext path
    expect(SecurityService.verifyKey(hash, SecurityService.hashKey(hash))).toBe(true);
    expect(SecurityService.verifyKey(plaintext, SecurityService.hashKey(hash))).toBe(false);
  });

  test("legacy plaintext match only when stored value is not a hash", () => {
    const legacy = "sk-or-v1-legacy-plaintext-key";
    expect(SecurityService.needsMigration(legacy)).toBe(true);
    expect(SecurityService.verifyKey(legacy, legacy)).toBe(true);
    expect(SecurityService.verifyKey("other", legacy)).toBe(false);
  });

  test("never migrates an already-hashed key as if it were plaintext", () => {
    const plaintext = "sk-or-v1-real";
    const hash = SecurityService.hashKey(plaintext);
    expect(SecurityService.needsMigration(hash)).toBe(false);
    // Incoming key that equals the stored hash string should only match if we hash it again —
    // verifyKey compares hash(incoming) === stored, so presenting the digest as the key fails.
    expect(SecurityService.verifyKey(hash, hash)).toBe(false);
  });

  test("keyPrefix is first 12 chars", () => {
    expect(SecurityService.keyPrefix("sk-or-v1-abcdef")).toBe("sk-or-v1-abc");
  });
});
