import { afterEach, describe, expect, test } from "bun:test";
import { corsOrigins, requireJwtSecret } from "./env";
import { ApiKeyCrypto } from "./ApiKeyCrypto";

describe("primary-backend corsOrigins", () => {
  const prevOrigin = process.env.FRONTEND_ORIGIN;
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (prevOrigin === undefined) delete process.env.FRONTEND_ORIGIN;
    else process.env.FRONTEND_ORIGIN = prevOrigin;
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
  });

  test("production denies unknown origins when unset", () => {
    delete process.env.FRONTEND_ORIGIN;
    process.env.NODE_ENV = "production";
    expect(corsOrigins()).toEqual([]);
  });
});

describe("requireJwtSecret", () => {
  const prev = process.env.JWT_SECRET;
  afterEach(() => {
    if (prev === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prev;
  });

  test("throws when missing or short", () => {
    delete process.env.JWT_SECRET;
    expect(() => requireJwtSecret()).toThrow();
    process.env.JWT_SECRET = "short";
    expect(() => requireJwtSecret()).toThrow();
  });

  test("returns secret when valid", () => {
    process.env.JWT_SECRET = "1234567890123456";
    expect(requireJwtSecret()).toBe("1234567890123456");
  });
});

describe("ApiKeyCrypto", () => {
  test("create path stores hash-shaped values", () => {
    const plaintext = ApiKeyCrypto.generateKey();
    const hash = ApiKeyCrypto.hashKey(plaintext);
    expect(hash).toHaveLength(64);
    expect(ApiKeyCrypto.keyPrefix(plaintext)).toHaveLength(12);
    expect(hash).not.toBe(plaintext);
  });
});
