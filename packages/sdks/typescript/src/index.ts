export type Message = {
    role: "user" | "assistant" | "system";
    content: string;
};

export type CreateChatCompletionOptions = {
    model: string;
    messages: Message[];
    stream?: boolean;
    sessionId?: string;
    [key: string]: any;
};

export class PromptRouter {
    private apiKey: string;
    private baseUrl: string;

    constructor(options: { apiKey: string; baseUrl?: string }) {
        this.apiKey = options.apiKey;
        this.baseUrl = (options.baseUrl || "http://localhost:4000/api/v1").replace(/\/$/, "");
    }

    get chat() {
        return {
            completions: {
                create: this.createChatCompletion.bind(this),
            },
        };
    }

    private async createChatCompletion(options: CreateChatCompletionOptions): Promise<any | AsyncIterableIterator<any>> {
        const { stream, ...rest } = options;
        const url = `${this.baseUrl}/chat/completions${stream ? "/stream" : ""}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(rest),
        });

        if (!response.ok) {
            throw new Error(`PromptRouter API Error: ${response.status} ${await response.text()}`);
        }

        if (stream) {
            return this.streamResponse(response);
        }

        return response.json();
    }

    private async *streamResponse(response: Response): AsyncIterableIterator<any> {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("Response body is not readable");

        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.slice(6).trim();
                    if (data === "[DONE]") return;
                    try {
                        yield JSON.parse(data);
                    } catch (e) {
                        continue;
                    }
                }
            }
        }
    }
}
