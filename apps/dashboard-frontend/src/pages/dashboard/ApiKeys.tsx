import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Copy,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Key,
    Eye,
    EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export function ApiKeys() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();
    const nameRef = useRef<HTMLInputElement>(null);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

    const apiKeysQuery = useQuery({
        queryKey: ["api-keys"],
        queryFn: async () => {
            const response = await elysiaClient["api-keys"].get();
            if (response.error) throw new Error("Failed to fetch API keys");
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (name: string) => {
            const response = await elysiaClient["api-keys"].post({ name });
            if (response.error) {
                const errValue = response.error.value as { message?: string } | undefined;
                throw new Error(errValue?.message || "Failed to create API key");
            }
            return response.data;
        },
        onSuccess: (data) => {
            setNewlyCreatedKey(data?.apiKey ?? null);
            if (nameRef.current) nameRef.current.value = "";
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, disabled }: { id: string; disabled: boolean }) => {
            const response = await elysiaClient["api-keys"].put({ id, disabled });
            if (response.error) {
                const errValue = response.error.value as { message?: string } | undefined;
                throw new Error(errValue?.message || "Failed to update API key");
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await elysiaClient["api-keys"]({ id }).delete();
            if (response.error) {
                const errValue = response.error.value as { message?: string } | undefined;
                throw new Error(errValue?.message || "Failed to delete API key");
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        },
    });

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleReveal = (id: string) => {
        setRevealedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const apiKeys = apiKeysQuery.data?.apiKeys ?? [];
    const filteredKeys = apiKeys.filter(k => 
        k.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        k.apiKey.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        API Access Keys
                    </h1>
                    <p className="text-muted-foreground/80 max-w-2xl">
                        Manage your secure access credentials. Each key can be individually disabled or deleted to maintain security.
                    </p>
                </div>

                {/* Create new key */}
                <Card className="bg-card/40 border-border/50 shadow-xl shadow-black/20 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-xl font-bold text-foreground">Create New Key</CardTitle>
                        <CardDescription className="text-muted-foreground/70">
                            Provision a new cryptographic key for your application environment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <form
                            className="flex flex-col sm:flex-row gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const name = nameRef.current?.value?.trim();
                                if (name) createMutation.mutate(name);
                            }}
                        >
                            <div className="flex-1">
                                <Label htmlFor="key-name" className="sr-only">Key name</Label>
                                <Input
                                    id="key-name"
                                    ref={nameRef}
                                    placeholder="e.g. Production Environment"
                                    className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                        Provisioning...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="size-4 mr-2" />
                                        Generate Key
                                    </>
                                )}
                            </Button>
                        </form>

                        {newlyCreatedKey && (
                            <div className="flex items-start gap-3.5 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 mt-6 animate-in zoom-in-95 duration-300">
                                <div className="p-1.5 rounded-full bg-emerald-500/20">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-emerald-300">Key provisioned successfully!</p>
                                    <p className="text-emerald-400/70 mt-0.5">Copy it now — this is the last time you'll see the full secret.</p>
                                    <div className="flex items-center gap-2 mt-3 bg-black/40 rounded-xl p-3 border border-emerald-500/20">
                                        <code className="text-xs font-mono text-emerald-400 truncate block flex-1">
                                            {newlyCreatedKey}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                            onClick={() => copyToClipboard(newlyCreatedKey, "new")}
                                        >
                                            {copiedId === "new" ? (
                                                <CheckCircle2 className="size-4" />
                                            ) : (
                                                <Copy className="size-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {createMutation.isError && (
                            <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mt-4">
                                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                <span className="font-medium">{createMutation.error?.message || "Failed to create key."}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Keys list */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-foreground">
                            Active Credentials
                            {!apiKeysQuery.isLoading && (
                                <span className="text-muted-foreground/50 font-medium ml-3 text-sm">
                                    {filteredKeys.length} total
                                </span>
                            )}
                        </h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                            <Input
                                placeholder="Filter credentials..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-sm"
                            />
                        </div>
                    </div>

                    {apiKeysQuery.isLoading ? (
                        <div className="flex items-center gap-3 text-muted-foreground text-sm py-12 bg-card/20 rounded-2xl border border-border/50 justify-center">
                            <Loader2 className="size-5 animate-spin text-primary" />
                            Synchronizing keys...
                        </div>
                    ) : apiKeys.length === 0 ? (
                        <Card className="bg-card/20 border-border/40 border-dashed rounded-2xl">
                            <CardContent className="pt-6 pb-6">
                                <div className="text-center py-12">
                                    <div className="size-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/50">
                                        <Key className="size-8 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-base font-bold text-foreground">No Access Keys Found</p>
                                    <p className="text-sm text-muted-foreground/60 mt-2 max-w-xs mx-auto leading-relaxed">
                                        Your account doesn't have any active credentials. Generate your first key to start using the API.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden shadow-2xl shadow-black/20">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border/50">
                                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Name</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Access Token</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Status</th>
                                            <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Usage</th>
                                            <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Management</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {filteredKeys.map((key) => (
                                            <tr key={key.id} className="hover:bg-primary/[0.02] transition-colors group">
                                                <td className="px-6 py-4 font-bold text-foreground">{key.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <code className="font-mono text-xs text-muted-foreground/80 group-hover:text-foreground transition-colors bg-black/20 px-2 py-1 rounded">
                                                            {revealedKeys.has(key.id)
                                                                ? key.apiKey
                                                                : `${key.apiKey.slice(0, 12)}${"•".repeat(8)}`}
                                                        </code>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 hover:bg-primary/10 hover:text-primary transition-all"
                                                                onClick={() => toggleReveal(key.id)}
                                                            >
                                                                {revealedKeys.has(key.id) ? (
                                                                    <EyeOff className="size-3.5" />
                                                                ) : (
                                                                    <Eye className="size-3.5" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 hover:bg-primary/10 hover:text-primary transition-all"
                                                                onClick={() => copyToClipboard(key.apiKey, key.id)}
                                                            >
                                                                {copiedId === key.id ? (
                                                                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                                                                ) : (
                                                                    <Copy className="size-3.5" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                            key.disabled
                                                                ? "bg-muted text-muted-foreground/60"
                                                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_-4px_rgba(52,211,153,0.3)]"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`size-1.5 rounded-full ${
                                                                key.disabled ? "bg-muted-foreground/40" : "bg-emerald-400 animate-pulse"
                                                            }`}
                                                        />
                                                        {key.disabled ? "DISABLED" : "ACTIVE"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums font-bold text-foreground">
                                                    {Number(key.creditsConsumed ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "size-8 transition-all",
                                                                key.disabled ? "text-muted-foreground/40 hover:text-emerald-400" : "text-emerald-400 hover:bg-emerald-500/10"
                                                            )}
                                                            onClick={() =>
                                                                toggleMutation.mutate({
                                                                    id: key.id,
                                                                    disabled: !key.disabled,
                                                                })
                                                            }
                                                            disabled={toggleMutation.isPending}
                                                        >
                                                            {key.disabled ? (
                                                                <ToggleLeft className="size-5" />
                                                            ) : (
                                                                <ToggleRight className="size-5" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                                            onClick={() => deleteMutation.mutate(key.id)}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {(toggleMutation.isError || deleteMutation.isError) && (
                        <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <span className="font-medium">
                                {toggleMutation.error?.message ||
                                    deleteMutation.error?.message ||
                                    "Operation failed. Please try again."}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
