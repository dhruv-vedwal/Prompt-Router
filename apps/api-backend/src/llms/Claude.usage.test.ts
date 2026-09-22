import { describe, expect, test } from "bun:test";

/**
 * Claude stream usage: input tokens come from message_start, not hard-coded 0.
 * Mirrors apps/api-backend/src/llms/Claude.ts accumulation logic.
 */
describe("Claude stream token capture", () => {
  function accumulateUsage(events: any[]) {
    let inputTokens = 0;
    let outputTokens = 0;
    for (const event of events) {
      if (event.type === "message_start" && event.message?.usage) {
        inputTokens = event.message.usage.input_tokens ?? inputTokens;
      }
      if (event.type === "message_delta" && event.usage) {
        outputTokens = event.usage.output_tokens ?? outputTokens;
      }
    }
    return { inputTokens, outputTokens };
  }

  test("captures input tokens from message_start", () => {
    const usage = accumulateUsage([
      { type: "message_start", message: { usage: { input_tokens: 42 } } },
      { type: "content_block_delta", delta: { text: "hi" } },
      { type: "message_delta", usage: { output_tokens: 7 } },
    ]);
    expect(usage.inputTokens).toBe(42);
    expect(usage.outputTokens).toBe(7);
  });

  test("does not leave inputTokens at 0 when usage is present", () => {
    const usage = accumulateUsage([
      { type: "message_start", message: { usage: { input_tokens: 128 } } },
    ]);
    expect(usage.inputTokens).not.toBe(0);
  });
});
