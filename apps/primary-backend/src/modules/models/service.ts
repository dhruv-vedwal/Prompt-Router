import { prisma } from "db"

export abstract class ModelsService {

    static async getModels() {
        const models = await prisma.model.findMany({
            include: {
                company: true
            }
        })

        return models.map(model => ({
            id: model.id.toString(),
            name: model.name,
            slug: model.slug,
            company: {
                id: model.company.id.toString(),
                name: model.company.name,
                website: model.company.website
            }
        }))
    }

    static async getProviders() {
        const providers = await prisma.provider.findMany()

        return providers.map(provider => ({
            id: provider.id.toString(),
            name: provider.name,
            website: provider.website
        }))
    }

    static async getModelProviders(modelId: number) {
        const mappings = await prisma.modelProviderMapping.findMany({
            where: {
                modelId
            },
            include: {
                provider: true
            }
        })

        return mappings.map(mapping => ({
            id: mapping.id.toString(),
            providerId: mapping.provider.id.toString(),
            providerName: mapping.provider.name,
            providerWebsite: mapping.provider.website,
            inputTokenCost: Number(mapping.inputPricePer1k),
            outputTokenCost: Number(mapping.outputPricePer1k)
        }))
    }

    static async getCompanies() {
        const companies = await prisma.company.findMany();
        return companies.map(c => ({
            id: c.id.toString(),
            name: c.name,
            website: c.website
        }))
    }

    static async createCompany(data: { name: string, website: string }) {
        return await prisma.company.create({
            data
        })
    }

    static async createModel(data: { name: string, slug: string, companyId: string }) {
        return await prisma.model.create({
            data: {
                name: data.name,
                slug: data.slug,
                companyId: Number(data.companyId)
            }
        })
    }

    static async deleteModel(id: number) {
        return await prisma.model.delete({
            where: { id }
        })
    }

    static async createProvider(data: { name: string, website: string }) {
        return await prisma.provider.create({
            data
        })
    }

    static async deleteProvider(id: number) {
        return await prisma.provider.delete({
            where: { id }
        })
    }

    static async createModelProviderMapping(data: { modelId: string, providerId: string, inputTokenCost: number, outputTokenCost: number }) {
        return await prisma.modelProviderMapping.create({
            data: {
                modelId: Number(data.modelId),
                providerId: Number(data.providerId),
                inputPricePer1k: data.inputTokenCost,
                outputPricePer1k: data.outputTokenCost
            }
        })
    }
}
