import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Send,
    Bot,
    User,
    Trash2,
    Loader2,
    Sparkles,
    Settings2,
    MessageSquare,
    Plus,
    Pencil,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

export function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState("openai/gpt-4o");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState("");

    // Custom confirm dialog state
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    // Playground settings state
    const [showSettings, setShowSettings] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(2048);

    const scrollRef = useRef<HTMLDivElement>(null);
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();

    const modelsQuery = useQuery({
        queryKey: ["playground-models"],
        queryFn: async () => {
            const response = await elysiaClient.models.get();
            if (response.error) throw new Error("Failed to fetch models");
            return response.data;
        }
    });

    const historyQuery = useQuery({
        queryKey: ["chat-history"],
        queryFn: async () => {
            const response = await elysiaClient.playground.history.get();
            if (response.error) throw new Error("Failed to fetch history");
            return response.data;
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const startNewChat = async () => {
        setMessages([]);
        try {
            const response = await elysiaClient.playground.session.post({ title: "New Chat" });
            if (response.error) throw new Error("Failed to create session");
            setSessionId(response.data.id);
            queryClient.invalidateQueries({ queryKey: ["chat-history"] });
        } catch (e) {
            console.error(e);
        }
    };

    const loadSession = async (sid: string) => {
        setIsLoading(true);
        try {
            const response = await elysiaClient.playground.history({ sessionId: sid }).get();
            if (response.error) throw new Error("Failed to load session");
            setMessages((response.data.messages as Message[]) || []);
            setSessionId(sid);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSession = async (sid: string) => {
        try {
            await elysiaClient.playground.session({ sessionId: sid }).delete();
            if (sessionId === sid) {
                setSessionId(null);
                setMessages([]);
            }
            queryClient.invalidateQueries({ queryKey: ["chat-history"] });
        } catch (e) {
            console.error(e);
        }
    };

    const updateTitle = async (sid: string) => {
        if (!newTitle.trim()) return;
        try {
            await elysiaClient.playground.session({ sessionId: sid }).put({ title: newTitle });
            setEditingSessionId(null);
            setNewTitle("");
            queryClient.invalidateQueries({ queryKey: ["chat-history"] });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        let currentSessionId = sessionId;
        if (!currentSessionId) {
            try {
                const response = await elysiaClient.playground.session.post({ title: "New Chat" });
                if (response.error) throw new Error("Failed to create session");
                currentSessionId = response.data.id;
                setSessionId(currentSessionId);
            } catch (e) {
                console.error(e);
                return;
            }
        }

        const userMessage: Message = { role: "user", content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            const keysResponse = await elysiaClient["api-keys"].get();
            if (keysResponse.error || !keysResponse.data.apiKeys.length) {
                throw new Error("No API keys found. Please create one first.");
            }
            const apiKey = keysResponse.data.apiKeys[0]!.apiKey;

            // Prepend system prompt if configured
            const apiMessages = systemPrompt.trim()
                ? [{ role: "system" as const, content: systemPrompt }, ...newMessages]
                : newMessages;

            const response = await fetch("http://localhost:4000/api/v1/chat/completions/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: apiMessages,
                    sessionId: currentSessionId
                })
            });

            if (!response.ok) throw new Error("Stream request failed");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            if (!reader) throw new Error("No reader available");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.content || "";
                            assistantContent += content;

                            setMessages((prev) => {
                                const updated = [...prev];
                                const lastMessage = updated[updated.length - 1];
                                if (lastMessage && lastMessage.role === "assistant") {
                                    lastMessage.content = assistantContent;
                                }
                                return updated;
                            });
                        } catch (e) {
                            console.error("Error parsing SSE data", e);
                        }
                    }
                }
            }

            // Auto-rename if it's the first exchange
            if (newMessages.length === 1) {
                const firstUserMsg = newMessages[0]?.content ?? "";
                const shortTitle = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 27) + "..." : firstUserMsg;
                await elysiaClient.playground.session({ sessionId: currentSessionId! }).put({ title: shortTitle });
            }

            queryClient.invalidateQueries({ queryKey: ["chat-history"] });

        } catch (error: any) {
            console.error("Chat Error:", error);
            setMessages(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                if (lastMessage && lastMessage.role === "assistant") {
                    lastMessage.content = `Error: ${error.message}`;
                }
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout fullHeight>
            {/* Custom confirm deletion modal */}
            {sessionToDelete !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-sm rounded-[10px] overflow-hidden shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="p-6 space-y-4">
                            <h3 className="text-[14.5px] font-[600] m-0">Delete Session</h3>
                            <p className="text-[12.5px] m-0 leading-relaxed" style={{ color: "var(--foreground-2)" }}>
                                Are you sure you want to permanently delete this chat session? This action cannot be undone.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setSessionToDelete(null)}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        deleteSession(sessionToDelete);
                                        setSessionToDelete(null);
                                    }}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] text-white transition-colors"
                                    style={{ background: "var(--destructive)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#cf3c41")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--destructive)")}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-full w-full overflow-hidden" style={{ background: "var(--background)" }}>
                {/* Sessions Sidebar */}
                <aside
                    className={cn(
                        "flex flex-col transition-all duration-200 ease-in-out flex-none",
                        isSidebarOpen ? "w-[220px]" : "w-0"
                    )}
                    style={{ borderRight: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}
                >
                    {isSidebarOpen && (
                        <>
                            <div className="p-3 flex-none" style={{ borderBottom: "1px solid var(--border)" }}>
                                <button
                                    onClick={startNewChat}
                                    className="w-full flex items-center gap-2 h-8 px-3 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    <Plus className="size-3.5" />
                                    New session
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                <p className="text-[11px] font-[600] uppercase tracking-[0.05em] px-2 py-1 mb-1" style={{ color: "var(--foreground-3)" }}>
                                    Recent
                                </p>
                                <div className="space-y-[1px]">
                                    {historyQuery.isLoading && (
                                        <div className="py-4 flex justify-center" style={{ color: "var(--foreground-3)" }}>
                                            <Loader2 className="size-4 animate-spin" />
                                        </div>
                                    )}
                                    {historyQuery.data?.map((session: any) => (
                                        <div key={session.id} className="group relative">
                                            {editingSessionId === session.id ? (
                                                <div className="p-1">
                                                    <input
                                                        autoFocus
                                                        value={newTitle}
                                                        onChange={(e) => setNewTitle(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && updateTitle(session.id)}
                                                        onBlur={() => setEditingSessionId(null)}
                                                        className="w-full h-7 px-2 rounded-[5px] text-[12px] outline-none"
                                                        style={{ background: "var(--background)", border: "1px solid var(--accent-blue)", color: "var(--foreground)" }}
                                                    />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => loadSession(session.id)}
                                                    className="w-full text-left px-2 py-[6.5px] rounded-[7px] text-[12.5px] font-[500] transition-all flex items-center justify-between gap-1"
                                                    style={{
                                                        background: sessionId === session.id ? "rgba(255,255,255,0.07)" : "transparent",
                                                        color: sessionId === session.id ? "var(--foreground)" : "var(--foreground-2)",
                                                    }}
                                                    onMouseEnter={e => { if (sessionId !== session.id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.045)"; }}
                                                    onMouseLeave={e => { if (sessionId !== session.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                                >
                                                    <span className="truncate flex-1 pr-1">{session.title}</span>
                                                    <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-none">
                                                        <button
                                                            className="size-5 flex items-center justify-center rounded-[4px] transition-colors"
                                                            style={{ color: "var(--foreground-3)" }}
                                                            onClick={e => { e.stopPropagation(); setEditingSessionId(session.id); setNewTitle(session.title); }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                                        >
                                                            <Pencil className="size-3" />
                                                        </button>
                                                        <button
                                                            className="size-5 flex items-center justify-center rounded-[4px] transition-colors"
                                                            style={{ color: "var(--foreground-3)" }}
                                                            onClick={e => { e.stopPropagation(); setSessionToDelete(session.id); }}
                                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(229,72,77,0.1)"; (e.currentTarget as HTMLElement).style.color = "#e5484d"; }}
                                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--foreground-3)"; }}
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </button>
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </aside>

                {/* Sidebar toggle */}
                <div className="relative flex-none" style={{ width: 0 }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="absolute top-1/2 -translate-y-1/2 left-0 z-10 size-5 rounded-full flex items-center justify-center transition-colors shadow-md"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--foreground-3)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-3)")}
                    >
                        {isSidebarOpen ? <ChevronLeft className="size-3" /> : <ChevronRight className="size-3" />}
                    </button>
                </div>

                {/* Main */}
                <main className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
                    {/* Top bar */}
                    <header
                        className="h-12 flex items-center justify-between px-5 flex-none"
                        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="size-7 rounded-[7px] flex items-center justify-center flex-none"
                                style={{ background: "rgba(62,99,221,0.14)", border: "1px solid rgba(62,99,221,0.2)" }}
                            >
                                <Sparkles className="size-4" style={{ color: "#7C96EE" }} />
                            </div>
                            <span className="text-[13.5px] font-[600]">Playground</span>
                            <span style={{ color: "var(--foreground-3)" }}>•</span>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="bg-transparent outline-none cursor-pointer text-[12.5px] font-[500]"
                                style={{ color: "var(--foreground-2)", fontFamily: "var(--font-sans)" }}
                            >
                                {modelsQuery.data?.models.map((m: any) => (
                                    <option key={m.id} value={m.slug} style={{ background: "var(--surface)" }}>
                                        {m.company.name} / {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="size-7 flex items-center justify-center rounded-[6px] transition-colors"
                            style={{
                                background: showSettings ? "rgba(255,255,255,0.07)" : "transparent",
                                color: showSettings ? "var(--foreground)" : "var(--foreground-3)"
                            }}
                            onMouseEnter={e => { if (!showSettings) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                            onMouseLeave={e => { if (!showSettings) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                            <Settings2 className="size-4" />
                        </button>
                    </header>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-[720px] mx-auto py-10 px-6 space-y-8">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                                    <div
                                        className="size-16 rounded-[16px] flex items-center justify-center"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                    >
                                        <MessageSquare className="size-7" style={{ color: "var(--foreground-3)" }} />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <h2 className="text-[20px] font-[600] tracking-[-0.01em]">What can I help you build?</h2>
                                        <p className="text-[13px]" style={{ color: "var(--foreground-2)" }}>
                                            Select a model above and start your session.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                                        {['Explain Quantum Physics', 'Write a React Hook', 'Analyze Market Trends', 'Optimize SQL Query'].map(prompt => (
                                            <button
                                                key={prompt}
                                                className="h-9 px-3 rounded-[8px] text-[12px] font-[500] transition-colors text-left"
                                                style={{ border: "1px solid var(--border)", color: "var(--foreground-2)", background: "var(--surface)" }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground-2)"; }}
                                                onClick={() => setInput(prompt)}
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i} className={cn("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                        <div
                                            className="size-8 rounded-[8px] flex items-center justify-center flex-none"
                                            style={{
                                                background: msg.role === "user" ? "var(--accent-blue)" : "var(--surface)",
                                                border: `1px solid ${msg.role === "user" ? "var(--accent-blue)" : "var(--border)"}`,
                                            }}
                                        >
                                            {msg.role === "user" ? (
                                                <User className="size-4 text-white" />
                                            ) : (
                                                <Bot className="size-4" style={{ color: "var(--foreground-3)" }} />
                                            )}
                                        </div>
                                        <div className={cn("flex flex-col gap-1 flex-1 max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                                            <span className="text-[11px] font-[600] uppercase tracking-[0.05em]" style={{ color: "var(--foreground-3)" }}>
                                                {msg.role === "user" ? "You" : "Assistant"}
                                            </span>
                                            {msg.role === "assistant" ? (
                                                <div
                                                    className="prose w-full"
                                                    style={{
                                                        background: "var(--surface)",
                                                        border: "1px solid var(--border)",
                                                        borderRadius: "10px",
                                                        padding: "12px 16px",
                                                    }}
                                                >
                                                    {msg.content ? (
                                                        <ReactMarkdown components={{
                                                            code({ className, children, ...props }: any) {
                                                                return (
                                                                    <code className={cn("text-[#7C96EE]", className)} style={{ fontFamily: "var(--font-mono)" }} {...props}>
                                                                        {children}
                                                                    </code>
                                                                );
                                                            }
                                                        }}>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        <div className="flex gap-1.5 py-1">
                                                            <div className="size-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: "var(--accent-blue)" }} />
                                                            <div className="size-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: "var(--accent-blue)" }} />
                                                            <div className="size-1.5 rounded-full animate-bounce" style={{ background: "var(--accent-blue)" }} />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div
                                                    className="text-[13.5px] leading-[1.6] px-4 py-2.5 rounded-[10px]"
                                                    style={{ background: "rgba(62,99,221,0.1)", border: "1px solid rgba(62,99,221,0.2)", color: "var(--foreground)" }}
                                                >
                                                    {msg.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={scrollRef} className="h-4" />
                        </div>
                    </div>

                    {/* Input bar */}
                    <div
                        className="flex-none p-5"
                        style={{ borderTop: "1px solid var(--border)", background: "var(--background)" }}
                    >
                        <div className="max-w-[720px] mx-auto flex items-end gap-3">
                            <div
                                className="flex-1 flex items-center rounded-[10px] overflow-hidden"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                            >
                                <textarea
                                    rows={1}
                                    placeholder="Message PromptRouter…"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    disabled={isLoading}
                                    className="flex-1 bg-transparent border-0 outline-none resize-none px-4 py-3 text-[13.5px] leading-[1.5]"
                                    style={{
                                        color: "var(--foreground)",
                                        fontFamily: "var(--font-sans)",
                                        maxHeight: "160px",
                                        overflowY: "auto",
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="size-10 rounded-[8px] flex items-center justify-center flex-none text-white transition-all disabled:opacity-40"
                                style={{ background: "var(--accent-blue)" }}
                                onMouseEnter={e => { if (!isLoading && input.trim()) (e.currentTarget as HTMLElement).style.background = "var(--accent-blue-hover)"; }}
                                onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                            >
                                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </button>
                        </div>
                        <p className="text-center text-[11px] mt-2" style={{ color: "var(--foreground-3)" }}>
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </main>

                {/* Settings Sidebar */}
                <aside
                    className={cn(
                        "flex flex-col transition-all duration-200 ease-in-out flex-none",
                        showSettings ? "w-[240px]" : "w-0"
                    )}
                    style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}
                >
                    {showSettings && (
                        <div className="p-4 space-y-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
                            <h3 className="text-[14px] font-[600] m-0">Playground Settings</h3>
                            
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>System Prompt</label>
                                <textarea
                                    placeholder="You are a helpful AI assistant..."
                                    value={systemPrompt}
                                    onChange={e => setSystemPrompt(e.target.value)}
                                    rows={5}
                                    className="w-full p-2.5 rounded-[6px] text-[13px] outline-none transition-all resize-none"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", minHeight: "100px" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[12px] font-[500]">
                                    <span style={{ color: "var(--foreground-2)" }}>Temperature</span>
                                    <span className="font-mono text-[11.5px]">{temperature}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={temperature}
                                    onChange={e => setTemperature(parseFloat(e.target.value))}
                                    className="w-full accent-[var(--accent-blue)]"
                                    style={{ cursor: "pointer" }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Max Tokens</label>
                                <input
                                    type="number"
                                    value={maxTokens}
                                    onChange={e => setMaxTokens(parseInt(e.target.value) || 0)}
                                    className="w-full h-8 px-2 rounded-[6px] text-[13px] outline-none transition-all font-mono"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </DashboardLayout>
    );
}
