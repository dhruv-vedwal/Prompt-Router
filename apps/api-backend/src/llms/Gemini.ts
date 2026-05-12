import { Messages } from "../types";
import { BaseLlm, LlmResponse, LlmStreamChunk } from "./Base";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

export class Gemini extends BaseLlm {
    static async chat(model: string, messages: Messages): Promise<LlmResponse> {
        const response = await ai.models.generateContent({
            model: model,
            contents: messages.map(message => ({
                parts: [{ text: message.content }],
                role: message.role === "user" ? "user" : "model"
            }))
        });

        return {
            outputTokensConsumed: response.usageMetadata?.candidatesTokenCount!,
            inputTokensConsumed: response.usageMetadata?.promptTokenCount!,
            completions: {
                choices: [{
                    message: {
                        content: response.candidates?.[0]?.content?.parts?.[0]?.text || ""
                    }
                }]
            }
        }
    }

    static async *stream(model: string, messages: Messages): AsyncGenerator<LlmStreamChunk, void, unknown> {
        const result = await ai.models.generateContentStream({
            model: model,
            contents: messages.map(message => ({
                parts: [{ text: message.content }],
                role: message.role === "user" ? "user" : "model"
            }))
        });

        for await (const chunk of result) {
            const content = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (content) {
                yield { content };
            }

            if (chunk.usageMetadata) {
                yield {
                    content: "",
                    isFinal: true,
                    usage: {
                        inputTokens: chunk.usageMetadata.promptTokenCount!,
                        outputTokens: chunk.usageMetadata.candidatesTokenCount! 
                    }
                };
            }
        }
    }
}