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

        let inputTokens = 0;
        let outputTokens = 0;

        for await (const event of stream) {
            if (event.type === "message_start" && event.message?.usage) {
                inputTokens = event.message.usage.input_tokens ?? inputTokens;
            }

            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                yield { content: event.delta.text };
            }

            if (event.type === "message_delta") {
                if (event.usage) {
                    outputTokens = event.usage.output_tokens ?? outputTokens;
                }
            }

            if (event.type === "message_stop") {
                yield {
                    content: "",
                    isFinal: true,
                    usage: {
                        inputTokens,
                        outputTokens,
                    },
                };
            }
        }
    }
}
