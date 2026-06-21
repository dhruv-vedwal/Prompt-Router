import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Plus,
    Loader2,
    Search,
    Trash2,
    Settings2,
    Check,
    Coins,
    Activity,
    Power
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function ManageModels() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingMapping, setEditingMapping] = useState<any>(null);
    const [modelToDelete, setModelToDelete] = useState<any>(null);

    // Form State
    const [newModel, setNewModel] = useState({
        name: "",
        slug: "",
        companyId: "",
    });

    const modelsQuery = useQuery({
        queryKey: ["admin-models"],
        queryFn: async () => {
            const response = await elysiaClient.models.get();
            if (response.error) throw new Error("Failed to fetch models");
            return response.data;
        },
    });

    const companiesQuery = useQuery({
        queryKey: ["admin-companies"],
        queryFn: async () => {
            const response = await elysiaClient.models.companies.get();
            if (response.error) throw new Error("Failed to fetch companies");
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof newModel) => {
            const response = await elysiaClient.models.post(data);
            if (response.error) throw new Error(response.error.value as string);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-models"] });
            setIsCreateModalOpen(false);
            setNewModel({ name: "", slug: "", companyId: "" });
        },
    });

    const updateMappingMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const response = await elysiaClient.admin.mappings({ id }).put(data);
            if (response.error) throw new Error("Failed to update mapping");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-models"] });
            setEditingMapping(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await elysiaClient.models({ id }).delete();
            if (response.error) throw new Error("Failed to delete model");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-models"] });
        },
    });

    const models = modelsQuery.data?.models ?? [];
    const debouncedSearch = useDebounce(search, 300);
    const filteredModels = models.filter(m => 
        m.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        m.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <DashboardLayout>
            {/* Register Model Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-md rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-[14.5px] font-[600] m-0">Register New Model</h3>
                            <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                Add a new LLM to the global routing catalog.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Display Name</label>
                                <input
                                    placeholder="e.g. GPT-4o"
                                    value={newModel.name}
                                    onChange={e => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Route Slug</label>
                                <input
                                    placeholder="e.g. openai/gpt-4o"
                                    value={newModel.slug}
                                    onChange={e => setNewModel(prev => ({ ...prev, slug: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none font-mono transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Provider Company</label>
                                <select
                                    value={newModel.companyId}
                                    onChange={e => setNewModel(prev => ({ ...prev, companyId: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                >
                                    <option value="" disabled style={{ background: "var(--surface)" }}>Select parent company...</option>
                                    {companiesQuery.data?.companies.map((c: any) => (
                                        <option key={c.id} value={c.id.toString()} style={{ background: "var(--surface)" }}>{c.name}</option>
                                    ))}
                                </select>
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
                                    disabled={createMutation.isPending || !newModel.name || !newModel.slug || !newModel.companyId}
                                    onClick={() => createMutation.mutate(newModel)}
                                    className="flex-[2] h-9 rounded-[6px] text-[12.5px] font-[500] text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    style={{ background: "var(--accent-blue)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                                >
                                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                    Deploy to Network
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Mapping Modal */}
            {editingMapping && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-md rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-[14.5px] font-[600] m-0">Configure Route Economics</h3>
                            <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                {editingMapping.provider.name} Pricing Mapping
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Input Price / 1k</label>
                                    <input 
                                        type="number"
                                        step="0.0001"
                                        value={editingMapping.inputPricePer1k}
                                        onChange={(e) => setEditingMapping({...editingMapping, inputPricePer1k: Number(e.target.value)})}
                                        className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all font-mono"
                                        style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                        onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                        onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Output Price / 1k</label>
                                    <input 
                                        type="number"
                                        step="0.0001"
                                        value={editingMapping.outputPricePer1k}
                                        onChange={(e) => setEditingMapping({...editingMapping, outputPricePer1k: Number(e.target.value)})}
                                        className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all font-mono"
                                        style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                        onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                        onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Markup Multiplier</label>
                                <input 
                                    type="number"
                                    step="0.1"
                                    value={editingMapping.markupMultiplier}
                                    onChange={(e) => setEditingMapping({...editingMapping, markupMultiplier: Number(e.target.value)})}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all font-mono"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                                <p className="text-[11px] m-0" style={{ color: "var(--foreground-3)" }}>
                                    Current total multiplier: {editingMapping.markupMultiplier}x base cost
                                </p>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setEditingMapping(null)}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={() => updateMappingMutation.mutate({ 
                                        id: editingMapping.id, 
                                        data: {
                                            inputPricePer1k: editingMapping.inputPricePer1k,
                                            outputPricePer1k: editingMapping.outputPricePer1k,
                                            markupMultiplier: editingMapping.markupMultiplier
                                        } 
                                    })}
                                    className="flex-[2] h-9 rounded-[6px] text-[12.5px] font-[500] text-white flex items-center justify-center gap-2 transition-colors"
                                    style={{ background: "var(--accent-blue)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                                >
                                    {updateMappingMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">Manage Models</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Configure model routing, manage pricing structures, and monitor provider operational status.
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
                    Register LLM
                </button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-[7px] h-8 px-[9px] rounded-[6px] w-[240px] mb-4" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <Search className="size-[13px] flex-none" style={{ color: "var(--foreground-3)" }} />
                <input
                    placeholder="Filter directory…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-[12px]"
                    style={{ color: "var(--foreground)" }}
                />
            </div>

            {/* Models list */}
            {modelsQuery.isLoading ? (
                <div className="py-12 flex items-center justify-center gap-2" style={{ color: "var(--foreground-3)" }}>
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-[13px]">Loading models…</span>
                </div>
            ) : filteredModels.length === 0 ? (
                <div className="rounded-[10px] py-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Activity className="size-8 mx-auto mb-3 opacity-20" />
                    <p className="text-[13px] m-0" style={{ color: "var(--foreground-3)" }}>
                        {models.length === 0 ? "No models found." : "No models match your search filter."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredModels.map((model) => (
                        <div key={model.id} className="rounded-[10px] p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-7 rounded-[6px] flex items-center justify-center flex-none" style={{ background: "rgba(62,99,221,0.1)", border: "1px solid rgba(62,99,221,0.2)" }}>
                                        <Activity className="size-3.5" style={{ color: "#7C96EE" }} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-[600]">{model.name}</span>
                                            <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded-[4px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--foreground-2)" }}>{model.slug}</span>
                                        </div>
                                        <div className="text-[12px] mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                            Company: <span style={{ color: "var(--foreground-2)" }}>{model.company.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModelToDelete(model)}
                                    className="size-7 inline-flex items-center justify-center rounded-[5px] transition-colors"
                                    style={{ color: "var(--foreground-3)" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(229,72,77,0.15)"; (e.currentTarget as HTMLElement).style.color = "var(--destructive)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--foreground-3)"; }}
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>

                            {/* Mappings */}
                            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-[600] uppercase tracking-[0.05em]" style={{ color: "var(--foreground-3)" }}>Active Provider Mappings</span>
                                </div>
                                {(!model.modelProviderMappings || model.modelProviderMappings.length === 0) ? (
                                    <div className="py-4 text-center rounded-[6px]" style={{ background: "var(--background)", border: "1px dashed var(--border)" }}>
                                        <span className="text-[12px] italic" style={{ color: "var(--foreground-3)" }}>No providers mapped. Link a provider from the Providers panel.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {model.modelProviderMappings.map((mapping: any) => (
                                            <div key={mapping.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[6px]" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="status-dot" style={{ background: mapping.enabled ? "var(--success)" : "var(--foreground-3)" }} />
                                                    <span className="text-[13px] font-[500]">{mapping.provider.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-4 text-[12px] tabular-nums" style={{ color: "var(--foreground-2)" }}>
                                                        <div>
                                                            <span style={{ color: "var(--foreground-3)" }}>Input:</span> ${Number(mapping.inputPricePer1k).toFixed(4)}/1k
                                                        </div>
                                                        <div>
                                                            <span style={{ color: "var(--foreground-3)" }}>Output:</span> ${Number(mapping.outputPricePer1k).toFixed(4)}/1k
                                                        </div>
                                                        {mapping.markupMultiplier && (
                                                            <div>
                                                                <span style={{ color: "var(--foreground-3)" }}>Markup:</span> {mapping.markupMultiplier}x
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => setEditingMapping(mapping)}
                                                            className="size-7 inline-flex items-center justify-center rounded-[5px] transition-colors"
                                                            style={{ border: "1px solid var(--border)", color: "var(--foreground-2)" }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                                        >
                                                            <Settings2 className="size-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateMappingMutation.mutate({ id: mapping.id, data: { enabled: !mapping.enabled } })}
                                                            className="size-7 inline-flex items-center justify-center rounded-[5px] transition-colors"
                                                            style={{
                                                                border: "1px solid var(--border)",
                                                                color: mapping.enabled ? "var(--success)" : "var(--foreground-3)"
                                                            }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = mapping.enabled ? "rgba(62,179,95,0.15)" : "rgba(255,255,255,0.07)")}
                                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                                        >
                                                            <Power className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {modelToDelete !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-sm rounded-[10px] overflow-hidden shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="p-6 space-y-4">
                            <h3 className="text-[14.5px] font-[600] m-0">Wipe Model</h3>
                            <p className="text-[12.5px] m-0 leading-relaxed" style={{ color: "var(--foreground-2)" }}>
                                Are you sure you want to wipe <strong>{modelToDelete.name}</strong> from the directory? This will remove all associated active provider mappings.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setModelToDelete(null)}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        deleteMutation.mutate(modelToDelete.id);
                                        setModelToDelete(null);
                                    }}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] text-white transition-colors"
                                    style={{ background: "var(--destructive)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#cf3c41")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--destructive)")}
                                >
                                    Wipe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
