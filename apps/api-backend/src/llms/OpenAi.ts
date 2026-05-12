import { Messages } from "../types";
import { BaseLlm, LlmResponse, LlmStreamChunk } from "./Base";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class OpenAi extends BaseLlm {
    static async chat(model: string, messages: Messages): Promise<LlmResponse> {
        const response = await client.chat.completions.create({
            model: model,
            messages: messages.map(message => ({
                role: message.role as any,
                content: message.content
            }))
        });

        return {
            inputTokensConsumed: response.usage?.prompt_tokens!,
            outputTokensConsumed: response.usage?.completion_tokens!,
            completions: {
                choices: response.choices.map(c => ({
                    message: {
                        content: c.message.content || ""
                    }
                }))
            }
        }
    }

    static async *stream(model: string, messages: Messages): AsyncGenerator<LlmStreamChunk, void, unknown> {
        const stream = await client.chat.completions.create({
            model: model,
            messages: messages.map(message => ({
                role: message.role as any,
                content: message.content
            })),
            stream: true,
            stream_options: { include_usage: true } // Required for final usage stats
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            const usage = chunk.usage;

            if (content) {
                yield { content };
            }

            if (usage) {
                yield {
                    content: "",
                    isFinal: true,
                    usage: {
                        inputTokens: usage.prompt_tokens,
                        outputTokens: usage.completion_tokens
                    }
                };
            }
        }
    }
}