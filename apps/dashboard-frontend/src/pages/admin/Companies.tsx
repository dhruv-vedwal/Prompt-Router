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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Building2,
    Plus,
    Loader2,
    ExternalLink,
    Trash2,
    Search,
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function ManageCompanies() {
    const elysiaClient = useElysiaClient();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [newCompany, setNewCompany] = useState({
        name: "",
        website: "",
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
        mutationFn: async (data: typeof newCompany) => {
            // We need a POST endpoint for companies. I'll add this to the backend.
            const response = await elysiaClient.models.companies.post(data);
            if (response.error) throw new Error("Failed to create company");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
            setIsCreateModalOpen(false);
            setNewCompany({ name: "", website: "" });
        },
    });

    const companies = companiesQuery.data?.companies ?? [];
    const debouncedSearch = useDebounce(search, 300);
    const filteredCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-500">
                            <Building2 className="size-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Console Admin</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Manage Companies</h1>
                        <p className="text-muted-foreground/70 text-sm">Register model creators and infrastructure providers.</p>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold gap-2 rounded-xl shadow-lg shadow-indigo-500/20">
                                <Plus className="size-4" />
                                Add Company
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Register Company</DialogTitle>
                                <DialogDescription>
                                    Add a new model creator (e.g. OpenAI, Anthropic) to the platform.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Anthropic"
                                        value={newCompany.name}
                                        onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                                        className="h-12 rounded-xl border-border bg-background focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Official Website</Label>
                                    <Input
                                        id="website"
                                        placeholder="https://www.anthropic.com"
                                        value={newCompany.website}
                                        onChange={(e) => setNewCompany(prev => ({ ...prev, website: e.target.value }))}
                                        className="h-12 rounded-xl border-border bg-background focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    disabled={createMutation.isPending || !newCompany.name || !newCompany.website}
                                    onClick={() => createMutation.mutate(newCompany)}
                                    className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl"
                                >
                                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Register Company"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                    <CardContent className="p-4 flex items-center gap-4">
                        <Search className="size-5 text-muted-foreground/50 ml-2" />
                        <Input 
                            placeholder="Search companies..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border-none bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/30 font-medium"
                        />
                    </CardContent>
                </Card>

                {/* Companies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companiesQuery.isLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="size-10 animate-spin text-indigo-500/40" />
                            <p className="text-sm font-bold text-muted-foreground animate-pulse">Fetching Corporate Directory...</p>
                        </div>
                    ) : filteredCompanies.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 rounded-3xl">
                            <Building2 className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">No companies found. Add your first one above!</p>
                        </div>
                    ) : (
                        filteredCompanies.map((company) => (
                            <Card key={company.id} className="group bg-card/40 border-border/50 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden relative shadow-xl">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                            <Building2 className="size-5 text-indigo-500" />
                                        </div>
                                        <a href={company.website} target="_blank" className="p-2 rounded-lg hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-500 transition-colors">
                                            <ExternalLink className="size-4" />
                                        </a>
                                    </div>
                                    <div className="pt-4">
                                        <CardTitle className="text-lg font-black tracking-tight">{company.name}</CardTitle>
                                        <p className="text-[10px] text-muted-foreground/60 font-mono truncate mt-1">{company.website}</p>
                                    </div>
                                </CardHeader>
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-500" />
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
