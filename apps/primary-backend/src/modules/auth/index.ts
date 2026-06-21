import { Cookie, Elysia, t } from "elysia";
import { AuthModel } from "./models";
import { AuthService } from "./service";
import jwt from "@elysiajs/jwt";
import { password } from "bun";

export const app = new Elysia({ prefix: "auth" })
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET!
        })
    )
    .post("/sign-up", async ({ body, status }) => {
        try {
            const userId = await AuthService.signup(body.email, body.password);
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
            if (!auth) {
                auth = new Cookie("auth", {});
            }

            auth.set({
                value: token,
                httpOnly: true,
                maxAge: 7 * 86400,
            })

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
    .resolve(async ({ cookie: { auth }, status, jwt}) => {
        if (!auth) {
            return status(401)
        }

        const decoded = await jwt.verify(auth.value as string);

        if (!decoded || !decoded.userId) {
            return status(401)
        }

        return {
            userId: decoded.userId as string,
            role: decoded.role as string
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