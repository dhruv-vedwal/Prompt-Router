import { useQuery } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
} from "recharts";
import { Activity, Zap, Coins, TrendingUp, Clock, Box, Loader2 } from "lucide-react";

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div
            className="rounded-[10px] p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
            <div className="text-[12px] mb-2 uppercase tracking-[0.05em] font-[600]" style={{ color: "var(--foreground-3)" }}>{label}</div>
            <div className="text-[26px] font-[600] tracking-[-0.01em] tabular-nums">{value}</div>
        </div>
    );
}

export function Analytics() {
    const elysiaClient = useElysiaClient();

    const usageQuery = useQuery({
        queryKey: ["user-usage"],
        queryFn: async () => {
            const response = await elysiaClient.usage.stats.get();
            if (response.error) throw new Error("Failed to fetch usage stats");
            return response.data;
        },
    });

    const accentBlue = "#3E63DD";

    if (usageQuery.isLoading) {
        return (
            <DashboardLayout fullHeight>
                <div className="h-full flex items-center justify-center gap-3" style={{ color: "var(--foreground-3)" }}>
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-[13px]">Loading analytics…</span>
                </div>
            </DashboardLayout>
        );
    }

    const data = usageQuery.data;

    return (
        <DashboardLayout fullHeight>
            <div style={{ padding: "28px 36px 36px", display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflow: "hidden" }}>
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">Analytics</h1>
                        <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>Usage over the last 30 days.</p>
                    </div>
                    <div
                        className="text-[12px] px-3 py-1 rounded-[6px]"
                        style={{ border: "1px solid var(--border)", color: "var(--foreground-3)" }}
                    >
                        Last 30 days
                    </div>
                </div>

                {/* Stat strip */}
                <div className="grid grid-cols-3 gap-3 flex-none">
                    <StatCard label="Total tokens" value={data?.total.tokens.toLocaleString() ?? "—"} />
                    <StatCard label="Credits used" value={Number(data?.total.spent ?? 0).toLocaleString()} />
                    <StatCard label="Requests" value={data?.total.requests.toLocaleString() ?? "—"} />
                </div>

                {/* Charts */}
                <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
                    {/* Area chart */}
                    <div
                        className="col-span-2 rounded-[10px] flex flex-col overflow-hidden"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <div
                            className="flex items-center justify-between px-[18px] py-[14px] flex-none"
                            style={{ borderBottom: "1px solid var(--border)" }}
                        >
                            <h2 className="text-[14px] font-[600] m-0 flex items-center gap-2">
                                <TrendingUp className="size-4" style={{ color: "var(--foreground-3)" }} />
                                Token consumption
                            </h2>
                        </div>
                        <div className="flex-1 min-h-0 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.dailyUsage}>
                                    <defs>
                                        <linearGradient id="gradTokens" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={accentBlue} stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor={accentBlue} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#6E6E76", fontSize: 10 }}
                                        tickFormatter={val => typeof val === "string" && val.includes("-") ? val.split("-").slice(1).join("/") : val}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6E6E76", fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#F2F2F4" }}
                                        labelStyle={{ color: "#6E6E76", fontSize: "11px" }}
                                        itemStyle={{ color: accentBlue, fontSize: "12px" }}
                                    />
                                    <Area type="monotone" dataKey="tokens" stroke={accentBlue} strokeWidth={2} fillOpacity={1} fill="url(#gradTokens)" animationDuration={800} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-3">
                        {/* Bar chart */}
                        <div
                            className="flex-1 min-h-0 rounded-[10px] flex flex-col overflow-hidden"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                        >
                            <div
                                className="flex items-center gap-2 px-[18px] py-[14px] flex-none"
                                style={{ borderBottom: "1px solid var(--border)" }}
                            >
                                <Clock className="size-3.5" style={{ color: "var(--foreground-3)" }} />
                                <h2 className="text-[13px] font-[600] m-0">Model TPS</h2>
                            </div>
                            <div className="flex-1 min-h-0 px-3 py-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.throughput} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="model" type="category" axisLine={false} tickLine={false} width={64} tick={{ fill: "#6E6E76", fontSize: 9 }} />
                                        <Tooltip
                                            cursor={{ fill: "rgba(255,255,255,0.025)" }}
                                            contentStyle={{ backgroundColor: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }}
                                        />
                                        <Bar dataKey="avgTps" radius={[0, 3, 3, 0]} barSize={10}>
                                            {data?.throughput.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={accentBlue} fillOpacity={1 - index * 0.15} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Latency list */}
                        <div
                            className="flex-1 min-h-0 rounded-[10px] flex flex-col overflow-hidden"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                        >
                            <div
                                className="flex items-center gap-2 px-[18px] py-[14px] flex-none"
                                style={{ borderBottom: "1px solid var(--border)" }}
                            >
                                <Box className="size-3.5" style={{ color: "var(--foreground-3)" }} />
                                <h2 className="text-[13px] font-[600] m-0">Efficiency</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2">
                                {(data?.throughput ?? []).length === 0 ? (
                                    <div className="py-8 text-center text-[12px]" style={{ color: "var(--foreground-3)" }}>No data yet</div>
                                ) : (
                                    <div className="space-y-1">
                                        {data?.throughput.map((item) => (
                                            <div
                                                key={item.model}
                                                className="flex items-center justify-between px-3 py-2.5 rounded-[8px] transition-colors"
                                                style={{ color: "var(--foreground-2)" }}
                                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className="size-6 rounded-[5px] flex items-center justify-center text-[9px] font-[700] flex-none"
                                                        style={{ background: "rgba(62,99,221,0.12)", color: "#7C96EE", border: "1px solid rgba(62,99,221,0.2)" }}
                                                    >
                                                        {item.model.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-[500] m-0 leading-tight">{item.model}</p>
                                                        <p className="text-[10px] m-0" style={{ color: "var(--foreground-3)" }}>{item.avgLatency.toFixed(0)}ms</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[12px] font-[600] m-0 tabular-nums" style={{ color: "#7C96EE" }}>{item.avgTps.toFixed(1)}</p>
                                                    <p className="text-[9px] m-0" style={{ color: "var(--foreground-3)" }}>TPS</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
