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
import {
    Coins,
    Plus,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Wallet,
    TrendingUp,
} from "lucide-react";

export function Credits() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();

    const apiKeysQuery = useQuery({
        queryKey: ["api-keys"],
        queryFn: async () => {
            const response = await elysiaClient["api-keys"].get();
            if (response.error) throw new Error("Failed to fetch API keys");
            return response.data;
        },
    });

    const userProfileQuery = useQuery({
        queryKey: ["user-profile"],
        queryFn: async() => {
            const response = await elysiaClient["auth"].profile.get();
            if (response.error) throw new Error("Error while fetching user details")
                return response.data;
        }
    })

    const onrampMutation = useMutation({
        mutationFn: async () => {
            const response = await elysiaClient.payments.onramp.post();
            if (response.error) {
                const errValue = response.error.value as { message?: string } | undefined;
                throw new Error(errValue?.message || "Failed to add credits");
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        },
    });

    const apiKeys = apiKeysQuery.data?.apiKeys ?? [];
    const totalCreditsUsed = apiKeys.reduce(
        (sum, k) => sum + Number(k.creditsConsumed ?? 0),
        0
    );
    const balance = userProfileQuery.data?.balance;

    return (
        <DashboardLayout>
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Billing & Credits
                    </h1>
                    <p className="text-muted-foreground/80 max-w-2xl">
                        Monitor your consumption and top up your account balance. Usage is calculated per-key and settled in real-time.
                    </p>
                </div>

                {/* Balance & usage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {onrampMutation.isSuccess && onrampMutation.data && (
                        <Card className="sm:col-span-2 bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent opacity-50" />
                            <CardContent className="pt-8 pb-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="size-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_-10px_rgba(16,185,129,0.5)]">
                                        <Wallet className="size-8 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/70">Transaction Success</p>
                                        <p className="text-4xl font-black tracking-tight text-foreground mt-1">
                                            {Number(onrampMutation.data.credits ?? 0).toLocaleString()} <span className="text-xl font-medium text-muted-foreground/50 ml-1">Credits</span>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-card/40 border-border/50 shadow-lg shadow-primary/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Available Credits</span>
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <TrendingUp className="size-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <p className="text-4xl font-black tracking-tight text-foreground">
                                {userProfileQuery.isLoading ? (
                                    <Loader2 className="size-6 animate-spin text-primary" />
                                ) : (
                                    Number(balance ?? 0).toLocaleString()
                                )}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground/70 mt-2 flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                Provisioned for {apiKeys.length} environments
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-border/50 shadow-lg shadow-primary/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Usage Breakdown</span>
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Coins className="size-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            {apiKeysQuery.isLoading ? (
                                <Loader2 className="size-5 animate-spin text-primary" />
                            ) : apiKeys.length === 0 ? (
                                <p className="text-sm font-medium text-muted-foreground/60 italic py-2">No active sessions found</p>
                            ) : (
                                <div className="space-y-3">
                                    {apiKeys.slice(0, 3).map((key) => (
                                        <div key={key.id} className="flex items-center justify-between text-sm group/item">
                                            <span className="text-muted-foreground/80 group-hover/item:text-foreground transition-colors truncate mr-4 font-medium">{key.name}</span>
                                            <span className="tabular-nums font-bold text-foreground">
                                                {Number(key.creditsConsumed ?? 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                    {apiKeys.length > 3 && (
                                        <p className="text-[10px] font-bold text-primary/50 uppercase tracking-widest pt-1 border-t border-border/20">
                                            +{apiKeys.length - 3} other credentials
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Add credits */}
                <Card className="bg-card/40 border-border/50 shadow-xl shadow-black/20 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-xl font-bold text-foreground">Top Up Account</CardTitle>
                        <CardDescription className="text-muted-foreground/70">
                            Select a credit bundle to increase your quota.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                            <div className="flex items-center gap-5 rounded-2xl border border-border/50 bg-background/40 px-6 py-5 flex-1 group-hover:border-primary/30 transition-colors">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Plus className="size-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-foreground">1,000 Credits</p>
                                    <p className="text-sm text-muted-foreground/70">Institutional Tier top-up</p>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="h-20 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all group-hover:scale-[1.02]"
                                onClick={() => onrampMutation.mutate()}
                                disabled={onrampMutation.isPending}
                            >
                                {onrampMutation.isPending ? (
                                    <>
                                        <Loader2 className="size-6 animate-spin mr-3" />
                                        PROCESSING
                                    </>
                                ) : (
                                    <>
                                        BUY CREDITS
                                    </>
                                )}
                            </Button>
                        </div>

                        {onrampMutation.isSuccess && (
                            <div className="flex items-start gap-4 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-5 mt-8 animate-in slide-in-from-top-4 duration-500">
                                <div className="p-1.5 rounded-full bg-emerald-500/20">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-emerald-300">Transaction Finalized</p>
                                    <p className="text-emerald-400/80 leading-relaxed">
                                        1,000 credits have been successfully allocated to your global pool. 
                                        New balance: <span className="font-black">{Number(onrampMutation.data?.credits ?? 0).toLocaleString()}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {onrampMutation.isError && (
                            <div className="flex items-start gap-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl px-6 py-5 mt-6">
                                <div className="p-1.5 rounded-full bg-destructive/20">
                                    <AlertCircle className="size-4 shrink-0" />
                                </div>
                                <span className="font-bold py-1">
                                    {onrampMutation.error?.message || "Failed to add credits. Please try again."}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
