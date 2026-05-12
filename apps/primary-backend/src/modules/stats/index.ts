import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { StatsService } from "./service";

export const app = new Elysia({ prefix: "admin/stats" })
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
            userId: decoded.userId as string,
            role: decoded.role as string
        }
    })
    .get("/", async ({ role, status }) => {
        if (role !== "ADMIN") return status(403, { message: "Forbidden" });
        return await StatsService.getPlatformStats();
    })
