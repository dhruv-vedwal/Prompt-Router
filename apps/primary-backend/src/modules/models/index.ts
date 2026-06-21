import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { ModelsModel } from "./models";
import { ModelsService } from "./service";

export const app = new Elysia({ prefix: "models" })
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET!
        })
    )
    .get("/", async () => {
        const models = await ModelsService.getModels();
        return {
            models
        }
    }, {
        response: {
            200: ModelsModel.getModelsResponseSchema
        }
    })
    .get("/providers", async () => {
        const providers = await ModelsService.getProviders();
        return {
            providers
        }
    }, {
        response: {
            200: ModelsModel.getProvidersResponseSchema
        }
    })
    .get("/companies", async () => {
        const companies = await ModelsService.getCompanies();
        return {
            companies
        }
    })
    .resolve(async ({ cookie: { auth }, status, jwt}) => {
        if (!auth) return status(401)
        const decoded = await jwt.verify(auth.value as string);
        if (!decoded || !decoded.userId) return status(401)
        return {
            userId: decoded.userId as string,
            role: decoded.role as string
        }
    })
    .post("/companies", async ({ body, role, status }) => {
        if (role !== "ADMIN") return status(403, { message: "Forbidden" });
        return await ModelsService.createCompany(body);
    }, {
        body: t.Object({
            name: t.String(),
            website: t.String()
        })
    })
    .get("/:id/providers", async ({ params: { id } }) => {
        const mappings = await ModelsService.getModelProviders(Number(id));
        return {
            providers: mappings.map(m => ({
                id: m.id,
                providerId: m.provider.id,
                providerName: m.provider.name,
                providerWebsite: m.provider.website,
                inputTokenCost: Number(m.inputPricePer1k),
                outputTokenCost: Number(m.outputPricePer1k)
            }))
        }
    }, {
        response: {
            200: ModelsModel.getModelProvidersResponseSchema
        }
    })
    .post("/", async ({ body, role, status }) => {
        if (role !== "ADMIN") return status(403, { message: "Forbidden" });
        return await ModelsService.createModel(body);
    }, {
        body: ModelsModel.createModelSchema
    })
    .delete("/:id", async ({ params: { id }, role, status }) => {
        if (role !== "ADMIN") return status(403, { message: "Forbidden" });
        return await ModelsService.deleteModel(Number(id));
    })
    .post("/providers", async ({ body, role, status }) => {
        if (role !== "ADMIN") return status(403, { message: "Forbidden" });
        return await ModelsService.createProvider(body);
    }, {
        body: ModelsModel.createProviderSchema
    })
    .delete("/providers/:id", async ({ params: { id }, role, status }) => {
        if (role !== "ADMIN") return status(403, { message: "Forbidden" });
        return await ModelsService.deleteProvider(Number(id));
    })
    .post("/mapping", async ({ body, role, status }) => {
        if (role !== "ADMIN") return status(403, { message: "Forbidden" });
        return await ModelsService.createModelProviderMapping({
            modelId: Number(body.modelId),
            providerId: Number(body.providerId),
            inputPricePer1k: Number(body.inputTokenCost),
            outputPricePer1k: Number(body.outputTokenCost),
            markupMultiplier: 1.2
        });
    }, {
        body: ModelsModel.createModelProviderSchema
    })
