import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
    Key, 
    Plus, 
    Trash2, 
    Copy, 
    Check, 
    Search, 
    AlertCircle, 
    Eye, 
    EyeOff,
    ShieldCheck,
    Clock,
    Fingerprint,
    Zap
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function ApiKeys() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();

    const apiKeysQuery = useQuery({
        queryKey: ["api-keys", debouncedSearch],
        queryFn: async () => {
            const response = await elysiaClient["api-keys"].get({
                query: { search: debouncedSearch }
            });
            if (response.error) throw new Error("Failed to fetch keys");
            return response.data;
        }
    });

    const createKey = async () => {
        if (!newKeyName.trim() || isCreating) return;
        setIsCreating(true);
        try {
            const response = await elysiaClient["api-keys"].post({ name: newKeyName });
            if (response.error) throw new Error("Failed to create key");
            
            // Show the raw key ONLY ONCE
            setRevealedKey(response.data.apiKey);
            setNewKeyName("");
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const deleteKey = async (id: number) => {
        try {
            await elysiaClient["api-keys"]({ id }).delete();
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const maskKey = (key: string) => {
        if (key.length < 12) return "********";
        return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <ShieldCheck className="size-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Security Protocol</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">API Credentials</h1>
                        <p className="text-muted-foreground text-sm max-w-md font-medium leading-relaxed">
                            Manage your cryptographic keys. These credentials allow your applications to securely interface with PromptRouter.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-card/50 backdrop-blur-xl border border-border/50 p-2 rounded-2xl shadow-sm">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Search keys..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 w-64 bg-background/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl h-11"
                            />
                        </div>
                        <Button 
                            className="h-11 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => document.getElementById('new-key-input')?.focus()}
                        >
                            <Plus className="size-4" />
                            Generate Key
                        </Button>
                    </div>
                </div>

                {/* New Key Reveal Modal */}
                {revealedKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
                        <Card className="w-full max-w-lg border-primary/20 bg-card/90 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(var(--primary),0.3)] overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-4 text-primary">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Zap className="size-6 animate-pulse" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-xl font-black tracking-tight">Key Generated Successfully</h3>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Secret Credential Revealed</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3">
                                    <AlertCircle className="size-5 text-orange-500 shrink-0" />
                                    <p className="text-xs font-bold text-orange-500 leading-relaxed">
                                        IMPORTANT: This is the only time your full API key will be shown. Copy it now and store it in a secure location. If lost, you must generate a new one.
                                    </p>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative flex items-center gap-3 p-4 bg-background/50 border border-border/50 rounded-xl font-mono text-sm">
                                        <code className="flex-1 truncate select-all">{revealedKey}</code>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                                            onClick={() => copyToClipboard(revealedKey)}
                                        >
                                            {copiedKey === revealedKey ? <Check className="size-4" /> : <Copy className="size-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button 
                                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs"
                                    onClick={() => setRevealedKey(null)}
                                >
                                    I have saved my key
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Key Creation Area */}
                <Card className="p-8 border-border/50 bg-card/30 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Key className="size-32" />
                    </div>
                    <div className="relative flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 space-y-1">
                            <h3 className="text-lg font-black tracking-tight">Create New Key</h3>
                            <p className="text-sm text-muted-foreground font-medium">Give your key a descriptive name to identify its purpose.</p>
                        </div>
                        <div className="flex w-full md:w-auto items-center gap-3">
                            <Input 
                                id="new-key-input"
                                placeholder="e.g. Production Mobile App" 
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createKey()}
                                className="h-12 w-full md:w-80 bg-background/50 border-border/50 rounded-xl font-medium"
                            />
                            <Button 
                                onClick={createKey}
                                disabled={isCreating || !newKeyName.trim()}
                                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs gap-2 shrink-0"
                            >
                                {isCreating ? <Zap className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                Generate
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Keys List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apiKeysQuery.data?.apiKeys.map((key: any) => (
                        <Card key={key.id} className="group p-6 border-border/40 bg-card/20 hover:bg-card/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{key.name}</h3>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                            <Fingerprint className="size-3" />
                                            {key.id.toString().padStart(6, '0')}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="size-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                        onClick={() => deleteKey(key.id)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative group/key">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50 font-mono text-xs text-muted-foreground group-hover/key:text-foreground transition-colors">
                                            <span>{maskKey(key.apiKey)}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover/key:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="size-6 text-primary"
                                                    onClick={() => copyToClipboard(key.apiKey)}
                                                >
                                                    {copiedKey === key.apiKey ? <Check className="size-3" /> : <Copy className="size-3" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Rate Limit</div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <Zap className="size-3 text-primary" />
                                                {key.rpmLimit} RPM
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Last Used</div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <Clock className="size-3 text-primary" />
                                                {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {apiKeysQuery.isLoading && [1, 2, 3].map(i => (
                        <div key={i} className="h-56 rounded-3xl bg-muted/20 animate-pulse border border-border/50" />
                    ))}
                </div>

                {!apiKeysQuery.isLoading && apiKeysQuery.data?.apiKeys.length === 0 && (
                    <div className="py-20 text-center space-y-6">
                        <div className="size-20 rounded-[2.5rem] bg-muted/10 border border-border/50 flex items-center justify-center mx-auto">
                            <Key className="size-10 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black">No Active Keys</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">Generate your first API key to start building with PromptRouter's unified gateway.</p>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
