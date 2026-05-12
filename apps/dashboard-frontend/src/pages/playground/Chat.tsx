import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Send, 
    Bot, 
    User, 
    Trash2, 
    Loader2, 
    Sparkles, 
    Settings2,
    MessageSquare,
    Zap,
    History,
    Plus,
    Clock,
    MoreVertical,
    Pencil,
    ChevronLeft,
    ChevronRight,
    Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
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
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();

    // Fetch available models
    const modelsQuery = useQuery({
        queryKey: ["playground-models"],
        queryFn: async () => {
            const response = await elysiaClient.models.get();
            if (response.error) throw new Error("Failed to fetch models");
            return response.data;
        }
    });

    // Fetch Chat History
    const historyQuery = useQuery({
        queryKey: ["chat-history"],
        queryFn: async () => {
            const response = await elysiaClient.playground.history.get();
            if (response.error) throw new Error("Failed to fetch history");
            return response.data;
        }
    });

    // Auto-scroll to bottom
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
            setMessages(response.data.messages || []);
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

            const response = await fetch("http://localhost:4000/api/v1/chat/completions/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: newMessages,
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
            const session = historyQuery.data?.find((s: any) => s.id === currentSessionId);
            if (session && (session.title === "New Chat" || !session.title)) {
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
            <div className="flex h-full w-full bg-background overflow-hidden">
                {/* Sidebar */}
                <aside className={cn(
                    "flex flex-col border-r border-border/50 bg-card/10 backdrop-blur-xl transition-all duration-300 ease-in-out",
                    isSidebarOpen ? "w-72" : "w-0"
                )}>
                    {isSidebarOpen && (
                        <>
                            <div className="p-4">
                                <Button 
                                    onClick={startNewChat}
                                    variant="outline"
                                    className="w-full h-11 border-border/60 hover:bg-accent/50 text-foreground font-bold gap-2 rounded-xl transition-all"
                                >
                                    <Plus className="size-4" />
                                    New Session
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 px-3">
                                <div className="space-y-4 py-2">
                                    <div className="flex items-center gap-2 px-3">
                                        <Clock className="size-3 text-muted-foreground/40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Recent Activity</span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        {historyQuery.data?.map((session: any) => (
                                            <div key={session.id} className="group relative">
                                                {editingSessionId === session.id ? (
                                                    <div className="p-1 px-2">
                                                        <Input 
                                                            autoFocus
                                                            value={newTitle}
                                                            onChange={(e) => setNewTitle(e.target.value)}
                                                            onKeyDown={(e) => e.key === "Enter" && updateTitle(session.id)}
                                                            onBlur={() => setEditingSessionId(null)}
                                                            className="h-8 text-xs bg-background border-primary/40 rounded-lg"
                                                        />
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => loadSession(session.id)}
                                                        className={cn(
                                                            "w-full text-left p-3 rounded-xl transition-all group flex items-center justify-between",
                                                            sessionId === session.id
                                                                ? "bg-primary/10 text-primary shadow-sm"
                                                                : "hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <span className="text-xs font-bold truncate pr-2">{session.title}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="size-6 text-muted-foreground/60 hover:text-foreground"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSessionId(session.id);
                                                                    setNewTitle(session.title);
                                                                }}
                                                            >
                                                                <Pencil className="size-3" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="size-6 text-muted-foreground/60 hover:text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteSession(session.id);
                                                                }}
                                                            >
                                                                <Trash2 className="size-3" />
                                                            </Button>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {historyQuery.isLoading && (
                                        <div className="flex justify-center py-10 opacity-30">
                                            <Loader2 className="size-4 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </aside>

                {/* Sidebar Toggle */}
                <div className="relative">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="absolute top-1/2 -translate-y-1/2 -left-3 z-10 size-6 rounded-full bg-background border border-border/50 shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
                    >
                        {isSidebarOpen ? <ChevronLeft className="size-3" /> : <ChevronRight className="size-3" />}
                    </button>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
                    {/* Model Header */}
                    <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md z-20">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Sparkles className="size-4 text-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold tracking-tight">AI Playground</span>
                                <span className="text-muted-foreground/30">•</span>
                                <select 
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="bg-transparent text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer"
                                >
                                    {modelsQuery.data?.models.map((m: any) => (
                                        <option key={m.id} value={`${m.company.name.toLowerCase()}/${m.name}`}>
                                            {m.company.name} / {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                                <Settings2 className="size-4" />
                            </Button>
                        </div>
                    </header>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto scroll-smooth">
                        <div className="max-w-3xl mx-auto py-10 px-6 space-y-10">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-40 space-y-8 animate-in fade-in zoom-in-95 duration-700">
                                    <div className="size-20 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <MessageSquare className="size-10 text-primary/40 relative z-10" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h2 className="text-3xl font-black tracking-tighter text-foreground">What can I help you build?</h2>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed opacity-60">
                                            Select a high-performance model and start your session. 
                                            Real-time streaming and persistent history enabled.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                                        {['Explain Quantum Physics', 'Write a React Hook', 'Analyze Market Trends', 'Optimize SQL Query'].map(prompt => (
                                            <Button 
                                                key={prompt} 
                                                variant="outline" 
                                                className="text-[10px] uppercase font-black tracking-widest h-10 border-border/50 hover:bg-accent/40 rounded-xl"
                                                onClick={() => {
                                                    setInput(prompt);
                                                }}
                                            >
                                                {prompt}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className={cn(
                                            "flex gap-6 max-w-full group",
                                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                        )}>
                                            <div className={cn(
                                                "size-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500",
                                                msg.role === "user" 
                                                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]" 
                                                    : "bg-card border-border/50 shadow-sm"
                                            )}>
                                                {msg.role === "user" ? <User className="size-5" /> : <Bot className="size-5" />}
                                            </div>
                                            <div className={cn(
                                                "flex flex-col gap-2 flex-1",
                                                msg.role === "user" ? "items-end" : "items-start"
                                            )}>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                                                    {msg.role === "user" ? "Protocol User" : "Neural Agent"}
                                                </div>
                                                <div className={cn(
                                                    "text-sm leading-relaxed prose prose-invert prose-sm max-w-none w-full",
                                                    msg.role === "user" 
                                                        ? "text-right font-medium text-foreground/90 px-4 py-2 bg-primary/5 rounded-2xl rounded-tr-none" 
                                                        : "text-foreground"
                                                )}>
                                                    {msg.role === "assistant" ? (
                                                        <div className="bg-card/30 p-4 rounded-2xl border border-border/30 backdrop-blur-sm">
                                                            <ReactMarkdown components={{
                                                                code({ node, className, children, ...props }: any) {
                                                                    return (
                                                                        <div className="relative group">
                                                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <Terminal className="size-3 text-muted-foreground/50" />
                                                                            </div>
                                                                            <code className={cn("bg-black/40 rounded px-1.5 py-0.5 font-mono text-emerald-400/90", className)} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        </div>
                                                                    )
                                                                }
                                                            }}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                            {!msg.content && (
                                                                <div className="flex gap-2 py-2">
                                                                    <div className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                                                                    <div className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                                                                    <div className="size-1.5 rounded-full bg-primary/40 animate-bounce" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        msg.content
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={scrollRef} className="h-20" />
                        </div>
                    </div>

                    {/* Input Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none z-30">
                        <div className="max-w-3xl mx-auto pointer-events-auto relative">
                            <div className="relative group/input shadow-2xl rounded-[1.5rem] overflow-hidden border border-border/50 bg-card/50 backdrop-blur-xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                                <Input
                                    placeholder="Message PromptRouter..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    disabled={isLoading}
                                    className="pr-16 pl-6 h-16 bg-transparent border-0 focus-visible:ring-0 text-sm font-medium"
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className={cn(
                                        "absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-xl transition-all duration-500",
                                        input.trim() ? "bg-primary hover:bg-primary/90 scale-100 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground scale-90"
                                    )}
                                >
                                    {isLoading ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Send className="size-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-6 px-2">
                                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/30">
                                    <Zap className="size-3 text-primary/60" />
                                    Stream Protocol Active
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/30">
                                    <Terminal className="size-3" />
                                    Encrypted Context
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}
