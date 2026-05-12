import Anthropic from "@anthropic-ai/sdk";
import { Messages } from "../types";
import { BaseLlm, LlmResponse, LlmStreamChunk } from "./Base";
import { TextBlock } from "@anthropic-ai/sdk/resources";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export class Claude extends BaseLlm {
    static async chat(model: string, messages: Messages): Promise<LlmResponse> {
        const response = await client.messages.create({
            max_tokens: 2048,
            messages: messages.map(message => ({
                role: message.role as any,
                content: message.content
            })),
            model: model
        });

        return {
            outputTokensConsumed: response.usage.output_tokens,
            inputTokensConsumed: response.usage.input_tokens,
            completions: {
                choices: response.content.map(content => ({
                    message: {
                        content: (content as TextBlock).text
                    }
                }))
            }
        }
    }

    static async *stream(model: string, messages: Messages): AsyncGenerator<LlmStreamChunk, void, unknown> {
        const stream = await client.messages.create({
            max_tokens: 2048,
            messages: messages.map(message => ({
                role: message.role as any,
                content: message.content
            })),
            model: model,
            stream: true
        });

        for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                yield { content: event.delta.text };
            }

            if (event.type === "message_delta") {
                // Final usage is often here
                if (event.usage) {
                    yield {
                        content: "",
                        isFinal: true,
                        usage: {
                            inputTokens: 0, // Anthropic usage delta only shows output_tokens usually
                            outputTokens: event.usage.output_tokens
                        }
                    };
                }
            }

            if (event.type === "message_stop") {
                // Stream finished
            }
        }
    }
}