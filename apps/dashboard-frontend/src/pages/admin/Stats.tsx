import { useQuery } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Zap, Users, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

function StatCard({ label, value, unit, trend, isUp, icon: Icon }: {
    label: string; value: React.ReactNode; unit: string;
    trend: string; isUp: boolean | undefined; icon: any;
}) {
    return (
        <div className="rounded-[10px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-[600] uppercase tracking-[0.05em]" style={{ color: "var(--foreground-3)" }}>{label}</span>
                <Icon className="size-4" style={{ color: "var(--foreground-3)" }} />
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-[26px] font-[600] tracking-[-0.01em] tabular-nums">{value}</span>
                <span className="text-[12px]" style={{ color: "var(--foreground-3)" }}>{unit}</span>
            </div>
            <span
                className="inline-flex items-center gap-1 text-[11px] font-[500] px-1.5 py-0.5 rounded-[4px]"
                style={{
                    background: isUp ? "rgba(62,179,95,0.1)" : "rgba(229,72,77,0.1)",
                    color: isUp ? "#3EB35F" : "#e5484d",
                }}
            >
                {isUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {trend}
            </span>
        </div>
    );
}

function ProviderRow({ name, latency, status, isWarning }: any) {
    return (
        <div
            className="flex items-center justify-between px-3 py-2.5 rounded-[8px] transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
            <div className="flex items-center gap-2.5">
                <span
                    className="size-[6px] rounded-full flex-none"
                    style={{ background: isWarning ? "#F5A623" : "var(--success)" }}
                />
                <span className="text-[13px] font-[500]">{name}</span>
            </div>
            <div className="text-right">
                <div className="text-[12px] tabular-nums" style={{ color: "var(--foreground-2)" }}>{latency}</div>
                <div className="text-[10px]" style={{ color: isWarning ? "#F5A623" : "var(--foreground-3)" }}>{status}</div>
            </div>
        </div>
    );
}

export function PlatformStats() {
    const elysiaClient = useElysiaClient();

    const statsQuery = useQuery({
        queryKey: ["admin-stats"],
        queryFn: async () => {
            const response = await elysiaClient.admin.stats.get();
            if (response.error) throw new Error("Failed to fetch stats");
            return response.data;
        },
        refetchInterval: 10000,
    });

    const metrics = statsQuery.data?.metrics;
    const providerHealth = statsQuery.data?.providerHealth ?? [];

    if (statsQuery.isLoading) {
        return (
            <DashboardLayout>
                <div className="py-20 flex items-center justify-center gap-3" style={{ color: "var(--foreground-3)" }}>
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-[13px]">Loading platform stats…</span>
                </div>
            </DashboardLayout>
        );
    }

    const marginPct = Math.min(metrics?.averageMargin ?? 0, 100);

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">Platform Stats</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Real-time oversight of global token throughput and margins.
                    </p>
                </div>
                <div
                    className="text-[11px] font-[500] px-2.5 py-1 rounded-[6px]"
                    style={{ background: "rgba(62,179,95,0.1)", color: "#3EB35F", border: "1px solid rgba(62,179,95,0.2)" }}
                >
                    Live • 10s refresh
                </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-4 gap-3 mb-3">
                <StatCard label="Total Throughput" value={metrics?.totalTokens?.toLocaleString() ?? "0"} unit="Tokens" trend="Real-time" isUp={true} icon={Zap} />
                <StatCard label="Active Sessions" value={metrics?.activeSessions ?? "0"} unit="Current" trend="Live" isUp={true} icon={Users} />
                <StatCard label="System Margin" value={`${metrics?.averageMargin?.toFixed(1) ?? "0"}%`} unit="Avg" trend={metrics?.averageMargin && metrics.averageMargin > 20 ? "Healthy" : "Low"} isUp={metrics?.averageMargin ? metrics.averageMargin > 20 : false} icon={TrendingUp} />
                <StatCard label="Success Rate" value={`${metrics?.successRate?.toFixed(1) ?? "0"}`} unit="%" trend={metrics?.successRate && metrics.successRate > 95 ? "Stable" : "Critical"} isUp={metrics?.successRate ? metrics.successRate > 95 : false} icon={Activity} />
            </div>

            {/* Financials + Provider health */}
            <div className="grid grid-cols-3 gap-3">
                {/* Financials */}
                <div className="col-span-2 rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="px-[18px] py-[14px] flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                        <h2 className="text-[14.5px] font-[600] m-0">Platform Economics</h2>
                        <span
                            className="text-[11px] font-[500] px-2 py-0.5 rounded-[4px]"
                            style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" }}
                        >
                            Financials
                        </span>
                    </div>
                    <div className="p-[18px]">
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            {[
                                { label: "Gross Revenue", value: `$${metrics?.totalRevenue?.toFixed(4) ?? "0.0000"}`, color: "var(--foreground)" },
                                { label: "Cost of Sales", value: `$${metrics?.totalCost?.toFixed(4) ?? "0.0000"}`, color: "#e5484d" },
                                { label: "Gross Profit", value: `$${metrics?.totalMargin?.toFixed(4) ?? "0.0000"}`, color: "#3EB35F" },
                            ].map(item => (
                                <div key={item.label}>
                                    <p className="text-[11.5px] font-[600] uppercase tracking-[0.06em] m-0 mb-1.5" style={{ color: "var(--foreground-3)" }}>{item.label}</p>
                                    <p className="text-[22px] font-[600] tabular-nums m-0" style={{ color: item.color }}>{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11.5px] font-[600] uppercase tracking-[0.05em]" style={{ color: "var(--foreground-3)" }}>Profit Margin</span>
                                <span className="text-[12px] font-[600]" style={{ color: "#7C96EE" }}>{metrics?.averageMargin?.toFixed(1) ?? "0"}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${marginPct}%`, background: marginPct > 20 ? "#3EB35F" : "#F5A623" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Provider health */}
                <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="px-[18px] py-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                        <h2 className="text-[14.5px] font-[600] m-0">Provider Health</h2>
                    </div>
                    <div className="p-2 custom-scrollbar overflow-y-auto">
                        {providerHealth.length === 0 ? (
                            <div className="py-10 text-center text-[13px]" style={{ color: "var(--foreground-3)" }}>No providers detected</div>
                        ) : (
                            providerHealth.map((p: any) => (
                                <ProviderRow key={p.id} name={p.name} latency={p.latency} status={p.status} isWarning={p.isWarning} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
