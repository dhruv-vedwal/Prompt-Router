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
import {
    Zap,
    Coins,
    Activity,
    TrendingUp,
    Clock,
    Box,
    Loader2,
    MonitorPlay,
} from "lucide-react";

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

    if (usageQuery.isLoading) {
        return (
            <DashboardLayout fullHeight>
                <div className="h-full flex flex-col items-center justify-center gap-4">
                    <Loader2 className="size-8 animate-spin text-primary/20" />
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Synthesizing Intelligence</p>
                </div>
            </DashboardLayout>
        );
    }

    const data = usageQuery.data;
    // Professional Slate & Indigo Palette
    const primaryColor = "#6366f1";
    const secondaryColor = "#94a3b8";

    return (
        <DashboardLayout fullHeight>
            <div className="h-full flex flex-col gap-4 overflow-hidden">
                {/* Header Section */}
                <div className="flex items-end justify-between border-b border-border/40 pb-4">
                    <div>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <MonitorPlay className="size-3" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.25em]">Telemetry Hub</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter text-foreground">Usage Intelligence</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Data Retention</p>
                            <p className="text-xs font-bold text-foreground">Last 30 Days</p>
                        </div>
                        <div className="size-10 rounded-full border border-border/50 flex items-center justify-center bg-card/30">
                            <Activity className="size-4 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Top Metrics Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col p-4 rounded-2xl bg-card/20 border border-border/40 relative overflow-hidden group hover:border-primary/30 transition-all">
                        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Total Token Volume</span>
                        <div className="flex items-center gap-2">
                            <Zap className="size-4 text-primary/40" />
                            <span className="text-2xl font-black tabular-nums tracking-tight">{data?.total.tokens.toLocaleString()}</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:scale-110 transition-transform">
                            <Zap className="size-16 text-primary" />
                        </div>
                    </div>

                    <div className="flex flex-col p-4 rounded-2xl bg-card/20 border border-border/40 relative overflow-hidden group hover:border-primary/30 transition-all">
                        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Account Credits Used</span>
                        <div className="flex items-center gap-2">
                            <Coins className="size-4 text-primary/40" />
                            <span className="text-2xl font-black tabular-nums tracking-tight">{Number(data?.total.spent).toLocaleString()}</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:scale-110 transition-transform">
                            <Coins className="size-16 text-primary" />
                        </div>
                    </div>

                    <div className="flex flex-col p-4 rounded-2xl bg-card/20 border border-border/40 relative overflow-hidden group hover:border-primary/30 transition-all">
                        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">API Request Count</span>
                        <div className="flex items-center gap-2">
                            <Activity className="size-4 text-primary/40" />
                            <span className="text-2xl font-black tabular-nums tracking-tight">{data?.total.requests.toLocaleString()}</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:scale-110 transition-transform">
                            <Activity className="size-16 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Main Insight Grid */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Primary Graph */}
                    <Card className="lg:col-span-2 bg-card/20 border-border/40 backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
                        <CardHeader className="py-4 px-6 border-b border-border/30 bg-card/10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black flex items-center gap-2 tracking-tight">
                                    <TrendingUp className="size-4 text-primary/60" />
                                    CONSUMPTION TRAJECTORY
                                </CardTitle>
                                <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">LIVE</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 p-0 pt-6 pr-6 pb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.dailyUsage}>
                                    <defs>
                                        <linearGradient id="proColorTokens" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.02)" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 600}}
                                        tickFormatter={(val) => typeof val === 'string' && val.includes('-') ? val.split('-').slice(1).join('/') : val}
                                    />
                                    <YAxis 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 600}}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(15,15,20,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', backdropFilter: 'blur(10px)', color: '#fff' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                                        itemStyle={{ color: primaryColor, fontWeight: '900', fontSize: '12px', padding: '0' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="tokens" 
                                        stroke={primaryColor} 
                                        strokeWidth={2.5}
                                        fillOpacity={1} 
                                        fill="url(#proColorTokens)" 
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Secondary Metrics Column */}
                    <div className="flex flex-col gap-4">
                        {/* Throughput */}
                        <Card className="flex-1 min-h-0 bg-card/20 border-border/40 backdrop-blur-md shadow-sm flex flex-col">
                            <CardHeader className="py-3 px-5 border-b border-border/30">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                    <Clock className="size-3" />
                                    Model Velocity (TPS)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0 p-0 pr-4 pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.throughput} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="model" 
                                            type="category" 
                                            axisLine={false}
                                            tickLine={false}
                                            width={70}
                                            tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700}}
                                        />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                            contentStyle={{ backgroundColor: 'rgba(15,15,20,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="avgTps" radius={[0, 2, 2, 0]} barSize={12} fill={primaryColor}>
                                            {data?.throughput.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.15)} fill={primaryColor} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Latency List */}
                        <Card className="flex-1 min-h-0 bg-card/20 border-border/40 backdrop-blur-md shadow-sm flex flex-col overflow-hidden">
                            <CardHeader className="py-3 px-5 border-b border-border/30">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                    <Box className="size-3" />
                                    Efficiency Audit
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
                                <div className="space-y-2">
                                    {data?.throughput.map((item, idx) => (
                                        <div key={item.model} className="flex items-center justify-between p-2.5 rounded-xl bg-card/30 border border-border/30 hover:border-primary/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="size-7 rounded-lg border border-border/50 flex items-center justify-center bg-background/50 font-black text-[10px] text-primary/70">
                                                    {item.model.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-foreground/90 leading-none">{item.model}</p>
                                                    <p className="text-[8px] text-muted-foreground font-bold tracking-tighter mt-1">{item.avgLatency.toFixed(0)}ms latency</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-black text-primary tabular-nums leading-none">{item.avgTps.toFixed(1)}</p>
                                                <p className="text-[7px] text-muted-foreground font-black uppercase tracking-tighter">TPS</p>
                                            </div>
                                        </div>
                                    ))}
                                    {data?.throughput.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                                            <Activity className="size-8 mb-2" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">Awaiting Data</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
