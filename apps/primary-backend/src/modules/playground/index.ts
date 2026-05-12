import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { PlaygroundService } from "./service";

export const app = new Elysia({ prefix: "playground" })
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET!
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
    .get("/history/:sessionId", async ({ userId, params: { sessionId } }) => {
        const messages = await PlaygroundService.getSessionMessages(Number(userId), sessionId);
        if (!messages) return { error: "Session not found" };
        return { messages };
    })
    .post("/session", async ({ userId, body }) => {
        return await PlaygroundService.createSession(Number(userId), body.title);
    }, {
        body: t.Object({
            title: t.Optional(t.String())
        })
    })
    .put("/session/:sessionId", async ({ userId, params: { sessionId }, body }) => {
        return await PlaygroundService.updateSessionTitle(Number(userId), sessionId, body.title);
    }, {
        body: t.Object({
            title: t.String()
        })
    })
    .delete("/session/:sessionId", async ({ userId, params: { sessionId } }) => {
        return await PlaygroundService.deleteSession(Number(userId), sessionId);
    });
