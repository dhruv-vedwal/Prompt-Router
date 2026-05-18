import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
    Users, 
    Search, 
    Coins, 
    ChevronRight, 
    History, 
    MoreHorizontal, 
    Mail, 
    Shield, 
    Check, 
    AlertCircle,
    Zap,
    Clock,
    UserPlus,
    CreditCard,
    ArrowUpRight,
    Activity,
    Wallet,
    Key,
    MessageSquare,
    Filter,
    ArrowUpDown,
    ExternalLink
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function AdminUsers() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [topupAmount, setTopupAmount] = useState("");
    const [topupReason, setTopupReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();

    const usersQuery = useQuery({
        queryKey: ["admin-users", debouncedSearch],
        queryFn: async () => {
            const response = await elysiaClient.admin.users.get({
                query: { search: debouncedSearch }
            });
            if (response.error) throw new Error("Failed to fetch users");
            return response.data;
        }
    });

    const handleTopup = async () => {
        if (!selectedUser || !topupAmount || isProcessing) return;
        setIsProcessing(true);
        try {
            const response = await elysiaClient.admin.users({ id: selectedUser.id }).topup.post({
                amount: Number(topupAmount),
                reason: topupReason
            });
            if (response.error) throw new Error("Topup failed");
            
            setSelectedUser(null);
            setTopupAmount("");
            setTopupReason("");
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-1000">
                {/* Neural Header */}
                <div className="relative overflow-hidden p-10 rounded-[3rem] bg-card/20 border border-white/5 backdrop-blur-3xl">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Users className="size-64" />
                    </div>
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                                    <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Nexus Control</span>
                                </div>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-foreground">User Terminal</h1>
                            <p className="text-muted-foreground text-base max-w-lg font-medium leading-relaxed opacity-70">
                                Real-time oversight of the PromptRouter network. Intercept balances, audit traffic, and manage user lifecycles from a unified interface.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 bg-background/40 p-2 rounded-[2rem] border border-white/5 shadow-2xl">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/30 group-focus-within:text-primary transition-all" />
                                <Input 
                                    placeholder="Search global directory..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-12 w-80 bg-transparent border-0 focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/20"
                                />
                            </div>
                            <Button className="rounded-[1.5rem] h-12 px-6 font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20">
                                <Filter className="size-4" />
                                Advanced Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Glass Command Grid */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                    <div className="relative bg-card/30 border border-white/5 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">User Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Financial Exposure</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">Network Load</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {usersQuery.data?.map((user: any) => (
                                    <tr key={user.id} className="group/row hover:bg-white/[0.02] transition-colors duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-xl uppercase shadow-lg group-hover/row:scale-110 transition-transform duration-500">
                                                    {user.email[0]}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="font-black text-foreground group-hover/row:text-primary transition-colors">{user.email}</div>
                                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                                        <Fingerprint className="size-3" />
                                                        NODE_{user.id.toString().padStart(6, '0')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                                <Activity className="size-3 animate-pulse" />
                                                Operational
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2">
                                                <div className="flex items-end gap-2">
                                                    <span className="text-xl font-black tracking-tighter text-foreground">${Number(user.balance).toFixed(2)}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Available</span>
                                                </div>
                                                <div className="w-40 h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
                                                    <div className="h-full bg-primary/40 rounded-full" style={{ width: '70%' }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-6">
                                                <div className="text-center space-y-1">
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Keys</div>
                                                    <div className="font-black text-sm">{user._count.apiKeys}</div>
                                                </div>
                                                <div className="size-1 bg-white/10 rounded-full" />
                                                <div className="text-center space-y-1">
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Calls</div>
                                                    <div className="font-black text-sm">{user._count.conversations}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
                                                <Button 
                                                    onClick={() => setSelectedUser(user)}
                                                    className="size-11 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-lg border border-primary/20"
                                                >
                                                    <Coins className="size-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-11 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                                    <ExternalLink className="size-5 text-muted-foreground/40" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Neural Action Panel (Drawer Style) */}
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-end p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-500">
                        <Card className="w-full max-w-xl h-full border-white/10 bg-card/80 backdrop-blur-3xl shadow-[0_0_100px_-12px_rgba(var(--primary),0.2)] animate-in slide-in-from-right duration-700 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <div className="p-12 h-full flex flex-col">
                                <div className="space-y-8 flex-1">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">Financial Override</div>
                                        <h2 className="text-4xl font-black tracking-tighter text-foreground">Manual Recharge</h2>
                                        <p className="text-muted-foreground font-medium opacity-60">Adjusting cryptographic balance for {selectedUser.email}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-2">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Current Exposure</div>
                                            <div className="text-2xl font-black text-foreground">${Number(selectedUser.balance).toFixed(2)}</div>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-2">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Load Metrics</div>
                                            <div className="text-2xl font-black text-primary">{selectedUser._count.conversations} CALLS</div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-8 border-t border-white/5">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Recharge Amount ($ USD)</label>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                                <Input 
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={topupAmount}
                                                    onChange={(e) => setTopupAmount(e.target.value)}
                                                    className="relative h-20 bg-white/5 border-white/10 rounded-2xl font-black text-4xl text-center focus-visible:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Protocol Reason</label>
                                            <Input 
                                                placeholder="Enter administrative justification..."
                                                value={topupReason}
                                                onChange={(e) => setTopupReason(e.target.value)}
                                                className="h-14 bg-white/5 border-white/10 rounded-2xl font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-10 border-t border-white/5">
                                    <Button 
                                        variant="ghost" 
                                        className="flex-1 h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/5"
                                        onClick={() => setSelectedUser(null)}
                                    >
                                        Abort
                                    </Button>
                                    <Button 
                                        disabled={!topupAmount || isProcessing}
                                        className="flex-[2] h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs gap-3 shadow-2xl shadow-primary/20"
                                        onClick={handleTopup}
                                    >
                                        {isProcessing ? <Zap className="size-5 animate-spin" /> : <CreditCard className="size-5" />}
                                        Execute Recharge
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function Fingerprint(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.02-.3 3" />
      <path d="M14 13.12c0 2.38 0 4.38-.14 4.38-.13 0-.13-2-.13-4.38" />
      <path d="M18 11c0-4.42-3.58-8-8-8a8.01 8.01 0 0 0-8 8" />
      <path d="M2 11c0 8.84 7.16 16 16 16" />
      <path d="M7 11c0-2.76 2.24-5 5-5s5 2.24 5 5" />
      <path d="M11 11a1 1 0 0 0-1 1v2c0 1.02-.1 2.02-.3 3" />
      <path d="M15 11c0 3.31-2.69 6-6 6" />
    </svg>
  )
}
