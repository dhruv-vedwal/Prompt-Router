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
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function ManageModels() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-500">
                            <Box className="size-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Console Admin</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Manage Models</h1>
                        <p className="text-muted-foreground/70 text-sm">Register and configure LLM slugs for the global directory.</p>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2 rounded-xl shadow-lg shadow-amber-500/20">
                                <Plus className="size-4" />
                                Register Model
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Register New Model</DialogTitle>
                                <DialogDescription>
                                    Add a new LLM to the platform catalog. This slug will be used for API routing.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Display Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. GPT-4o"
                                        value={newModel.name}
                                        onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                                        className="h-12 rounded-xl border-border bg-background focus-visible:ring-amber-500/20 focus-visible:border-amber-500"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Route Slug</Label>
                                    <Input
                                        id="slug"
                                        placeholder="e.g. openai/gpt-4o"
                                        value={newModel.slug}
                                        onChange={(e) => setNewModel(prev => ({ ...prev, slug: e.target.value }))}
                                        className="h-12 rounded-xl border-border bg-background font-mono text-sm focus-visible:ring-amber-500/20 focus-visible:border-amber-500"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Parent Company</Label>
                                    <Select 
                                        value={newModel.companyId} 
                                        onValueChange={(val) => setNewModel(prev => ({ ...prev, companyId: val }))}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-border bg-background focus:ring-amber-500/20">
                                            <SelectValue placeholder="Select provider company..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            {companiesQuery.data?.companies.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id} className="focus:bg-amber-500/10 focus:text-amber-500">
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    disabled={createMutation.isPending || !newModel.name || !newModel.slug || !newModel.companyId}
                                    onClick={() => createMutation.mutate(newModel)}
                                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-xl"
                                >
                                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Deploy to Catalog"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-3 bg-card/40 border-border/50 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
                        <CardContent className="p-4 flex items-center gap-4">
                            <Search className="size-5 text-muted-foreground/50 ml-2" />
                            <Input 
                                placeholder="Search by name or slug..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border-none bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/30 font-medium"
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-500/5 border-amber-500/20 flex flex-col justify-center p-6 rounded-3xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Total Catalog</span>
                        <p className="text-4xl font-black text-foreground mt-1 tabular-nums">{models.length}</p>
                    </Card>
                </div>

                {/* Models Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {modelsQuery.isLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="size-10 animate-spin text-amber-500/40" />
                            <p className="text-sm font-bold text-muted-foreground animate-pulse">Synchronizing Catalog...</p>
                        </div>
                    ) : filteredModels.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 rounded-3xl">
                            <Box className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">No models found matching your search.</p>
                        </div>
                    ) : (
                        filteredModels.map((model) => (
                            <Card key={model.id} className="group bg-card/40 border-border/50 hover:border-amber-500/30 transition-all duration-300 overflow-hidden relative shadow-xl shadow-black/10">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                                            <Tag className="size-4 text-amber-500" />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="size-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to delete ${model.name}?`)) {
                                                    deleteMutation.mutate(model.id);
                                                }
                                            }}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {deleteMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-4" />}
                                        </Button>
                                    </div>
                                    <div className="pt-4">
                                        <CardTitle className="text-lg font-black tracking-tight">{model.name}</CardTitle>
                                        <code className="text-[10px] font-mono text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded mt-1 block w-fit italic">
                                            {model.slug}
                                        </code>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 pb-6">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium bg-background/40 p-3 rounded-xl border border-border/50">
                                        <Building2 className="size-3.5 text-amber-500/50" />
                                        {model.company.name}
                                    </div>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-500" />
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
