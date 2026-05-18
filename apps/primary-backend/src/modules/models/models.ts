import { t } from "elysia";

export namespace ModelsModel {
    export const getModelsResponseSchema = t.Object({
        models: t.Array(t.Object({
            id: t.Number(),
            name: t.String(),
            slug: t.String(),
            company: t.Object({
                id: t.Number(),
                name: t.String(),
                website: t.String()
            }),
            modelProviderMappings: t.Array(t.Object({
                id: t.Number(),
                enabled: t.Boolean(),
                inputPricePer1k: t.Number(),
                outputPricePer1k: t.Number(),
                markupMultiplier: t.Number(),
                provider: t.Object({
                    id: t.Number(),
                    name: t.String(),
                    website: t.String()
                })
            }))
        }))
    })

    export type getModelsResponseSchema = typeof getModelsResponseSchema.static;

    export const getProvidersResponseSchema = t.Object({
        providers: t.Array(t.Object({
            id: t.Number(),
            name: t.String(),
            website: t.String()
        }))
    })

    export type getProvidersResponseSchema = typeof getProvidersResponseSchema.static;

    export const getModelProvidersResponseSchema = t.Object({
        providers: t.Array(t.Object({
            id: t.Number(),
            providerId: t.Number(),
            providerName: t.String(),
            providerWebsite: t.String(),
            inputTokenCost: t.Number(),
            outputTokenCost: t.Number()
        }))
    })

    export type getModelProvidersResponseSchema = typeof getModelProvidersResponseSchema.static;

    export const createModelSchema = t.Object({
        name: t.String(),
        slug: t.String(),
        companyId: t.String()
    })

    export const updateModelSchema = t.Partial(createModelSchema);

    export const createProviderSchema = t.Object({
        name: t.String(),
        website: t.String()
    })

    export const createModelProviderSchema = t.Object({
        modelId: t.String(),
        providerId: t.String(),
        inputTokenCost: t.Number(),
        outputTokenCost: t.Number()
    })
}
