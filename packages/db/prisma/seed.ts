import { prisma } from "../index.ts";
import * as crypto from "crypto";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DB_SEED !== "true") {
    throw new Error(
      "Refusing to seed in production. Set ALLOW_DB_SEED=true to override (destructive).",
    );
  }

  console.log("🌱 Starting Database Seeding...");

  // 1. Clean existing records in correct relation order to prevent foreign key errors
  console.log("🧼 Cleaning existing records...");
  await prisma.conversation.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.onrampTransaction.deleteMany();
  await prisma.modelProviderMapping.deleteMany();
  await prisma.model.deleteMany();
  await prisma.company.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  console.log("👤 Creating seed users...");

  const adminPasswordHash = await Bun.password.hash("admin123");
  const devPasswordHash = await Bun.password.hash("dev123");

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@promptrouter.com",
      password: adminPasswordHash,
      balance: 5000.0,
      role: "ADMIN",
    },
  });

  const devUser = await prisma.user.create({
    data: {
      email: "dev@promptrouter.com",
      password: devPasswordHash,
      balance: 100.0,
      role: "USER",
    },
  });

  console.log(
    `✅ Users created:\n   - Admin: ${adminUser.email} (pass: admin123)\n   - Dev: ${devUser.email} (pass: dev123)`,
  );

  // 3. Seed Companies
  console.log("🏢 Seeding parent companies...");
  const openaiCompany = await prisma.company.create({
    data: { name: "OpenAI", website: "https://openai.com" },
  });
  const googleCompany = await prisma.company.create({
    data: { name: "Google", website: "https://google.com" },
  });
  const anthropicCompany = await prisma.company.create({
    data: { name: "Anthropic", website: "https://anthropic.com" },
  });

  // 4. Seed Providers
  console.log("📡 Seeding AI providers...");
  const openaiProvider = await prisma.provider.create({
    data: { name: "OpenAI", website: "https://openai.com" },
  });
  const googleProvider = await prisma.provider.create({
    data: { name: "Google API", website: "https://ai.google.dev" },
  });
  const anthropicProvider = await prisma.provider.create({
    data: { name: "Claude API", website: "https://anthropic.com" },
  });

  // 5. Seed Models — Gemini: free-tier only (Pro has no free API tier).
  // See https://ai.google.dev/gemini-api/docs/pricing
  console.log("🤖 Seeding model catalog...");

  const catalog = [
    {
      name: "GPT-4o",
      slug: "openai/gpt-4o",
      companyId: openaiCompany.id,
      providerId: openaiProvider.id,
      inputPricePer1k: 0.0025,
      outputPricePer1k: 0.01,
    },
    {
      name: "GPT-4o mini",
      slug: "openai/gpt-4o-mini",
      companyId: openaiCompany.id,
      providerId: openaiProvider.id,
      inputPricePer1k: 0.00015,
      outputPricePer1k: 0.0006,
    },
    {
      name: "GPT-4.1",
      slug: "openai/gpt-4.1",
      companyId: openaiCompany.id,
      providerId: openaiProvider.id,
      inputPricePer1k: 0.002,
      outputPricePer1k: 0.008,
    },
    {
      name: "Gemini 3.8 Flash",
      slug: "google/gemini-3.8-flash",
      companyId: googleCompany.id,
      providerId: googleProvider.id,
      inputPricePer1k: 0.0005,
      outputPricePer1k: 0.003,
    },
    {
      name: "Gemini 3.5 Flash-Lite",
      slug: "google/gemini-3.5-flash-lite",
      companyId: googleCompany.id,
      providerId: googleProvider.id,
      inputPricePer1k: 0.0001,
      outputPricePer1k: 0.0004,
    },
    {
      name: "Claude Sonnet 4.5",
      slug: "anthropic/claude-sonnet-4-5",
      companyId: anthropicCompany.id,
      providerId: anthropicProvider.id,
      inputPricePer1k: 0.003,
      outputPricePer1k: 0.015,
    },
    {
      name: "Claude Haiku 4.5",
      slug: "anthropic/claude-haiku-4-5",
      companyId: anthropicCompany.id,
      providerId: anthropicProvider.id,
      inputPricePer1k: 0.001,
      outputPricePer1k: 0.005,
    },
  ] as const;

  for (const entry of catalog) {
    const model = await prisma.model.create({
      data: {
        name: entry.name,
        slug: entry.slug,
        companyId: entry.companyId,
      },
    });

    await prisma.modelProviderMapping.create({
      data: {
        modelId: model.id,
        providerId: entry.providerId,
        inputPricePer1k: entry.inputPricePer1k,
        outputPricePer1k: entry.outputPricePer1k,
        markupMultiplier: 1.2,
        enabled: true,
      },
    });
  }

  console.log(`✅ Seeded ${catalog.length} models with provider mappings.`);

  // 6. Seed default API key for the regular dev user
  console.log("🔐 Creating default active API Key...");
  const rawKey = "pr-developmentkey1234567890";
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

  await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: "Development Default Key",
      apiKey: hashedKey,
      keyPrefix: rawKey.slice(0, 12),
      rpmLimit: 120,
      tpmLimit: 80000,
    },
  });

  console.log(
    `🚀 Default API Key created!\n   - Key: ${rawKey}\n   - Hashed representation successfully stored.`,
  );

  console.log("✨ Seeding completed successfully! Network is ready to deploy.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
