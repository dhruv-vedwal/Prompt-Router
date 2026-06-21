import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, Search, Coins, CreditCard, Zap, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { useDebounce } from "@/hooks/use-debounce";

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

    const users = usersQuery.data ?? [];

    return (
        <DashboardLayout>
            {/* Topup modal */}
            {selectedUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-md rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-[14.5px] font-[600] m-0">Manual Recharge</h3>
                            <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                Adjusting balance for <strong>{selectedUser.email}</strong>
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-[8px]" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                                    <p className="text-[11px] font-[600] uppercase tracking-[0.05em] m-0 mb-1" style={{ color: "var(--foreground-3)" }}>Current Balance</p>
                                    <p className="text-[20px] font-[600] m-0 tabular-nums">${Number(selectedUser.balance).toFixed(2)}</p>
                                </div>
                                <div className="p-3 rounded-[8px]" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                                    <p className="text-[11px] font-[600] uppercase tracking-[0.05em] m-0 mb-1" style={{ color: "var(--foreground-3)" }}>Sessions</p>
                                    <p className="text-[20px] font-[600] m-0 tabular-nums">{selectedUser._count.conversations}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Amount (credits)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={topupAmount}
                                    onChange={e => setTopupAmount(e.target.value)}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Reason</label>
                                <input
                                    placeholder="Administrative justification"
                                    value={topupReason}
                                    onChange={e => setTopupReason(e.target.value)}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!topupAmount || isProcessing}
                                    onClick={handleTopup}
                                    className="flex-[2] h-9 rounded-[6px] text-[12.5px] font-[500] text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    style={{ background: "var(--accent-blue)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                                >
                                    {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                                    Execute recharge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">Manage Users</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Real-time oversight of all PromptRouter users.
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between gap-3 px-[18px] py-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="text-[14.5px] font-[600] m-0">All users</h2>
                    <div className="flex items-center gap-[7px] h-[30px] px-[9px] rounded-[6px] w-[200px]" style={{ border: "1px solid var(--border)", background: "var(--background)" }}>
                        <Search className="size-[13px] flex-none" style={{ color: "var(--foreground-3)" }} />
                        <input
                            placeholder="Search users…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent border-0 outline-none text-[12px]"
                            style={{ color: "var(--foreground)" }}
                        />
                    </div>
                </div>

                {usersQuery.isLoading ? (
                    <div className="py-12 flex items-center justify-center gap-2" style={{ color: "var(--foreground-3)" }}>
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-[13px]">Loading users…</span>
                    </div>
                ) : (
                    <table className="w-full" style={{ borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                {["User", "Balance", "API Keys", "Sessions", "Role", ""].map((col, i) => (
                                    <th key={i} className={`px-[18px] py-[9px] text-[11.5px] font-[600] text-left ${i === 5 ? "w-[80px]" : ""}`} style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-[18px] py-12 text-center text-[13px]" style={{ color: "var(--foreground-3)" }}>
                                        <Users className="size-7 mx-auto mb-2 opacity-20" />
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user: any, idx: number) => (
                                    <tr
                                        key={user.id}
                                        style={{ borderBottom: idx === users.length - 1 ? "none" : "1px solid var(--border)" }}
                                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
                                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                                    >
                                        <td className="px-[18px] py-[13px]">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="size-7 rounded-full flex items-center justify-center text-[11px] font-[700] flex-none uppercase"
                                                    style={{ background: "rgba(62,99,221,0.1)", border: "1px solid rgba(62,99,221,0.2)", color: "#7C96EE" }}
                                                >
                                                    {user.email[0]}
                                                </div>
                                                <span className="text-[13px] font-[500]">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-[18px] py-[13px] text-[13px] tabular-nums" style={{ color: "var(--foreground-2)" }}>
                                            ${Number(user.balance).toFixed(2)}
                                        </td>
                                        <td className="px-[18px] py-[13px] text-[13px] tabular-nums" style={{ color: "var(--foreground-2)" }}>
                                            {user._count.apiKeys}
                                        </td>
                                        <td className="px-[18px] py-[13px] text-[13px] tabular-nums" style={{ color: "var(--foreground-2)" }}>
                                            {user._count.conversations}
                                        </td>
                                        <td className="px-[18px] py-[13px]">
                                            <span
                                                className="text-[11px] font-[500] px-2 py-0.5 rounded-[4px]"
                                                style={{
                                                    background: user.role === "ADMIN" ? "rgba(245,166,35,0.1)" : "rgba(62,179,95,0.1)",
                                                    color: user.role === "ADMIN" ? "#F5A623" : "#3EB35F",
                                                }}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-[18px] py-[13px] text-right">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-[12px] font-[500] transition-colors"
                                                style={{ border: "1px solid var(--border)", color: "var(--foreground-2)" }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--foreground-2)"; }}
                                            >
                                                <Coins className="size-3" />
                                                Top up
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}

                <div className="px-[18px] py-[10px] text-[12px]" style={{ color: "var(--foreground-3)" }}>
                    {users.length} user{users.length !== 1 ? "s" : ""}
                </div>
            </div>
        </DashboardLayout>
    );
}
