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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    Layers,
    Plus,
    Loader2,
    DollarSign,
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
                ...data,
                providerId: selectedProvider?.id,
            });
            if (response.error) throw new Error("Failed to create mapping");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-500">
                            <Layers className="size-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Console Admin</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Cloud Providers</h1>
                        <p className="text-muted-foreground/70 text-sm">Manage API endpoints and per-token pricing mappings.</p>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2 rounded-xl shadow-lg shadow-amber-500/20">
                                <Plus className="size-4" />
                                Add Provider
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Register Provider</DialogTitle>
                                <DialogDescription>
                                    Onboard a new infrastructure partner to provide LLM inference.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Provider Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Together AI"
                                        value={newProvider.name}
                                        onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                                        className="h-12 rounded-xl border-border bg-background focus-visible:ring-amber-500/20 focus-visible:border-amber-500"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Documentation/Website</Label>
                                    <Input
                                        id="website"
                                        placeholder="https://together.ai"
                                        value={newProvider.website}
                                        onChange={(e) => setNewProvider(prev => ({ ...prev, website: e.target.value }))}
                                        className="h-12 rounded-xl border-border bg-background focus-visible:ring-amber-500/20 focus-visible:border-amber-500"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    disabled={createMutation.isPending || !newProvider.name || !newProvider.website}
                                    onClick={() => createMutation.mutate(newProvider)}
                                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-xl"
                                >
                                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Onboard Provider"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                    <Input
                        placeholder="Search providers or websites..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-11 bg-card/20 border-border/50 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl"
                    />
                </div>

                {/* Warning / Tip */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                        <ShieldAlert className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-200">Pricing Synchronization</p>
                        <p className="text-xs text-amber-500/70 mt-1">Changes to input/output pricing affect all future settlements immediately. Ensure markup multipliers (default 1.2x) cover platform overhead.</p>
                    </div>
                </div>

                {/* Providers List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {providersQuery.isLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="size-10 animate-spin text-amber-500/40" />
                            <p className="text-sm font-bold text-muted-foreground animate-pulse">Scanning Cloud Endpoints...</p>
                        </div>
                    ) : (
                        filteredProviders.map((provider) => (
                            <Card key={provider.id} className="group bg-card/40 border-border/50 hover:border-amber-500/30 transition-all duration-300 overflow-hidden relative shadow-xl">
                                <CardHeader className="pb-4 border-b border-border/30 bg-primary/[0.02]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                <Cpu className="size-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-black tracking-tight">{provider.name}</CardTitle>
                                                <a href={provider.website} target="_blank" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5">
                                                    {provider.website}
                                                    <ExternalLink className="size-2.5" />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="text-[10px] font-black uppercase h-8 border-border/50 bg-background/50 hover:border-amber-500/50 hover:text-amber-500 transition-all"
                                                onClick={() => {
                                                    setSelectedProvider(provider);
                                                    setIsMappingModalOpen(true);
                                                }}
                                            >
                                                Link Model
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="size-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to delete ${provider.name}?`)) {
                                                        deleteMutation.mutate(provider.id);
                                                    }
                                                }}
                                                disabled={deleteMutation.isPending}
                                            >
                                                {deleteMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Pricing Model</span>
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                                <DollarSign className="size-3 text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-500">DYNAMIC</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 rounded-xl bg-background/40 border border-border/50 space-y-3">
                                            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Active Mappings</p>
                                            <div className="flex items-center justify-center py-6 border border-dashed border-border/30 rounded-lg">
                                                <p className="text-[10px] font-medium text-muted-foreground/40 italic">Check model mappings for detailed pricing</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <Layers className="size-20 text-amber-500" />
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Model Mapping Modal */}
                <Dialog open={isMappingModalOpen} onOpenChange={setIsMappingModalOpen}>
                    <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                <Plus className="size-6 text-amber-500" />
                                Link Model to {selectedProvider?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Configure which models this provider should handle and set their token pricing.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-6 py-6">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Model</Label>
                                <Select 
                                    value={newMapping.modelId} 
                                    onValueChange={(val) => setNewMapping(prev => ({ ...prev, modelId: val }))}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-border bg-background focus:ring-amber-500/20">
                                        <SelectValue placeholder="Select model to route..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        {modelsQuery.data?.models.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id} className="focus:bg-amber-500/10 focus:text-amber-500">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{m.name}</span>
                                                    <span className="text-[9px] opacity-50 font-mono tracking-tighter">{m.slug}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Input Cost ($/1M)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={newMapping.inputTokenCost}
                                            onChange={(e) => setNewMapping(prev => ({ ...prev, inputTokenCost: parseFloat(e.target.value) }))}
                                            className="h-12 rounded-xl border-border bg-background pl-8 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Output Cost ($/1M)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={newMapping.outputTokenCost}
                                            onChange={(e) => setNewMapping(prev => ({ ...prev, outputTokenCost: parseFloat(e.target.value) }))}
                                            className="h-12 rounded-xl border-border bg-background pl-8 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-muted-foreground/60">Estimated Platform Margin</span>
                                    <span className="text-primary">20.0% (DEFAULT)</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground/50 leading-relaxed italic">
                                    The final price charged to users will include a 1.2x markup on top of these base costs to cover operational overhead.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                disabled={mappingMutation.isPending || !newMapping.modelId}
                                onClick={() => mappingMutation.mutate(newMapping)}
                                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-xl"
                            >
                                {mappingMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Establish Route Mapping"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
