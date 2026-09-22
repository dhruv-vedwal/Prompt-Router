import { prisma, Decimal } from "db";
import { Elysia } from "elysia";
import { bearer } from '@elysiajs/bearer';
import { cors } from '@elysiajs/cors';
import { Conversation } from "./types";
import { Gemini } from "./llms/Gemini";
import { OpenAi } from "./llms/OpenAi";
import { Claude } from "./llms/Claude";
import { LlmResponse } from "./llms/Base";
import logger from "./lib/logger";
import { BillingService } from "./lib/BillingService";
import { RoutingService } from "./lib/RoutingService";
import { RateLimiter } from "./lib/RateLimiter";
import { swagger } from '@elysiajs/swagger';
import { corsOrigins, listenPort } from "./lib/env";
import { resolveApiKey, resolveInternalUser, type ResolvedApiKey } from "./lib/resolveApiKey";

function providerChat(providerName: string, modelName: string, messages: any) {
  if (providerName === "Google API") {
    return Gemini.chat(modelName, messages);
  }
  if (providerName === "OpenAI") {
    return OpenAi.chat(modelName, messages);
  }
  if (providerName === "Claude API") {
    return Claude.chat(modelName, messages);
  }
  throw new Error("Provider not implemented");
}

function providerStream(providerName: string, modelName: string, messages: any) {
  if (providerName === "Google API") {
    return Gemini.stream(modelName, messages);
  }
  if (providerName === "OpenAI") {
    return OpenAi.stream(modelName, messages);
  }
  if (providerName === "Claude API") {
    return Claude.stream(modelName, messages);
  }
  return null;
}

async function authenticateRequest(
  bearerToken: string | undefined,
  headers: Headers,
): Promise<ResolvedApiKey | null> {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  const internalUserHeader = headers.get("x-internal-user-id");
  const providedSecret = headers.get("x-internal-secret");

  if (
    internalSecret &&
    providedSecret &&
    providedSecret === internalSecret &&
    internalUserHeader
  ) {
    const userId = Number(internalUserHeader);
    if (Number.isFinite(userId)) {
      return resolveInternalUser(userId);
    }
  }

  if (!bearerToken) return null;
  return resolveApiKey(bearerToken);
}

let appBuilder = new Elysia();

if (process.env.NODE_ENV !== "production") {
  appBuilder = appBuilder.use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'PromptRouter API',
        version: '1.0.0',
        description: 'Unified AI Model Gateway API'
      }
    }
  }));
}

const app = appBuilder
.use(cors({
  origin: corsOrigins(),
  credentials: true,
}))
.use(bearer())
.post("/api/v1/chat/completions", async ({ status, bearer: apiKey, body, request }) => {
  const startTime = performance.now();
  const model = body.model;

  const apiKeyDb = await authenticateRequest(apiKey, request.headers);
  if (!apiKeyDb) return status(403, { message: "Invalid api key" });

  const inputText = body.messages.map((m: any) => m.content).join(" ");
  const estimatedInputTokens = BillingService.estimateTokens(inputText);

  const rateLimit = RateLimiter.check(
    apiKeyDb.id,
    apiKeyDb.rpmLimit,
    apiKeyDb.tpmLimit,
    estimatedInputTokens
  );

  if (!rateLimit.allowed) {
    return status(429, { message: rateLimit.reason || "Rate limit exceeded" });
  }

  const modelDb = await prisma.model.findFirst({ where: { slug: model } });
  if (!modelDb) return status(403, { message: "Invalid model" });

  const provider = await RoutingService.selectProvider(modelDb.id);
  if (!provider) return status(403, { message: "No provider found" });

  let reservation: any;
  let billingDone = false;
  try {
    reservation = await BillingService.reserve(apiKeyDb.user.id, estimatedInputTokens, provider);
  } catch (e: any) {
    return status(402, { message: e.message || "Insufficient balance" });
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: apiKeyDb.user.id,
      apiKeyId: apiKeyDb.id,
      modelProviderMappingId: provider.id,
      input: JSON.stringify(body.messages),
      output: "",
      sessionId: body.sessionId,
      inputTokenCount: estimatedInputTokens,
      outputTokenCount: 0,
      status: "PENDING"
    }
  });

  try {
    const [_companyName, providerModelName] = model.split("/");
    const response: LlmResponse = await providerChat(
      provider.provider.name,
      providerModelName!,
      body.messages,
    );

    const inputTokens = response.inputTokensConsumed ?? estimatedInputTokens;
    const outputTokens = response.outputTokensConsumed ?? 0;

    await BillingService.settle(
      apiKeyDb.user.id,
      reservation.id,
      inputTokens,
      outputTokens,
      provider,
      conversation.id
    );
    billingDone = true;

    const actualCharge = BillingService.calculateCharge(
      inputTokens,
      outputTokens,
      provider.inputPricePer1k,
      provider.outputPricePer1k,
      provider.markupMultiplier
    );

    await prisma.apiKey.update({
      where: { id: apiKeyDb.id },
      data: { creditsConsumed: { increment: actualCharge } }
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        output: JSON.stringify(response),
        durationMs: Math.round(performance.now() - startTime)
      }
    });

    return response;

  } catch (error: any) {
    logger.error(`Request failed: ${error.message}`);
    if (!billingDone) {
      await BillingService.refund(apiKeyDb.user.id, reservation.id);
    }
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "FAILED" }
    });
    return status(500, { message: error.message || "Request failed" });
  }
}, {
  body: Conversation
})
.post("/api/v1/chat/completions/stream", async ({ status, bearer: apiKey, body, set, request }) => {
  const startTime = performance.now();
  const model = body.model;

  const apiKeyDb = await authenticateRequest(apiKey, request.headers);
  if (!apiKeyDb) return status(403, { message: "Invalid api key" });

  const inputText = body.messages.map((m: any) => m.content).join(" ");
  const estimatedInputTokens = BillingService.estimateTokens(inputText);

  const rateLimit = RateLimiter.check(
    apiKeyDb.id,
    apiKeyDb.rpmLimit,
    apiKeyDb.tpmLimit,
    estimatedInputTokens
  );

  if (!rateLimit.allowed) {
    return status(429, { message: rateLimit.reason || "Rate limit exceeded" });
  }

  const modelDb = await prisma.model.findFirst({ where: { slug: model } });
  if (!modelDb) return status(403, { message: "Invalid model" });

  const provider = await RoutingService.selectProvider(modelDb.id);
  if (!provider) return status(403, { message: "No provider found" });

  let reservation: any;
  try {
    reservation = await BillingService.reserve(apiKeyDb.user.id, estimatedInputTokens, provider);
  } catch (e: any) {
    return status(402, { message: e.message || "Insufficient balance" });
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: apiKeyDb.user.id,
      apiKeyId: apiKeyDb.id,
      modelProviderMappingId: provider.id,
      input: JSON.stringify(body.messages),
      output: "",
      sessionId: body.sessionId,
      inputTokenCount: estimatedInputTokens,
      outputTokenCount: 0,
      status: "STREAMING"
    }
  });

  set.headers["Content-Type"] = "text/event-stream";
  set.headers["Cache-Control"] = "no-cache";
  set.headers["Connection"] = "keep-alive";

  let billingDone = false;

  return new ReadableStream({
    async start(controller) {
      let fullContent = "";
      let actualUsage = { inputTokens: estimatedInputTokens, outputTokens: 0 };
      const encoder = new TextEncoder();

      const settle = async (finalInput?: number, finalOutput?: number) => {
        if (billingDone) return;

        const inputTokens = finalInput ?? estimatedInputTokens;
        const outputTokens = finalOutput ?? BillingService.estimateTokens(fullContent);

        try {
          await BillingService.settle(
            apiKeyDb.user.id,
            reservation.id,
            inputTokens,
            outputTokens,
            provider,
            conversation.id
          );
          billingDone = true;

          const actualCharge = BillingService.calculateCharge(
            inputTokens,
            outputTokens,
            provider.inputPricePer1k,
            provider.outputPricePer1k,
            provider.markupMultiplier
          );

          await prisma.apiKey.update({
            where: { id: apiKeyDb.id },
            data: { creditsConsumed: { increment: actualCharge } }
          });

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              output: fullContent,
              status: "COMPLETED",
              durationMs: Math.round(performance.now() - startTime)
            }
          });
        } catch (e) {
          logger.error(`Settlement failed: ${e}`);
          await BillingService.refund(apiKeyDb.user.id, reservation.id);
          billingDone = true;
        }
      };

      try {
        const [_companyName, providerModelName] = model.split("/");
        const stream = providerStream(provider.provider.name, providerModelName!, body.messages);
        if (!stream) throw new Error("Provider not supported for streaming");

        for await (const chunk of stream) {
          if (chunk.content) {
            fullContent += chunk.content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`));
          }
          if (chunk.isFinal && chunk.usage) {
            actualUsage = {
              inputTokens: chunk.usage.inputTokens || estimatedInputTokens,
              outputTokens: chunk.usage.outputTokens || 0,
            };
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        await settle(actualUsage.inputTokens, actualUsage.outputTokens);
        controller.close();

      } catch (error: any) {
        logger.error(`Stream error: ${error.message}`);
        if (!billingDone) {
          await BillingService.refund(apiKeyDb.user.id, reservation.id);
          billingDone = true;
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: "FAILED" }
          });
        }
        controller.error(error);
      }
    },
    async cancel() {
      if (!billingDone) {
        try {
          await BillingService.refund(apiKeyDb.user.id, reservation.id);
          billingDone = true;
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: "FAILED" }
          });
        } catch (e) {
          logger.error(`Cancel refund failed: ${e}`);
        }
      }
    }
  });
}, {
  body: Conversation
});

const port = listenPort(4000);
app.listen(port, () => {
  logger.info(`🚀 API Backend is running on http://localhost:${port}`);
  setInterval(() => {
    BillingService.cleanupStaleReservations().catch(err => logger.error(`Cleanup job failed: ${err}`));
    RateLimiter.cleanup();
  }, 60 * 1000);
});

export type App = typeof app;
