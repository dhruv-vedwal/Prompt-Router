import { prisma } from "db";
import { Elysia } from "elysia";
import { bearer } from '@elysiajs/bearer';
import { cors } from '@elysiajs/cors';
import { Conversation } from "./types";
import { Gemini } from "./llms/Gemini";
import { OpenAi } from "./llms/OpenAi";
import { Claude } from "./llms/Claude";
import { LlmResponse } from "./llms/Base";
import logger from "./lib/logger";

const app = new Elysia()
.use(cors({
  origin: true // Allow all origins for the public API
}))
.use(bearer())
.post("/api/v1/chat/completions", async ({ status, bearer: apiKey, body }) => {
  const model = body.model;
  const [_companyName, providerModelName] = model.split("/");
  
  logger.info(`Incoming request for model: ${model}`);

  const apiKeyDb = await prisma.apiKey.findFirst({
    where: {
      apiKey,
      disabled: false,
      deleted: false
    },
    select: {
      user: true,
      id: true
    }
  })

  if (!apiKeyDb) {
    logger.warn(`Invalid API key attempt: ${apiKey}`);
    return status(403, {
      message: "Invalid api key"
    })
  }

  if (apiKeyDb?.user.credits <= 0) {
    logger.warn(`User ${apiKeyDb.user.id} out of credits`);
    return status(403, {
      message: "You dont have enough credits in your db"
    })
  }

  const modelDb = await prisma.model.findFirst({
    where: {
      slug: model
    }
  })

  if (!modelDb) {
    return status(403, {
      message: "This is an invalid model we dont support"
    })
  }

  const providers = await prisma.modelProviderMapping.findMany({
    where: {
      modelId: modelDb.id
    },
    include: {
      provider: true
    }
  })

  if (providers.length === 0) {
    return status(403, {
      message: "No provider found for this model"
    })
  }

  const provider = providers[Math.floor(Math.random() * providers.length)];

  let response: LlmResponse | null = null
  if (provider.provider.name === "Google API") {
    response = await Gemini.chat(providerModelName, body.messages)
  }

  if (provider.provider.name === "Google Vertex") {
    response = await Gemini.chat(providerModelName, body.messages)
  }
  
  if (provider.provider.name === "OpenAI") {
    response = await OpenAi.chat(providerModelName, body.messages)
  }
  
  if (provider.provider.name === "Claude API") {
    response = await Claude.chat(providerModelName, body.messages)
  }

  if (!response) {
    return status(403, {
      message: "Provider failed to respond"
    }) 
  }

  const creditsUsed = (response.inputTokensConsumed * provider.inputTokenCost + response.outputTokensConsumed * provider.outputTokenCost) / 10;
  
  logger.info(`Request processed. Credits used: ${creditsUsed}`);

  await prisma.user.update({
    where: {
      id: apiKeyDb.user.id
    },
    data: {
      credits: {
        decrement: creditsUsed
      }
    }
  });

  await prisma.apiKey.update({
    where: {
      id: apiKeyDb.id
    }, 
    data: {
      creditsConsumed: {
        increment: creditsUsed
      }
    }
  })

  return response;
}, {
  body: Conversation
}).listen(4000, () => {
  logger.info(`🚀 API Backend is running on http://localhost:4000`);
});

export type App = typeof app;
