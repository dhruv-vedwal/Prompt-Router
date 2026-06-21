import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Coins, Plus, Loader2, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

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
        queryFn: async () => {
            const response = await elysiaClient["auth"].profile.get();
            if (response.error) throw new Error("Error while fetching user details");
            return response.data;
        },
    });

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
    const totalCreditsUsed = apiKeys.reduce((sum, k) => sum + Number(k.creditsConsumed ?? 0), 0);
    const balance = Number(userProfileQuery.data?.balance ?? 0);

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">Credits</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Monitor your balance and top up your account.
                    </p>
                </div>
            </div>

            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-[10px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[12.5px]" style={{ color: "var(--foreground-2)" }}>Available credits</span>
                        <div
                            className="size-7 rounded-[6px] flex items-center justify-center"
                            style={{ background: "rgba(62,99,221,0.12)", border: "1px solid rgba(62,99,221,0.2)" }}
                        >
                            <TrendingUp className="size-3.5" style={{ color: "#7C96EE" }} />
                        </div>
                    </div>
                    <div className="text-[28px] font-[600] tracking-[-0.01em]">
                        {userProfileQuery.isLoading ? (
                            <Loader2 className="size-5 animate-spin" style={{ color: "var(--foreground-3)" }} />
                        ) : (
                            balance.toLocaleString()
                        )}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: "var(--foreground-3)" }}>
                        Across {apiKeys.length} environment{apiKeys.length !== 1 ? "s" : ""}
                    </div>
                </div>

                <div className="rounded-[10px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[12.5px]" style={{ color: "var(--foreground-2)" }}>Credits used</span>
                        <div
                            className="size-7 rounded-[6px] flex items-center justify-center"
                            style={{ background: "rgba(62,179,95,0.1)", border: "1px solid rgba(62,179,95,0.2)" }}
                        >
                            <Coins className="size-3.5" style={{ color: "#3EB35F" }} />
                        </div>
                    </div>
                    <div className="text-[28px] font-[600] tracking-[-0.01em]">
                        {apiKeysQuery.isLoading ? (
                            <Loader2 className="size-5 animate-spin" style={{ color: "var(--foreground-3)" }} />
                        ) : (
                            totalCreditsUsed.toLocaleString()
                        )}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: "var(--foreground-3)" }}>
                        Across all keys
                    </div>
                </div>
            </div>

            {/* Per-key breakdown */}
            {apiKeys.length > 0 && (
                <div className="mb-3 rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="px-[18px] py-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                        <h2 className="text-[14.5px] font-[600] m-0">Usage by key</h2>
                    </div>
                    <table className="w-full" style={{ borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                {["Key name", "Credits consumed", "Status"].map((col, i) => (
                                    <th
                                        key={i}
                                        className={`px-[18px] py-[9px] text-[11.5px] font-[600] ${i === 1 ? "text-right" : "text-left"}`}
                                        style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {apiKeys.map((key, idx) => (
                                <tr
                                    key={key.id}
                                    style={{
                                        borderBottom: idx === apiKeys.length - 1 ? "none" : "1px solid var(--border)",
                                    }}
                                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
                                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                                >
                                    <td className="px-[18px] py-[13px] text-[13px] font-[500]">{key.name}</td>
                                    <td className="px-[18px] py-[13px] text-[13px] text-right tabular-nums" style={{ color: "var(--foreground-2)" }}>
                                        {Number(key.creditsConsumed ?? 0).toLocaleString()}
                                    </td>
                                    <td className="px-[18px] py-[13px]">
                                        <span className="flex items-center gap-[7px] text-[13px]" style={{ color: "var(--foreground-2)" }}>
                                            <span className="size-[6px] rounded-full" style={{ background: key.disabled ? "var(--foreground-3)" : "var(--success)" }} />
                                            {key.disabled ? "Disabled" : "Active"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Top-up section */}
            <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="px-[18px] py-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="text-[14.5px] font-[600] m-0">Top up account</h2>
                    <p className="text-[13px] m-0 mt-0.5" style={{ color: "var(--foreground-2)" }}>
                        Select a credit bundle to increase your quota.
                    </p>
                </div>

                <div className="p-[18px] space-y-4">
                    {/* Bundle option */}
                    <div
                        className="flex items-center gap-4 p-4 rounded-[8px] transition-colors"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                        <div
                            className="size-10 rounded-[8px] flex items-center justify-center flex-none"
                            style={{ background: "rgba(62,99,221,0.12)", border: "1px solid rgba(62,99,221,0.2)" }}
                        >
                            <Plus className="size-5" style={{ color: "#7C96EE" }} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[14px] font-[600] m-0">1,000 Credits</p>
                            <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-2)" }}>Standard top-up bundle</p>
                        </div>
                        <button
                            onClick={() => onrampMutation.mutate()}
                            disabled={onrampMutation.isPending}
                            className="flex items-center gap-2 h-9 px-5 rounded-[6px] text-[12.5px] font-[500] text-white transition-colors disabled:opacity-50 flex-none"
                            style={{ background: "var(--accent-blue)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                        >
                            {onrampMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                            {onrampMutation.isPending ? "Processing…" : "Buy credits"}
                        </button>
                    </div>

                    {/* Success banner */}
                    {onrampMutation.isSuccess && (
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-[8px] text-[13px]"
                            style={{ background: "rgba(62,179,95,0.08)", border: "1px solid rgba(62,179,95,0.2)", color: "#3EB35F" }}
                        >
                            <CheckCircle2 className="size-4 flex-none" />
                            <span>
                                <strong>Success!</strong> 1,000 credits added. New balance:{" "}
                                <strong>{Number(onrampMutation.data?.credits ?? 0).toLocaleString()}</strong>
                            </span>
                        </div>
                    )}

                    {/* Error banner */}
                    {onrampMutation.isError && (
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-[8px] text-[13px]"
                            style={{ background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)", color: "#e5484d" }}
                        >
                            <AlertCircle className="size-4 flex-none" />
                            {onrampMutation.error?.message || "Failed to add credits. Please try again."}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
