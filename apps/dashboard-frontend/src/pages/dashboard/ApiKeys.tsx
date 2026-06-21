import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { useDebounce } from "@/hooks/use-debounce";
import { Copy, Check, Plus, Search, Loader2, AlertCircle, Zap, MoreVertical } from "lucide-react";

export function ApiKeys() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();

    const apiKeysQuery = useQuery({
        queryKey: ["api-keys", debouncedSearch],
        queryFn: async () => {
            const response = await elysiaClient["api-keys"].get();
            if (response.error) throw new Error("Failed to fetch keys");
            return response.data;
        },
    });

    const createKey = async () => {
        if (!newKeyName.trim() || isCreating) return;
        setIsCreating(true);
        try {
            const response = await elysiaClient["api-keys"].post({ name: newKeyName });
            if (response.error) throw new Error("Failed to create key");
            setRevealedKey(response.data.apiKey);
            setNewKeyName("");
            setShowCreate(false);
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

    const allKeys = apiKeysQuery.data?.apiKeys ?? [];
    const filteredKeys = allKeys.filter(k =>
        k.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

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
                                    <h3 className="text-[14.5px] font-[600] m-0">Key generated</h3>
                                    <p className="text-[12px] m-0" style={{ color: "var(--foreground-3)" }}>Copy it now — it won't be shown again.</p>
                                </div>
                            </div>

                            <div
                                className="flex items-center gap-3 px-3 py-3 rounded-[8px]"
                                style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}
                            >
                                <AlertCircle className="size-4 flex-none" style={{ color: "#F5A623" }} />
                                <p className="text-[12px] m-0" style={{ color: "#F5A623" }}>
                                    This is the only time you'll see the full key. Store it in a secure place.
                                </p>
                            </div>

                            <div
                                className="flex items-center gap-2 p-3 rounded-[8px] group"
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
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">API Keys</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Manage credentials for your applications and scripts.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-[6px] h-8 px-[13px] rounded-[6px] text-[12.5px] font-[500] text-white transition-colors flex-none"
                    style={{ background: "var(--accent-blue)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                >
                    <Plus className="size-[14px]" />
                    Create API key
                </button>
            </div>

            {/* Inline create form */}
            {showCreate && (
                <div
                    className="mb-3 p-4 rounded-[10px] flex items-center gap-3"
                    style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}
                >
                    <input
                        autoFocus
                        placeholder="Key name (e.g. Production Mobile App)"
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") createKey(); if (e.key === "Escape") setShowCreate(false); }}
                        className="flex-1 bg-transparent border-0 outline-none text-[13px]"
                        style={{ color: "var(--foreground)" }}
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
                        onClick={() => setShowCreate(false)}
                        className="h-8 px-3 rounded-[6px] text-[12px] font-[500] transition-colors"
                        style={{ color: "var(--foreground-2)", border: "1px solid var(--border-2)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Table section */}
            <div
                className="rounded-[10px] overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                {/* Toolbar */}
                <div
                    className="flex items-center justify-between gap-3 px-[18px] py-[14px]"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <h2 className="text-[14.5px] font-[600] m-0">All keys</h2>
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center gap-[7px] h-[30px] px-[9px] rounded-[6px] w-[180px]"
                            style={{ border: "1px solid var(--border)", background: "var(--background)" }}
                        >
                            <Search className="size-[13px] flex-none" style={{ color: "var(--foreground-3)" }} />
                            <input
                                placeholder="Filter keys"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="flex-1 bg-transparent border-0 outline-none text-[12px]"
                                style={{ color: "var(--foreground)" }}
                            />
                        </div>
                        <button
                            onClick={() => setShowCreate(true)}
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

                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            {["Name", "Key", "Status", "Created", "Last used", "Credits used", ""].map((col, i) => (
                                <th
                                    key={i}
                                    className={`px-[18px] py-[9px] text-[11.5px] font-[600] whitespace-nowrap ${i === 5 ? "text-right" : "text-left"} ${i === 6 ? "w-[32px]" : ""}`}
                                    style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {apiKeysQuery.isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-[18px] py-8 text-center text-[13px]" style={{ color: "var(--foreground-3)" }}>
                                    <Loader2 className="size-4 animate-spin inline mr-2" />Loading keys…
                                </td>
                            </tr>
                        ) : filteredKeys.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-[18px] py-16 text-center" style={{ color: "var(--foreground-3)" }}>
                                    <div className="flex flex-col items-center gap-3">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-8 opacity-30">
                                            <circle cx="7" cy="15" r="3.2"/><path d="M9.4 12.6L19 3M19 3v4M19 3h-4"/>
                                        </svg>
                                        <span className="text-[13px]">
                                            {allKeys.length === 0 ? "No API keys yet." : "No keys match your filter."}
                                        </span>
                                        {allKeys.length === 0 && (
                                            <button
                                                onClick={() => setShowCreate(true)}
                                                className="text-[12.5px] font-[500] transition-colors"
                                                style={{ color: "var(--accent-blue-text)" }}
                                            >
                                                Create your first key →
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredKeys.map((key, idx) => (
                                <KeyRow
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
                    Showing {filteredKeys.length} of {allKeys.length} key{allKeys.length !== 1 ? "s" : ""}
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

function KeyRow({
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
    const lastUsedDate = row.lastUsed
        ? new Date(row.lastUsed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Never";

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
                <div
                    className="flex items-center gap-[7px]"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--foreground-2)" }}
                >
                    {maskKey(row.apiKey)}
                    <button
                        onClick={() => onCopy(row.apiKey)}
                        style={{ opacity: hovered ? 1 : 0, color: "var(--foreground-3)", transition: "opacity 0.1s ease" }}
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
            <td className="px-[18px] py-[13px] text-[13px]" style={{ color: "var(--foreground-2)" }}>{lastUsedDate}</td>
            <td className="px-[18px] py-[13px] text-right text-[13px] tabular-nums" style={{ color: "var(--foreground-2)" }}>
                {Number(row.creditsConsumed ?? 0).toLocaleString()}
            </td>
            <td className="pr-[18px] py-[13px] text-right">
                <button
                    onClick={onDelete}
                    title="Delete key"
                    className="size-[24px] inline-flex items-center justify-center rounded-[5px] transition-all"
                    style={{
                        color: "var(--foreground-3)",
                        opacity: hovered ? 1 : 0,
                        transition: "opacity 0.1s ease, background 0.1s ease",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                    <MoreVertical className="size-[15px]" />
                </button>
            </td>
        </tr>
    );
}
