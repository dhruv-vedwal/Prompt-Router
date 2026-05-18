import { prisma } from "db";

export class ModelsService {
    static async getModels() {
        return await prisma.model.findMany({
            include: {
                company: true,
                modelProviderMappings: {
                    include: {
                        provider: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
    }

    static async getProviders() {
        return await prisma.provider.findMany();
    }

    static async getCompanies() {
        return await prisma.company.findMany();
    }

    static async createCompany(data: { name: string, website: string }) {
        return await prisma.company.create({ data });
    }

    static async createModel(data: { name: string, slug: string, companyId: string }) {
        return await prisma.model.create({
            data: {
                name: data.name,
                slug: data.slug,
                companyId: Number(data.companyId)
            }
        });
    }

    static async deleteModel(id: number) {
        return await prisma.model.delete({
            where: { id }
        });
    }

    static async createProvider(data: { name: string, website: string, baseUrl: string }) {
        return await prisma.provider.create({ data });
    }

    static async deleteProvider(id: number) {
        return await prisma.provider.delete({
            where: { id }
        });
    }

    static async createModelProviderMapping(data: { 
        modelId: number, 
        providerId: number, 
        inputPricePer1k: number, 
        outputPricePer1k: number, 
        markupMultiplier: number 
    }) {
        return await prisma.modelProviderMapping.create({ data });
    }

    static async getModelProviders(modelId: number) {
        return await prisma.modelProviderMapping.findMany({
            where: { modelId },
            include: { provider: true }
        });
    }
}
