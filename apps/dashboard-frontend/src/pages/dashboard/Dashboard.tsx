import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Link, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { Copy, Check, MoreVertical, Plus, Search, Loader2, AlertCircle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
    return (
        <div
            className="rounded-[10px] p-4"
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
            }}
        >
            <div className="text-[12.5px] mb-[10px]" style={{ color: "var(--foreground-2)" }}>{label}</div>
            <div className="text-[28px] font-[600] tracking-[-0.01em] leading-tight">{value}</div>
            <div className="text-[12px] mt-1" style={{ color: "var(--foreground-3)" }}>{sub}</div>
        </div>
    );
}

export function Dashboard() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filterText, setFilterText] = useState("");
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

    const apiKeysQuery = useQuery({
        queryKey: ["api-keys"],
        queryFn: async () => {
            const response = await elysiaClient["api-keys"].get();
            if (response.error) throw new Error("Failed to fetch API keys");
            return response.data;
        },
    });

    const modelsQuery = useQuery({
        queryKey: ["models"],
        queryFn: async () => {
            const response = await elysiaClient.models.get();
            if (response.error) throw new Error("Failed to fetch models");
            return response.data;
        },
    });

    const apiKeys = apiKeysQuery.data?.apiKeys ?? [];
    const activeKeys = apiKeys.filter((k) => !k.disabled);
    const totalCreditsUsed = apiKeys.reduce((sum, k) => sum + Number(k.creditsConsumed ?? 0), 0);
    const modelCount = modelsQuery.data?.models?.length ?? 0;
    const providerCount = new Set(
        (modelsQuery.data?.models ?? []).flatMap((m: any) =>
            m.modelProviderMappings?.map((mp: any) => mp.provider?.id) ?? []
        )
    ).size;

    const filteredKeys = apiKeys.filter(k =>
        k.name.toLowerCase().includes(filterText.toLowerCase())
    );

    const createKey = async () => {
        if (!newKeyName.trim() || isCreating) return;
        setIsCreating(true);
        try {
            const response = await elysiaClient["api-keys"].post({ name: newKeyName });
            if (response.error) throw new Error("Failed to create key");
            setRevealedKey(response.data.apiKey);
            setNewKeyName("");
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const deleteKey = async (id: string) => {
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
        if (key.length < 12) return "••••••••";
        return `${key.substring(0, 12)}…${key.slice(-4)}`;
    };

    return (
        <DashboardLayout>
            {/* Reveal-once modal */}
            {revealedKey && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div
                        className="w-full max-w-lg rounded-[10px] overflow-hidden"
                        style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}
                    >
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-3">
                                <div
                                    className="size-9 rounded-[8px] flex items-center justify-center flex-none"
                                    style={{ background: "rgba(62,99,221,0.14)", border: "1px solid rgba(62,99,221,0.25)" }}
                                >
                                    <Zap className="size-4" style={{ color: "#7C96EE" }} />
                                </div>
                                <div>
                                    <h3 className="text-[14.5px] font-[600]">Key generated successfully</h3>
                                    <p className="text-[12px]" style={{ color: "var(--foreground-3)" }}>Copy it now — it won't be shown again.</p>
                                </div>
                            </div>

                            <div
                                className="flex items-center gap-3 px-3 py-3 rounded-[8px]"
                                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                            >
                                <AlertCircle className="size-4 flex-none" style={{ color: "#F5A623" }} />
                                <p className="text-[12px]" style={{ color: "#F5A623" }}>
                                    Store this key securely. It cannot be recovered.
                                </p>
                            </div>

                            <div
                                className="flex items-center gap-2 p-3 rounded-[8px]"
                                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                            >
                                <code
                                    className="flex-1 text-[12px] truncate select-all"
                                    style={{ fontFamily: "var(--font-mono)", color: "#7C96EE" }}
                                >
                                    {revealedKey}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(revealedKey)}
                                    className="size-7 flex-none flex items-center justify-center rounded-[6px] transition-colors"
                                    style={{ color: "var(--foreground-3)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    {copiedKey === revealedKey ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                </button>
                            </div>

                            <button
                                onClick={() => setRevealedKey(null)}
                                className="w-full h-9 rounded-[6px] text-[12.5px] font-[500] text-white transition-colors"
                                style={{ background: "var(--accent-blue)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                            >
                                I've saved my key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">Dashboard</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Overview of your PromptRouter account.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-[6px] h-8 px-[13px] rounded-[6px] text-[12.5px] font-[500] text-white transition-colors flex-none"
                    style={{ background: "var(--accent-blue)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                >
                    <Plus className="size-[14px]" />
                    Create API key
                </button>
            </div>

            {/* Create key inline form */}
            {showCreateForm && (
                <div
                    className="mb-3 p-4 rounded-[10px] flex items-center gap-3"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <input
                        autoFocus
                        placeholder="Key name (e.g. Production)"
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") createKey(); if (e.key === "Escape") setShowCreateForm(false); }}
                        className="flex-1 bg-transparent border-0 outline-none text-[13px]"
                        style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
                    />
                    <button
                        onClick={createKey}
                        disabled={isCreating || !newKeyName.trim()}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-[12px] font-[500] text-white transition-colors disabled:opacity-50"
                        style={{ background: "var(--accent-blue)" }}
                    >
                        {isCreating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                        Create
                    </button>
                    <button
                        onClick={() => setShowCreateForm(false)}
                        className="h-8 px-3 rounded-[6px] text-[12px] font-[500] transition-colors"
                        style={{ color: "var(--foreground-2)", border: "1px solid var(--border-2)" }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-3">
                <StatCard
                    label="Active API keys"
                    value={apiKeysQuery.isLoading ? <Loader2 className="size-5 animate-spin" style={{ color: "var(--foreground-3)" }} /> : activeKeys.length}
                    sub={`${apiKeys.length} total`}
                />
                <StatCard
                    label="Credits used"
                    value={apiKeysQuery.isLoading ? <Loader2 className="size-5 animate-spin" style={{ color: "var(--foreground-3)" }} /> : totalCreditsUsed.toLocaleString()}
                    sub="Across all keys"
                />
                <StatCard
                    label="Available models"
                    value={modelsQuery.isLoading ? <Loader2 className="size-5 animate-spin" style={{ color: "var(--foreground-3)" }} /> : modelCount}
                    sub={`From ${providerCount} provider${providerCount !== 1 ? "s" : ""}`}
                />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <div
                    className="flex items-center gap-[14px] rounded-[10px] p-4 cursor-pointer transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    onClick={() => setShowCreateForm(true)}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
                >
                    <div
                        className="size-[34px] flex-none rounded-[8px] flex items-center justify-center"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" style={{ color: "var(--foreground-2)" }}>
                            <circle cx="7" cy="15" r="3.2"/><path d="M9.4 12.6L19 3M19 3v4M19 3h-4"/>
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[13.5px] font-[600] m-0 mb-0.5">Create an API key</h3>
                        <p className="text-[12px] m-0" style={{ color: "var(--foreground-2)" }}>Generate a new key to start making requests.</p>
                    </div>
                    <button
                        className="flex items-center h-7 px-[10px] rounded-[6px] text-[12px] font-[500] transition-colors flex-none"
                        style={{ border: "1px solid var(--border-2)", color: "var(--foreground)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={e => { e.stopPropagation(); setShowCreateForm(true); }}
                    >
                        Create
                    </button>
                </div>

                <Link
                    to="/credits"
                    className="flex items-center gap-[14px] rounded-[10px] p-4 cursor-pointer transition-all no-underline"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "inherit" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
                >
                    <div
                        className="size-[34px] flex-none rounded-[8px] flex items-center justify-center"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" style={{ color: "var(--foreground-2)" }}>
                            <rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/>
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[13.5px] font-[600] m-0 mb-0.5">Add credits</h3>
                        <p className="text-[12px] m-0" style={{ color: "var(--foreground-2)" }}>Top up your balance to keep making requests.</p>
                    </div>
                    <button
                        className="flex items-center h-7 px-[10px] rounded-[6px] text-[12px] font-[500] transition-colors flex-none"
                        style={{ border: "1px solid var(--border-2)", color: "var(--foreground)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                        Add credits
                    </button>
                </Link>
            </div>

            {/* API Keys Table */}
            <div
                className="rounded-[10px] overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                {/* Toolbar */}
                <div
                    className="flex items-center justify-between gap-3 px-[18px] py-[14px]"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <h2 className="text-[14.5px] font-[600] m-0">API keys</h2>
                    <div className="flex items-center gap-2">
                        {/* Filter input */}
                        <div
                            className="flex items-center gap-[7px] h-[30px] px-[9px] rounded-[6px] w-[180px]"
                            style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground-3)" }}
                        >
                            <Search className="size-[13px] flex-none" />
                            <input
                                placeholder="Filter keys"
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                className="flex-1 bg-transparent border-0 outline-none text-[12px]"
                                style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
                            />
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-[6px] h-[28px] px-[10px] rounded-[6px] text-[12px] font-[500] transition-colors"
                            style={{ border: "1px solid var(--border-2)", color: "var(--foreground)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            <Plus className="size-[14px]" />
                            Create
                        </button>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th className="text-left px-[18px] py-[9px] text-[11.5px] font-[600] whitespace-nowrap" style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}>Name</th>
                            <th className="text-left px-[18px] py-[9px] text-[11.5px] font-[600] whitespace-nowrap" style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}>Key</th>
                            <th className="text-left px-[18px] py-[9px] text-[11.5px] font-[600] whitespace-nowrap" style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}>Status</th>
                            <th className="text-left px-[18px] py-[9px] text-[11.5px] font-[600] whitespace-nowrap" style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}>Created</th>
                            <th className="text-right px-[18px] py-[9px] text-[11.5px] font-[600] whitespace-nowrap" style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}>Credits used</th>
                            <th className="w-[32px]" style={{ borderBottom: "1px solid var(--border)" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {apiKeysQuery.isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-[18px] py-8 text-center text-[13px]" style={{ color: "var(--foreground-3)" }}>
                                    <Loader2 className="size-4 animate-spin inline mr-2" />Loading…
                                </td>
                            </tr>
                        ) : filteredKeys.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-[18px] py-8 text-center text-[13px]" style={{ color: "var(--foreground-3)" }}>
                                    {apiKeys.length === 0 ? "No API keys yet. Create one to get started." : "No keys match your filter."}
                                </td>
                            </tr>
                        ) : (
                            filteredKeys.map((key, idx) => (
                                <TableRow
                                    key={key.id}
                                    row={key}
                                    isLast={idx === filteredKeys.length - 1}
                                    copiedKey={copiedKey}
                                    onCopy={copyToClipboard}
                                    onDelete={() => setKeyToDelete(key.id)}
                                    maskKey={maskKey}
                                />
                            ))
                        )}
                    </tbody>
                </table>

                <div className="px-[18px] py-[10px] text-[12px]" style={{ color: "var(--foreground-3)" }}>
                    Showing {filteredKeys.length} of {apiKeys.length} key{apiKeys.length !== 1 ? "s" : ""}
                </div>
            </div>
            {keyToDelete !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-sm rounded-[10px] overflow-hidden shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="p-6 space-y-4">
                            <h3 className="text-[14.5px] font-[600] m-0">Delete API Key</h3>
                            <p className="text-[12.5px] m-0 leading-relaxed" style={{ color: "var(--foreground-2)" }}>
                                Are you sure you want to delete this API key? Any applications currently using it will fail to authenticate.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setKeyToDelete(null)}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        deleteKey(keyToDelete);
                                        setKeyToDelete(null);
                                    }}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] text-white transition-colors"
                                    style={{ background: "var(--destructive)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#cf3c41")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--destructive)")}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function TableRow({
    row,
    isLast,
    copiedKey,
    onCopy,
    onDelete,
    maskKey,
}: {
    row: any;
    isLast: boolean;
    copiedKey: string | null;
    onCopy: (s: string) => void;
    onDelete: () => void;
    maskKey: (s: string) => string;
}) {
    const [hovered, setHovered] = useState(false);

    const createdDate = row.createdAt
        ? new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—";

    return (
        <tr
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                borderBottom: isLast ? "none" : "1px solid var(--border)",
                background: hovered ? "rgba(255,255,255,0.045)" : "transparent",
                transition: "background 0.1s ease",
            }}
        >
            <td className="px-[18px] py-[13px] text-[13px] font-[500]">{row.name}</td>
            <td className="px-[18px] py-[13px]">
                <div className="flex items-center gap-[7px]" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--foreground-2)" }}>
                    {maskKey(row.apiKey)}
                    <button
                        onClick={() => onCopy(row.apiKey)}
                        className="transition-all"
                        style={{ opacity: hovered ? 1 : 0, color: "var(--foreground-3)" }}
                    >
                        {copiedKey === row.apiKey ? <Check className="size-[13px]" /> : <Copy className="size-[13px]" />}
                    </button>
                </div>
            </td>
            <td className="px-[18px] py-[13px]">
                <span className="flex items-center gap-[7px] text-[13px]" style={{ color: "var(--foreground-2)" }}>
                    <span
                        className="size-[6px] rounded-full flex-none"
                        style={{ background: row.disabled ? "var(--foreground-3)" : "var(--success)" }}
                    />
                    {row.disabled ? "Disabled" : "Active"}
                </span>
            </td>
            <td className="px-[18px] py-[13px] text-[13px]" style={{ color: "var(--foreground-2)" }}>{createdDate}</td>
            <td className="px-[18px] py-[13px] text-right text-[13px] tabular-nums" style={{ color: "var(--foreground-2)" }}>
                {Number(row.creditsConsumed ?? 0).toLocaleString()}
            </td>
            <td className="pr-[18px] py-[13px] text-right">
                <button
                    onClick={onDelete}
                    className="size-[24px] inline-flex items-center justify-center rounded-[5px] transition-all"
                    style={{
                        color: "var(--foreground-3)",
                        opacity: hovered ? 1 : 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    title="Delete key"
                >
                    <MoreVertical className="size-[15px]" />
                </button>
            </td>
        </tr>
    );
}
