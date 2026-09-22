import { Cookie, Elysia, t } from "elysia";
import { AuthModel } from "./models";
import { AuthService } from "./service";
import jwt from "@elysiajs/jwt";
import { requireJwtSecret } from "../../lib/env";
import { prisma } from "db";

function applyAuthCookie(auth: Cookie<unknown> | undefined, token: string) {
    if (!auth) {
        auth = new Cookie("auth", {});
    }
    const crossSite = process.env.COOKIE_SAME_SITE === "none";
    auth.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400,
        path: "/",
        secure: crossSite,
        sameSite: crossSite ? "none" : "lax",
    });
    return auth;
}

function clearAuthCookie(auth: Cookie<unknown> | undefined) {
    if (!auth) return;
    const crossSite = process.env.COOKIE_SAME_SITE === "none";
    auth.set({
        value: "",
        httpOnly: true,
        maxAge: 0,
        path: "/",
        secure: crossSite,
        sameSite: crossSite ? "none" : "lax",
    });
}

export const app = new Elysia({ prefix: "auth" })
    .use(
        jwt({
            name: 'jwt',
            secret: requireJwtSecret()
        })
    )
    .post("/sign-up", async ({ jwt, body, status, cookie: { auth } }) => {
        try {
            const userId = await AuthService.signup(body.email, body.password);
            const { correctCredentials, role } = await AuthService.signin(body.email, body.password);
            if (correctCredentials && userId) {
                const token = await jwt.sign({ userId, role });
                applyAuthCookie(auth, token);
            }
            return {
                id: userId
            }
        } catch(e) {
            console.error("Signup Error:", e);
            return status(400, {
                message: "Error while signing up"
            })
        }
    }, {
        body: AuthModel.signupSchema,
        response: {
            200: AuthModel.signupResponseSchema,
            400: AuthModel.signupFailedResponseSchema,
        }
    })
    .post("/sign-in", async ({ jwt, body, status, cookie: { auth } }) => {
        const { correctCredentials, userId, role } = await AuthService.signin(body.email, body.password)
        if (correctCredentials && userId) {
            const token = await jwt.sign({ userId, role })
            applyAuthCookie(auth, token);

            return {
                message: "Signed in successfully"
            }
        } else {
            return status(403, {
                message: "Incorrect credentials"
            })
        }
    }, {
        body: AuthModel.signinSchema,
        response: {
            200: AuthModel.signinResponseSchema,
            403: AuthModel.signinFailureSchema
        }
    })
    .post("/sign-out", async ({ cookie: { auth } }) => {
        clearAuthCookie(auth);
        return { message: "Signed out" };
    })
    .resolve(async ({ cookie: { auth }, status, jwt}) => {
        if (!auth) {
            return status(401)
        }

        const decoded = await jwt.verify(auth.value as string);

        if (!decoded || !decoded.userId) {
            return status(401)
        }

        // Prefer live DB role over JWT snapshot
        const user = await prisma.user.findUnique({
            where: { id: Number(decoded.userId) },
            select: { role: true },
        });

        return {
            userId: decoded.userId as string,
            role: (user?.role ?? decoded.role) as string
        }
    })
    .get("/profile", async({ userId, status }) => {
        const userData = await AuthService.getUserDetails(Number(userId));
        if (!userData) {
            return status(400, {
                message: "Error while fetching user details"
            })
        }
        return userData
    }, {
        response: {
            200: AuthModel.profileResponseSchema,
            400: AuthModel.profileResponseErrorSchema
        }
    })
    .put("/profile", async ({ userId, body, status }) => {
        try {
            await AuthService.updatePassword(Number(userId), body.password);
            return {
                message: "Password updated successfully"
            }
        } catch (e) {
            return status(400, {
                message: "Failed to update profile"
            })
        }
    }, {
        body: t.Object({
            password: t.String()
        }),
        response: {
            200: t.Object({
                message: t.String()
            }),
            400: t.Object({
                message: t.String()
            })
        }
    })
