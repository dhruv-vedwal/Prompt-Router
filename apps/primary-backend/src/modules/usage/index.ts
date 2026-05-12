import Elysia from "elysia";
import jwt from "@elysiajs/jwt";
import { UsageService } from "./service";

export const app = new Elysia({ prefix: "usage" })
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
    .get("/stats", async ({ userId }) => {
        return await UsageService.getUserUsage(Number(userId));
    });
