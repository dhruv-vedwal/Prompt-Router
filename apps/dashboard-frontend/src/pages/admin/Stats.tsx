import { useQuery } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import {
    BarChart3,
    TrendingUp,
    Zap,
    Users,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
} from "lucide-react";

export function PlatformStats() {
    const elysiaClient = useElysiaClient();
    
    const statsQuery = useQuery({
        queryKey: ["admin-stats"],
        queryFn: async () => {
            const response = await elysiaClient.admin.stats.get();
            if (response.error) throw new Error("Failed to fetch stats");
            return response.data;
        },
        refetchInterval: 10000, // Refresh every 10s
    });

    const metrics = statsQuery.data?.metrics;
    const providerHealth = statsQuery.data?.providerHealth ?? [];

    if (statsQuery.isLoading) {
        return (
            <DashboardLayout>
                <div className="h-full flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="size-10 animate-spin text-amber-500/40" />
                    <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-[0.2em]">Synchronizing Live Telemetry...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-500">
                            <BarChart3 className="size-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Console Admin</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Platform Telemetry</h1>
                        <p className="text-muted-foreground/70 text-sm">Real-time oversight of global token throughput and margins.</p>
                    </div>
                </div>

                {/* Primary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        title="Total Throughput" 
                        value={metrics?.totalTokens?.toLocaleString() ?? "0"} 
                        unit="Tokens" 
                        trend="Real-time" 
                        isUp={true} 
                        icon={Zap} 
                    />
                    <MetricCard 
                        title="Active Sessions" 
                        value={metrics?.activeSessions ?? "0"} 
                        unit="Current" 
                        trend="Live" 
                        isUp={true} 
                        icon={Users} 
                    />
                    <MetricCard 
                        title="System Margin" 
                        value={`${metrics?.averageMargin?.toFixed(1) ?? "0"}%`} 
                        unit="Avg" 
                        trend={metrics?.averageMargin && metrics.averageMargin > 20 ? "Healthy" : "Low"} 
                        isUp={metrics?.averageMargin && metrics.averageMargin > 20} 
                        icon={TrendingUp} 
                    />
                    <MetricCard 
                        title="Success Rate" 
                        value={`${metrics?.successRate?.toFixed(1) ?? "0"}`} 
                        unit="%" 
                        trend={metrics?.successRate && metrics.successRate > 95 ? "Stable" : "Critical"} 
                        isUp={metrics?.successRate && metrics.successRate > 95} 
                        icon={Activity} 
                    />
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 bg-card/40 border-border/50 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-primary" />
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center justify-between">
                                Platform Economics
                                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">FINANCIALS</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Gross Revenue</p>
                                    <p className="text-3xl font-black text-foreground tabular-nums">${metrics?.totalRevenue?.toFixed(4) ?? "0.0000"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Cost of Sales</p>
                                    <p className="text-3xl font-black text-destructive/80 tabular-nums">${metrics?.totalCost?.toFixed(4) ?? "0.0000"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Gross Profit</p>
                                    <p className="text-3xl font-black text-emerald-500 tabular-nums">${metrics?.totalMargin?.toFixed(4) ?? "0.0000"}</p>
                                </div>
                            </div>
                            
                            {/* Visual Progress Bar for Margin */}
                            <div className="mt-12 space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-muted-foreground/60">Profit Margin Distribution</span>
                                    <span className="text-primary">{metrics?.averageMargin?.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                                        style={{ width: `${Math.min(metrics?.averageMargin ?? 0, 100)}%` }} 
                                    />
                                    <div 
                                        className="h-full bg-amber-500/20" 
                                        style={{ width: `${100 - Math.min(metrics?.averageMargin ?? 0, 100)}%` }} 
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-border/50 shadow-xl flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Provider Health</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                            {providerHealth.map((p: any) => (
                                <ProviderStatus 
                                    key={p.id}
                                    name={p.name} 
                                    latency={p.latency} 
                                    status={p.status} 
                                    isWarning={p.isWarning} 
                                />
                            ))}
                            {providerHealth.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center py-10 opacity-20">
                                    <Activity className="size-8 mb-2" />
                                    <p className="text-[10px] font-black uppercase">No Active Nodes</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

function MetricCard({ title, value, unit, trend, isUp, icon: Icon }: any) {
    return (
        <Card className="bg-card/40 border-border/50 hover:border-primary/30 transition-all duration-300 relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{title}</span>
                    <Icon className="size-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black tracking-tight">{value}</span>
                    <span className="text-xs font-bold text-muted-foreground/50">{unit}</span>
                </div>
                <div className={cn(
                    "flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md w-fit border",
                    isUp ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" : "bg-destructive/10 text-destructive border-destructive/10"
                )}>
                    {isUp ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                    {trend}
                </div>
            </CardContent>
        </Card>
    );
}

function ProviderStatus({ name, latency, status, isWarning }: any) {
    return (
        <div className="flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "size-2 rounded-full",
                    isWarning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                )} />
                <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground transition-colors">{name}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-black text-muted-foreground tabular-nums tracking-tighter">{latency}</span>
                <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    isWarning ? "text-amber-500" : "text-emerald-500/60"
                )}>{status}</span>
            </div>
        </div>
    );
}

import { cn } from "@/lib/utils";
