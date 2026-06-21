import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Building2, Plus, Loader2, ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function ManageCompanies() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newCompany, setNewCompany] = useState({ name: "", website: "" });

    const companiesQuery = useQuery({
        queryKey: ["admin-companies"],
        queryFn: async () => {
            const response = await elysiaClient.models.companies.get();
            if (response.error) throw new Error("Failed to fetch companies");
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof newCompany) => {
            const response = await elysiaClient.models.companies.post(data);
            if (response.error) throw new Error("Failed to create company");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
            setShowCreate(false);
            setNewCompany({ name: "", website: "" });
        },
    });

    const companies = companiesQuery.data?.companies ?? [];
    const debouncedSearch = useDebounce(search, 300);
    const filtered = companies.filter(c =>
        c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">Manage Companies</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Register model creators and infrastructure providers.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(v => !v)}
                    className="flex items-center gap-[6px] h-8 px-[13px] rounded-[6px] text-[12.5px] font-[500] text-white transition-colors flex-none"
                    style={{ background: "var(--accent-blue)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                >
                    <Plus className="size-[14px]" />
                    Add Company
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="mb-3 p-4 rounded-[10px] space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                    <h3 className="text-[14px] font-[600] m-0">Register Company</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Company Name</label>
                            <input
                                placeholder="e.g. Anthropic"
                                value={newCompany.name}
                                onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))}
                                className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Website</label>
                            <input
                                placeholder="https://anthropic.com"
                                value={newCompany.website}
                                onChange={e => setNewCompany(p => ({ ...p, website: e.target.value }))}
                                className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowCreate(false)} className="h-8 px-4 rounded-[6px] text-[12px] transition-colors" style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}>Cancel</button>
                        <button
                            disabled={createMutation.isPending || !newCompany.name || !newCompany.website}
                            onClick={() => createMutation.mutate(newCompany)}
                            className="flex items-center gap-1.5 h-8 px-4 rounded-[6px] text-[12px] font-[500] text-white transition-colors disabled:opacity-50"
                            style={{ background: "var(--accent-blue)" }}
                        >
                            {createMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                            Register
                        </button>
                    </div>
                </div>
            )}

            {/* Table section */}
            <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between gap-3 px-[18px] py-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="text-[14.5px] font-[600] m-0">All companies</h2>
                    <div className="flex items-center gap-[7px] h-[30px] px-[9px] rounded-[6px] w-[200px]" style={{ border: "1px solid var(--border)", background: "var(--background)" }}>
                        <Search className="size-[13px] flex-none" style={{ color: "var(--foreground-3)" }} />
                        <input
                            placeholder="Search…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent border-0 outline-none text-[12px]"
                            style={{ color: "var(--foreground)" }}
                        />
                    </div>
                </div>

                {companiesQuery.isLoading ? (
                    <div className="py-12 flex items-center justify-center gap-2" style={{ color: "var(--foreground-3)" }}>
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-[13px]">Loading…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center">
                        <Building2 className="size-8 mx-auto mb-3 opacity-20" />
                        <p className="text-[13px]" style={{ color: "var(--foreground-3)" }}>
                            {companies.length === 0 ? "No companies yet." : "No companies match your search."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full" style={{ borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                {["Name", "Website", ""].map((col, i) => (
                                    <th key={i} className={`px-[18px] py-[9px] text-[11.5px] font-[600] text-left ${i === 2 ? "w-[40px]" : ""}`} style={{ color: "var(--foreground-3)", borderBottom: "1px solid var(--border)" }}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((company, idx) => (
                                <tr
                                    key={company.id}
                                    style={{ borderBottom: idx === filtered.length - 1 ? "none" : "1px solid var(--border)" }}
                                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
                                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                                >
                                    <td className="px-[18px] py-[13px] text-[13px] font-[500]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-7 rounded-[6px] flex items-center justify-center flex-none" style={{ background: "rgba(62,99,221,0.1)", border: "1px solid rgba(62,99,221,0.2)" }}>
                                                <Building2 className="size-3.5" style={{ color: "#7C96EE" }} />
                                            </div>
                                            {company.name}
                                        </div>
                                    </td>
                                    <td className="px-[18px] py-[13px] text-[13px]" style={{ color: "var(--foreground-2)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>{company.website}</td>
                                    <td className="px-[18px] py-[13px] text-right">
                                        <a href={company.website} target="_blank" rel="noreferrer" className="size-7 inline-flex items-center justify-center rounded-[5px] transition-colors" style={{ color: "var(--foreground-3)" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="px-[18px] py-[10px] text-[12px]" style={{ color: "var(--foreground-3)" }}>
                    {filtered.length} of {companies.length} company{companies.length !== 1 ? "ies" : "y"}
                </div>
            </div>
        </DashboardLayout>
    );
}
