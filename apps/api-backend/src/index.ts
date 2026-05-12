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
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
.use(swagger({
  path: '/swagger',
  documentation: {
    info: {
      title: 'PromptRouter API',
      version: '1.0.0',
      description: 'Unified AI Model Gateway API'
    }
  }
}))
.use(cors({
  origin: true 
}))
.use(bearer())
.post("/api/v1/chat/completions", async ({ status, bearer: apiKey, body }) => {
  const startTime = performance.now();
  const model = body.model;
  const [_companyName, providerModelName] = model.split("/");
  
  const apiKeyDb = await prisma.apiKey.findFirst({
    where: { apiKey, disabled: false, deleted: false },
    select: { user: true, id: true }
  });

  if (!apiKeyDb) return status(403, { message: "Invalid api key" });

  const modelDb = await prisma.model.findFirst({ where: { slug: model } });
  if (!modelDb) return status(403, { message: "Invalid model" });

  const provider = await RoutingService.selectProvider(modelDb.id);
  if (!provider) return status(403, { message: "No provider found" });

  // 1. Reserve Credits
  const inputText = body.messages.map((m: any) => m.content).join(" ");
  const estimatedInputTokens = BillingService.estimateTokens(inputText);
  
  let reservation: any;
  try {
    reservation = await BillingService.reserve(apiKeyDb.user.id, estimatedInputTokens, provider);
  } catch (e: any) {
    return status(402, { message: e.message || "Insufficient balance" });
  }

  // 2. Create Conversation (Pending)
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
    let response: LlmResponse;
    if (provider.provider.name === "Google API" || provider.provider.name === "Google Vertex") {
      response = await Gemini.chat(providerModelName, body.messages);
    } else if (provider.provider.name === "OpenAI") {
      response = await OpenAi.chat(providerModelName, body.messages);
    } else if (provider.provider.name === "Claude API") {
      response = await Claude.chat(providerModelName, body.messages);
    } else {
      throw new Error("Provider not implemented");
    }

    // 3. Settle Credits
    await BillingService.settle(
      apiKeyDb.user.id,
      reservation.id,
      response.inputTokensConsumed,
      response.outputTokensConsumed,
      provider,
      conversation.id
    );

    // 4. Update API Key usage
    const actualCharge = BillingService.calculateCharge(
      response.inputTokensConsumed,
      response.outputTokensConsumed,
      provider.inputPricePer1k,
      provider.outputPricePer1k,
      provider.markupMultiplier
    );

    await prisma.apiKey.update({
      where: { id: apiKeyDb.id },
      data: { creditsConsumed: { increment: actualCharge } }
    });

    // 5. Update conversation with output and duration
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { 
        output: JSON.stringify(response),
        durationMs: Math.round(performance.now() - startTime)
      }
    });

    // 6. Record to ChatMessage if it's a playground session
    if (body.sessionId) {
      const lastUserMessage = body.messages[body.messages.length - 1];
      await prisma.chatMessage.create({
        data: {
          sessionId: body.sessionId,
          role: "user",
          content: lastUserMessage.content
        }
      });
      await prisma.chatMessage.create({
        data: {
          sessionId: body.sessionId,
          role: "assistant",
          content: response.completions.choices[0].message.content
        }
      });
    }

    return response;

  } catch (error: any) {
    logger.error(`Request failed: ${error.message}`);
    await BillingService.refund(apiKeyDb.user.id, reservation.id);
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "FAILED" }
    });
    return status(500, { message: error.message || "Request failed" });
  }
}, {
  body: Conversation
})
.post("/api/v1/chat/completions/stream", async ({ status, bearer: apiKey, body, set }) => {
  const startTime = performance.now();
  const model = body.model;
  const [_companyName, providerModelName] = model.split("/");
  
  const apiKeyDb = await prisma.apiKey.findFirst({
    where: { apiKey, disabled: false, deleted: false },
    select: { user: true, id: true }
  });

  if (!apiKeyDb) return status(403, { message: "Invalid api key" });

  const modelDb = await prisma.model.findFirst({ where: { slug: model } });
  if (!modelDb) return status(403, { message: "Invalid model" });

  const provider = await RoutingService.selectProvider(modelDb.id);
  if (!provider) return status(403, { message: "No provider found" });

  const inputText = body.messages.map((m: any) => m.content).join(" ");
  const estimatedInputTokens = BillingService.estimateTokens(inputText);
  
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

  return new ReadableStream({
    async start(controller) {
      let fullContent = "";
      let actualUsage = { inputTokens: estimatedInputTokens, outputTokens: 0 };
      let settled = false;
      const encoder = new TextEncoder();

      const settle = async (finalInput?: number, finalOutput?: number) => {
        if (settled) return;
        settled = true;
        
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

          // Record to ChatMessage if it's a playground session
          if (body.sessionId) {
            const lastUserMessage = body.messages[body.messages.length - 1];
            await prisma.chatMessage.create({
              data: {
                sessionId: body.sessionId,
                role: "user",
                content: lastUserMessage.content
              }
            });
            await prisma.chatMessage.create({
              data: {
                sessionId: body.sessionId,
                role: "assistant",
                content: fullContent
              }
            });
          }
        } catch (e) {
          logger.error(`Settlement failed: ${e}`);
        }
      };

      try {
        let stream;
        if (provider.provider.name === "Google API" || provider.provider.name === "Google Vertex") {
          stream = Gemini.stream(providerModelName, body.messages);
        } else if (provider.provider.name === "OpenAI") {
          stream = OpenAi.stream(providerModelName, body.messages);
        } else if (provider.provider.name === "Claude API") {
          stream = Claude.stream(providerModelName, body.messages);
        }

        if (!stream) throw new Error("Provider not supported for streaming");

        for await (const chunk of stream) {
          if (chunk.content) {
            fullContent += chunk.content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`));
          }
          if (chunk.isFinal && chunk.usage) {
            actualUsage = chunk.usage;
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        await settle(actualUsage.inputTokens, actualUsage.outputTokens);
        controller.close();

      } catch (error: any) {
        logger.error(`Stream error: ${error.message}`);
        if (!settled) {
          await BillingService.refund(apiKeyDb.user.id, reservation.id);
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: "FAILED" }
          });
        }
        controller.error(error);
      }
    },
    async cancel() {
      // If the client cancels, we should try to settle what was already generated
      // This is a bit tricky with Elysia's ReadableStream but better than nothing.
    }
  });
}, {
  body: Conversation
}).listen(4000, () => {
  logger.info(`🚀 API Backend is running on http://localhost:4000`);
  setInterval(() => {
    BillingService.cleanupStaleReservations().catch(err => logger.error(`Cleanup job failed: ${err}`));
  }, 5 * 60 * 1000);
});

export type App = typeof app;
