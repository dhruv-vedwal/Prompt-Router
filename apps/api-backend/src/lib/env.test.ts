import { afterEach, describe, expect, test } from "bun:test";
import { corsOrigins, listenPort } from "./env";

describe("corsOrigins", () => {
  const prevOrigin = process.env.FRONTEND_ORIGIN;
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (prevOrigin === undefined) delete process.env.FRONTEND_ORIGIN;
    else process.env.FRONTEND_ORIGIN = prevOrigin;
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
  });

  test("dev without FRONTEND_ORIGIN reflects any origin", () => {
    delete process.env.FRONTEND_ORIGIN;
    process.env.NODE_ENV = "development";
    expect(corsOrigins()).toBe(true);
  });

  test("production without FRONTEND_ORIGIN denies (empty allowlist)", () => {
    delete process.env.FRONTEND_ORIGIN;
    process.env.NODE_ENV = "production";
    expect(corsOrigins()).toEqual([]);
  });

  test("parses comma-separated allowlist", () => {
    process.env.FRONTEND_ORIGIN = "https://app.example.com, https://www.example.com";
    const origins = corsOrigins();
    expect(origins).toEqual(["https://app.example.com", "https://www.example.com"]);
  });

  test("single origin returns string", () => {
    process.env.FRONTEND_ORIGIN = "https://app.example.com";
    expect(corsOrigins()).toBe("https://app.example.com");
  });
});

describe("listenPort", () => {
  const prev = process.env.PORT;
  afterEach(() => {
    if (prev === undefined) delete process.env.PORT;
    else process.env.PORT = prev;
  });

  test("uses PORT when set", () => {
    process.env.PORT = "8080";
    expect(listenPort(4000)).toBe(8080);
  });

  test("falls back when PORT unset", () => {
    delete process.env.PORT;
    expect(listenPort(4000)).toBe(4000);
  });
});
