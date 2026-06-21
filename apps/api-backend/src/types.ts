import { t } from "elysia";


export const Messages = t.Array(t.Object({
    role: t.Enum({
      user: "user",
      assistant: "assistant",
      system: "system"
    }),
    content: t.String()
}))

export type Messages = typeof Messages.static;

export const Conversation = t.Object({
    model: t.String(),
    messages: Messages,
    sessionId: t.Optional(t.String())
})

