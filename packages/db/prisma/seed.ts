import { prisma } from "../index.ts";
import * as crypto from "crypto";

async function main() {
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
      balance: 5000.00,
      role: "ADMIN",
    },
  });

  const devUser = await prisma.user.create({
    data: {
      email: "dev@promptrouter.com",
      password: devPasswordHash,
      balance: 100.00,
      role: "USER",
    },
  });

  console.log(`✅ Users created:\n   - Admin: ${adminUser.email} (pass: admin123)\n   - Dev: ${devUser.email} (pass: dev123)`);

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

  // 5. Seed Models
  console.log("🤖 Seeding model catalog...");
  const gpt4o = await prisma.model.create({
    data: {
      name: "GPT-4o",
      slug: "openai/gpt-4o",
      companyId: openaiCompany.id,
    },
  });

  const gemini3Flash = await prisma.model.create({
    data: {
      name: "Gemini 3 Flash",
      slug: "google/gemini-3-flash",
      companyId: googleCompany.id,
    },
  });

  const claudeSonnet = await prisma.model.create({
    data: {
      name: "Claude 3.5 Sonnet",
      slug: "anthropic/claude-3-5-sonnet",
      companyId: anthropicCompany.id,
    },
  });

  // 6. Seed Mappings
  console.log("🔗 Seeding model-provider mappings & prices...");
  
  // GPT-4o mapping
  await prisma.modelProviderMapping.create({
    data: {
      modelId: gpt4o.id,
      providerId: openaiProvider.id,
      inputPricePer1k: 0.005,
      outputPricePer1k: 0.015,
      markupMultiplier: 1.2,
      enabled: true,
    },
  });

  // Gemini 3 Flash mapping
  await prisma.modelProviderMapping.create({
    data: {
      modelId: gemini3Flash.id,
      providerId: googleProvider.id,
      inputPricePer1k: 0.000375, // Usually highly competitive for Flash models
      outputPricePer1k: 0.00115,
      markupMultiplier: 1.2,
      enabled: true,
    },
  });

  // Claude 3.5 Sonnet mapping
  await prisma.modelProviderMapping.create({
    data: {
      modelId: claudeSonnet.id,
      providerId: anthropicProvider.id,
      inputPricePer1k: 0.003,
      outputPricePer1k: 0.015,
      markupMultiplier: 1.2,
      enabled: true,
    },
  });

  // 7. Seed default API key for the regular dev user
  console.log("🔐 Creating default active API Key...");
  const rawKey = "pr-developmentkey1234567890";
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

  await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: "Development Default Key",
      apiKey: hashedKey,
      rpmLimit: 120,
      tpmLimit: 80000,
    },
  });

  console.log(`🚀 Default API Key created!\n   - Key: ${rawKey}\n   - Hashed representation successfully stored.`);

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
