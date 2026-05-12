import { Messages } from "../types";

export type LlmResponse = {
    completions: {
        choices: {
            message: {
                content: string
            }   
        }[]
    },
    inputTokensConsumed: number,
    outputTokensConsumed: number
}

export type LlmStreamChunk = {
    content: string;
    isFinal?: boolean;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    }
}

export class BaseLlm {
    static async chat(model: string, messages: Messages): Promise<LlmResponse> {
        throw new Error("Not implemented chat function")
    }

    static async *stream(model: string, messages: Messages): AsyncGenerator<LlmStreamChunk, void, unknown> {
        throw new Error("Not implemented stream function")
    }
}