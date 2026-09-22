import { beforeAll, describe, expect, it } from "bun:test";

/**
 * Authz / cookie smoke tests against the Elysia app.
 * Requires JWT_SECRET; DB-backed routes return 401/403 without a valid session.
 */
beforeAll(() => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    process.env.JWT_SECRET = "test_jwt_secret_16chars";
  }
});

describe("auth and admin guards", () => {
  it("rejects unauthenticated profile", async () => {
    const { app } = await import("../app");
    const response = await app.handle(new Request("http://localhost/auth/profile"));
    expect(response.status).toBe(401);
  });

  it("rejects unauthenticated admin users list", async () => {
    const { app } = await import("../app");
    const response = await app.handle(new Request("http://localhost/admin/users"));
    expect(response.status).toBe(401);
  });

  it("sign-out clears cookie (Set-Cookie max-age 0)", async () => {
    const { app } = await import("../app");
    const response = await app.handle(
      new Request("http://localhost/auth/sign-out", { method: "POST" }),
    );
    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie") || "";
    expect(setCookie.toLowerCase()).toMatch(/auth=/);
    expect(setCookie).toMatch(/Max-Age=0|max-age=0/i);
  });

  it("api-keys list requires auth", async () => {
    const { app } = await import("../app");
    const response = await app.handle(new Request("http://localhost/api-keys/"));
    expect(response.status).toBe(401);
  });
});
