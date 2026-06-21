import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Plus,
    Loader2,
    ExternalLink,
    ShieldAlert,
    Cpu,
    Trash2,
    Search,
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function ManageProviders() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [newProvider, setNewProvider] = useState({
        name: "",
        website: "",
    });

    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<any>(null);
    const [providerToDelete, setProviderToDelete] = useState<any>(null);

    // Mapping Form State
    const [newMapping, setNewMapping] = useState({
        modelId: "",
        inputTokenCost: 0,
        outputTokenCost: 0,
    });

    const providersQuery = useQuery({
        queryKey: ["admin-providers"],
        queryFn: async () => {
            const response = await elysiaClient.models.providers.get();
            if (response.error) throw new Error("Failed to fetch providers");
            return response.data;
        },
    });

    const modelsQuery = useQuery({
        queryKey: ["admin-models"],
        queryFn: async () => {
            const response = await elysiaClient.models.get();
            if (response.error) throw new Error("Failed to fetch models");
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof newProvider) => {
            const response = await elysiaClient.models.providers.post(data);
            if (response.error) throw new Error("Failed to create provider");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
            setIsCreateModalOpen(false);
            setNewProvider({ name: "", website: "" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await elysiaClient.models.providers({ id }).delete();
            if (response.error) throw new Error("Failed to delete provider");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
        },
    });

    const mappingMutation = useMutation({
        mutationFn: async (data: typeof newMapping) => {
            const response = await elysiaClient.models.mapping.post({
                modelId: data.modelId,
                providerId: String(selectedProvider?.id),
                inputTokenCost: Number(data.inputTokenCost),
                outputTokenCost: Number(data.outputTokenCost)
            });
            if (response.error) throw new Error("Failed to create mapping");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
            queryClient.invalidateQueries({ queryKey: ["admin-models"] });
            setIsMappingModalOpen(false);
            setNewMapping({ modelId: "", inputTokenCost: 0, outputTokenCost: 0 });
        },
    });

    const providers = providersQuery.data?.providers ?? [];
    const filteredProviders = providers.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.website.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <DashboardLayout>
            {/* Register Provider Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-md rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-[14.5px] font-[600] m-0">Register Provider</h3>
                            <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                Onboard a new infrastructure partner to provide LLM inference.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Provider Name</label>
                                <input
                                    placeholder="e.g. Together AI"
                                    value={newProvider.name}
                                    onChange={e => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Documentation/Website</label>
                                <input
                                    placeholder="https://together.ai"
                                    value={newProvider.website}
                                    onChange={e => setNewProvider(prev => ({ ...prev, website: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={createMutation.isPending || !newProvider.name || !newProvider.website}
                                    onClick={() => createMutation.mutate(newProvider)}
                                    className="flex-[2] h-9 rounded-[6px] text-[12.5px] font-[500] text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    style={{ background: "var(--accent-blue)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                                >
                                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                    Onboard Provider
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Model Mapping Modal */}
            {isMappingModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-md rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-[14.5px] font-[600] m-0">Link Model to {selectedProvider?.name}</h3>
                            <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                Configure target model routing and cost parameters.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Target Model</label>
                                <select
                                    value={newMapping.modelId}
                                    onChange={e => setNewMapping(prev => ({ ...prev, modelId: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                >
                                    <option value="" disabled style={{ background: "var(--surface)" }}>Select model to route...</option>
                                    {modelsQuery.data?.models.map((m: any) => (
                                        <option key={m.id} value={m.id.toString()} style={{ background: "var(--surface)" }}>
                                            {m.name} ({m.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Input Cost ($/1k)</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={newMapping.inputTokenCost}
                                        onChange={e => setNewMapping(prev => ({ ...prev, inputTokenCost: parseFloat(e.target.value) || 0 }))}
                                        className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all font-mono"
                                        style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                        onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                        onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Output Cost ($/1k)</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={newMapping.outputTokenCost}
                                        onChange={e => setNewMapping(prev => ({ ...prev, outputTokenCost: parseFloat(e.target.value) || 0 }))}
                                        className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all font-mono"
                                        style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                        onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                        onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                    />
                                </div>
                            </div>

                            <div className="p-3 rounded-[6px] text-[11px]" style={{ background: "rgba(62,99,221,0.05)", border: "1px solid rgba(62,99,221,0.15)", color: "var(--foreground-2)" }}>
                                <span style={{ color: "#7C96EE", fontWeight: 600 }}>Estimated Platform Margin: 20.0% (DEFAULT)</span>
                                <p className="m-0 mt-1" style={{ color: "var(--foreground-3)" }}>
                                    The final price charged to users will include a 1.2x markup on top of these base costs to cover operational overhead.
                                </p>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setIsMappingModalOpen(false)}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={mappingMutation.isPending || !newMapping.modelId}
                                    onClick={() => mappingMutation.mutate(newMapping)}
                                    className="flex-[2] h-9 rounded-[6px] text-[12.5px] font-[500] text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    style={{ background: "var(--accent-blue)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                                >
                                    {mappingMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                    Link Model
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">Manage Providers</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Manage API endpoints and per-token pricing mappings.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-[6px] h-8 px-[13px] rounded-[6px] text-[12.5px] font-[500] text-white transition-colors flex-none"
                    style={{ background: "var(--accent-blue)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                >
                    <Plus className="size-[14px]" />
                    Add Provider
                </button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-[7px] h-8 px-[9px] rounded-[6px] w-[240px] mb-4" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <Search className="size-[13px] flex-none" style={{ color: "var(--foreground-3)" }} />
                <input
                    placeholder="Search providers or websites…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-[12px]"
                    style={{ color: "var(--foreground)" }}
                />
            </div>

            {/* Pricing Tip */}
            <div className="mb-4 p-4 rounded-[10px] flex items-start gap-3" style={{ background: "rgba(62,99,221,0.05)", border: "1px solid rgba(62,99,221,0.2)" }}>
                <ShieldAlert className="size-[16px] text-accent-blue-text mt-0.5 flex-none" />
                <div>
                    <p className="text-[13px] font-[600] m-0" style={{ color: "#7C96EE" }}>Pricing Synchronization</p>
                    <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-2)" }}>
                        Changes to input/output pricing affect all future settlements immediately. Ensure markup multipliers cover platform overhead.
                    </p>
                </div>
            </div>

            {/* Providers list */}
            {providersQuery.isLoading ? (
                <div className="py-12 flex items-center justify-center gap-2" style={{ color: "var(--foreground-3)" }}>
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-[13px]">Loading providers…</span>
                </div>
            ) : filteredProviders.length === 0 ? (
                <div className="rounded-[10px] py-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Cpu className="size-8 mx-auto mb-3 opacity-20" />
                    <p className="text-[13px] m-0" style={{ color: "var(--foreground-3)" }}>
                        {providers.length === 0 ? "No providers found." : "No providers match your search filter."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProviders.map((provider) => {
                        // Dynamically resolve linked models for this provider
                        const providerMappings = modelsQuery.data?.models.flatMap((m: any) => 
                            m.modelProviderMappings
                                .filter((mapping: any) => mapping.provider.id === provider.id)
                                .map((mapping: any) => ({
                                    ...mapping,
                                    modelName: m.name,
                                    modelSlug: m.slug
                                }))
                        ) ?? [];

                        return (
                            <div key={provider.id} className="rounded-[10px] p-5 flex flex-col justify-between" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <div>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-7 rounded-[6px] flex items-center justify-center flex-none" style={{ background: "rgba(62,99,221,0.1)", border: "1px solid rgba(62,99,221,0.2)" }}>
                                                <Cpu className="size-3.5" style={{ color: "#7C96EE" }} />
                                            </div>
                                            <div>
                                                <h3 className="text-[14px] font-[600] m-0">{provider.name}</h3>
                                                <a href={provider.website} target="_blank" rel="noreferrer" className="text-[11.5px] hover:underline inline-flex items-center gap-1 mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                                    {provider.website}
                                                    <ExternalLink className="size-2.5" />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-none">
                                            <button
                                                onClick={() => {
                                                    setSelectedProvider(provider);
                                                    setIsMappingModalOpen(true);
                                                }}
                                                className="h-7 px-2.5 rounded-[5px] text-[12px] font-[500] transition-colors"
                                                style={{ border: "1px solid var(--border)", color: "var(--foreground-2)" }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--foreground-2)"; }}
                                            >
                                                Link Model
                                            </button>
                                            <button
                                                onClick={() => setProviderToDelete(provider)}
                                                className="size-7 inline-flex items-center justify-center rounded-[5px] transition-colors"
                                                style={{ color: "var(--foreground-3)" }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(229,72,77,0.15)"; (e.currentTarget as HTMLElement).style.color = "var(--destructive)"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--foreground-3)"; }}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mappings */}
                                    <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                        <div className="text-[11px] font-[600] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--foreground-3)" }}>Linked Models</div>
                                        {providerMappings.length === 0 ? (
                                            <div className="py-3 text-center rounded-[6px]" style={{ background: "var(--background)", border: "1px dashed var(--border)" }}>
                                                <span className="text-[12px] italic" style={{ color: "var(--foreground-3)" }}>No models linked.</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                                {providerMappings.map((mapping: any) => (
                                                    <div key={mapping.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-[6px] text-[12px]" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="status-dot" style={{ background: mapping.enabled ? "var(--success)" : "var(--foreground-3)" }} />
                                                            <span className="font-[500]">{mapping.modelName}</span>
                                                            <span className="font-mono text-[10px]" style={{ color: "var(--foreground-3)" }}>({mapping.modelSlug})</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 tabular-nums" style={{ color: "var(--foreground-2)" }}>
                                                            <div>In: ${Number(mapping.inputPricePer1k).toFixed(4)}/1k</div>
                                                            <div>Out: ${Number(mapping.outputPricePer1k).toFixed(4)}/1k</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {providerToDelete !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-sm rounded-[10px] overflow-hidden shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="p-6 space-y-4">
                            <h3 className="text-[14.5px] font-[600] m-0">Delete Provider</h3>
                            <p className="text-[12.5px] m-0 leading-relaxed" style={{ color: "var(--foreground-2)" }}>
                                Are you sure you want to delete provider <strong>{providerToDelete.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setProviderToDelete(null)}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        deleteMutation.mutate(providerToDelete.id);
                                        setProviderToDelete(null);
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
