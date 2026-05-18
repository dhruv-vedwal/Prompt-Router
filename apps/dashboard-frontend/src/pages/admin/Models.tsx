import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Box,
    Plus,
    Loader2,
    Search,
    Building2,
    Tag,
    Trash2,
    Zap,
    Settings2,
    Check,
    X,
    Coins,
    BarChart3,
    Activity,
    Power
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function ManageModels() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingMapping, setEditingMapping] = useState<any>(null);

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
            <div className="space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Box className="size-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Network Control Center</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Manage Models</h1>
                        <p className="text-muted-foreground text-sm max-w-md font-medium leading-relaxed">
                            Configure model routing, manage pricing structures, and monitor provider operational status across the network.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group bg-card/50 backdrop-blur-xl border border-border/50 p-2 rounded-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Filter directory..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 w-64 bg-background/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl h-11"
                            />
                        </div>
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    <Plus className="size-4" />
                                    Register LLM
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-2xl border-border/50 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black tracking-tight">Register New Model</DialogTitle>
                                    <DialogDescription className="text-sm font-medium">Add a new LLM to the global routing catalog.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Display Name</Label>
                                        <Input
                                            placeholder="e.g. GPT-4o"
                                            value={newModel.name}
                                            onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                                            className="h-12 rounded-xl bg-background/50 border-border/50"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Route Slug</Label>
                                        <Input
                                            placeholder="e.g. openai/gpt-4o"
                                            value={newModel.slug}
                                            onChange={(e) => setNewModel(prev => ({ ...prev, slug: e.target.value }))}
                                            className="h-12 rounded-xl bg-background/50 border-border/50 font-mono text-sm"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Provider Company</Label>
                                        <Select 
                                            value={newModel.companyId} 
                                            onValueChange={(val) => setNewModel(prev => ({ ...prev, companyId: val }))}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/50">
                                                <SelectValue placeholder="Select parent company..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card/90 backdrop-blur-xl border-border/50">
                                                {companiesQuery.data?.companies.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        disabled={createMutation.isPending || !newModel.name || !newModel.slug || !newModel.companyId}
                                        onClick={() => createMutation.mutate(newModel)}
                                        className="w-full h-12 font-black uppercase tracking-widest text-xs rounded-xl"
                                    >
                                        {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Deploy to Network"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Models Content */}
                <div className="grid grid-cols-1 gap-8">
                    {modelsQuery.isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
                            <Zap className="size-10 animate-pulse text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Network Data...</p>
                        </div>
                    ) : (
                        filteredModels.map((model) => (
                            <Card key={model.id} className="overflow-hidden border-border/40 bg-card/20 group hover:bg-card/30 transition-all duration-500">
                                <div className="flex flex-col lg:flex-row lg:items-stretch">
                                    {/* Left Info Panel */}
                                    <div className="p-8 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-border/40 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                <Activity className="size-6" />
                                            </div>
                                            <Button 
                                                variant="ghost" size="icon" 
                                                className="size-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                                onClick={() => confirm(`Wipe ${model.name} from directory?`) && deleteMutation.mutate(model.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black tracking-tighter text-foreground">{model.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <code className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 bg-muted/20 px-2 py-0.5 rounded-lg border border-border/50">
                                                    {model.slug}
                                                </code>
                                                <span className="text-[10px] font-medium text-muted-foreground/30">•</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{model.company.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Mappings/Provider Panel */}
                                    <div className="flex-1 p-8 bg-background/20 backdrop-blur-sm">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Active Provider Mappings</h4>
                                                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">
                                                    <Plus className="size-3 mr-1" /> Add Provider
                                                </Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-4">
                                                {model.modelProviderMappings?.map((mapping: any) => (
                                                    <div key={mapping.id} className="relative group/mapping p-5 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 transition-all duration-300">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "size-3 rounded-full animate-pulse",
                                                                    mapping.enabled ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-destructive/40"
                                                                )} />
                                                                <div className="space-y-0.5">
                                                                    <div className="text-sm font-black text-foreground">{mapping.provider.name}</div>
                                                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Network Route Endpoint</div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-8">
                                                                <div className="flex items-center gap-6">
                                                                    <div className="space-y-1">
                                                                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Input/1k</div>
                                                                        <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                                                                            <Coins className="size-3 text-primary/60" />
                                                                            ${Number(mapping.inputPricePer1k).toFixed(4)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Output/1k</div>
                                                                        <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                                                                            <Coins className="size-3 text-primary/60" />
                                                                            ${Number(mapping.outputPricePer1k).toFixed(4)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <Button 
                                                                        size="icon" variant="ghost" 
                                                                        className="size-9 rounded-xl bg-background/50 border border-border/50 hover:text-primary transition-all"
                                                                        onClick={() => setEditingMapping(mapping)}
                                                                    >
                                                                        <Settings2 className="size-4" />
                                                                    </Button>
                                                                    <Button 
                                                                        size="icon" variant="ghost" 
                                                                        className={cn(
                                                                            "size-9 rounded-xl border border-border/50 transition-all",
                                                                            mapping.enabled ? "text-emerald-500 hover:bg-emerald-500/10" : "text-destructive hover:bg-destructive/10"
                                                                        )}
                                                                        onClick={() => updateMappingMutation.mutate({ id: mapping.id, data: { enabled: !mapping.enabled } })}
                                                                    >
                                                                        <Power className="size-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Edit Mapping Modal */}
                {editingMapping && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
                        <Card className="w-full max-w-md border-primary/20 bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-4 text-primary">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Coins className="size-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-xl font-black tracking-tight">Configure Route Economics</h3>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{editingMapping.provider.name} Pricing</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Input Price / 1k</Label>
                                        <Input 
                                            type="number"
                                            value={editingMapping.inputPricePer1k}
                                            onChange={(e) => setEditingMapping({...editingMapping, inputPricePer1k: Number(e.target.value)})}
                                            className="h-12 bg-background/50 border-border/50 rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Output Price / 1k</Label>
                                        <Input 
                                            type="number"
                                            value={editingMapping.outputPricePer1k}
                                            onChange={(e) => setEditingMapping({...editingMapping, outputPricePer1k: Number(e.target.value)})}
                                            className="h-12 bg-background/50 border-border/50 rounded-xl font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Markup Multiplier</Label>
                                    <Input 
                                        type="number"
                                        value={editingMapping.markupMultiplier}
                                        onChange={(e) => setEditingMapping({...editingMapping, markupMultiplier: Number(e.target.value)})}
                                        className="h-12 bg-background/50 border-border/50 rounded-xl font-bold"
                                    />
                                    <p className="text-[9px] text-muted-foreground italic ml-1">Current total multiplier: {editingMapping.markupMultiplier}x base cost</p>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <Button 
                                        variant="ghost" 
                                        className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs"
                                        onClick={() => setEditingMapping(null)}
                                    >
                                        Discard
                                    </Button>
                                    <Button 
                                        className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs gap-2"
                                        onClick={() => updateMappingMutation.mutate({ 
                                            id: editingMapping.id, 
                                            data: {
                                                inputPricePer1k: editingMapping.inputPricePer1k,
                                                outputPricePer1k: editingMapping.outputPricePer1k,
                                                markupMultiplier: editingMapping.markupMultiplier
                                            } 
                                        })}
                                    >
                                        {updateMappingMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                                        Save Changes
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
