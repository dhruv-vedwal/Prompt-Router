import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { PlaygroundService } from "./service";
import { requireJwtSecret } from "../../lib/env";
import { ApiKeyService } from "../apiKeys/service";

export const app = new Elysia({ prefix: "playground" })
    .use(
        jwt({
            name: 'jwt',
            secret: requireJwtSecret()
        })
    )
    .resolve(async ({ cookie: { auth }, status, jwt}) => {
        if (!auth) return status(401)
        const decoded = await jwt.verify(auth.value as string);
        if (!decoded || !decoded.userId) return status(401)
        return {
            userId: decoded.userId as string
        }
    })
    .get("/history", async ({ userId }) => {
        return await PlaygroundService.getChatHistory(Number(userId));
    })
    .get("/history/:sessionId", async ({ userId, params: { sessionId }, status }) => {
        const messages = await PlaygroundService.getSessionMessages(Number(userId), sessionId);
        if (!messages) return status(404, { message: "Session not found" });
        return { messages };
    })
    .post("/session", async ({ userId, body }) => {
        return await PlaygroundService.createSession(Number(userId), body.title);
    }, {
        body: t.Object({
            title: t.Optional(t.String())
        })
    })
    .post("/session/:sessionId/messages", async ({ userId, params: { sessionId }, body, status }) => {
        const result = await PlaygroundService.appendMessages(
            Number(userId),
            sessionId,
            body.messages,
        );
        if (!result) return status(404, { message: "Session not found" });
        return result;
    }, {
        body: t.Object({
            messages: t.Array(t.Object({
                role: t.String(),
                content: t.String(),
            })),
        }),
    })
    .post("/chat/stream", async ({ userId, body, status, set }) => {
        const routerUrl = process.env.ROUTER_API_URL || "http://localhost:4000";
        const secret = process.env.INTERNAL_SERVICE_SECRET;
        if (!secret) {
            return status(500, { message: "INTERNAL_SERVICE_SECRET is not configured" });
        }

        const keyId = await ApiKeyService.getFirstActiveKeyId(Number(userId));
        if (!keyId) {
            return status(400, { message: "Create an API key before using the playground" });
        }

        const upstream = await fetch(`${routerUrl}/api/v1/chat/completions/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Internal-Secret": secret,
                "X-Internal-User-Id": userId,
            },
            body: JSON.stringify({
                model: body.model,
                messages: body.messages,
                sessionId: body.sessionId,
                temperature: body.temperature,
                max_tokens: body.max_tokens,
            }),
        });

        if (!upstream.ok || !upstream.body) {
            const text = await upstream.text().catch(() => "");
            return status(upstream.status as 400, {
                message: text || "Upstream router error",
            });
        }

        set.headers["Content-Type"] = "text/event-stream";
        set.headers["Cache-Control"] = "no-cache";
        set.headers["Connection"] = "keep-alive";

        return new Response(upstream.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    }, {
        body: t.Object({
            model: t.String(),
            messages: t.Array(t.Object({
                role: t.String(),
                content: t.String(),
            })),
            sessionId: t.Optional(t.String()),
            temperature: t.Optional(t.Number()),
            max_tokens: t.Optional(t.Number()),
        }),
    })
    .put("/session/:sessionId", async ({ userId, params: { sessionId }, body, status }) => {
        const updated = await PlaygroundService.updateSessionTitle(Number(userId), sessionId, body.title);
        if (!updated) return status(404, { message: "Session not found" });
        return updated;
    }, {
        body: t.Object({
            title: t.String()
        })
    })
    .delete("/session/:sessionId", async ({ userId, params: { sessionId }, status }) => {
        const deleted = await PlaygroundService.deleteSession(Number(userId), sessionId);
        if (!deleted) return status(404, { message: "Session not found" });
        return { message: "Session deleted" };
    });
