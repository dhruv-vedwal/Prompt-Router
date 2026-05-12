import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import {
    LayoutDashboard,
    Key,
    Coins,
    Zap,
    LogOut,
    Sparkles,
    Code,
    Loader2,
    Wallet,
    Shield,
    Box,
    Layers,
    BarChart3,
    Building2,
} from "lucide-react";

import { ThemeToggle } from "./ThemeToggle";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Playground", href: "/playground", icon: Sparkles },
    { label: "API Keys", href: "/api-keys", icon: Key },
    { label: "Credits", href: "/credits", icon: Coins },
    { label: "SDKs", href: "/sdks", icon: Code },
];

const adminNavItems = [
    { label: "Manage Models", href: "/admin/models", icon: Box },
    { label: "Manage Providers", href: "/admin/providers", icon: Layers },
    { label: "Manage Companies", href: "/admin/companies", icon: Building2 },
    { label: "Platform Stats", href: "/admin/stats", icon: BarChart3 },
];

export function DashboardLayout({ children, fullHeight = false }: { children: React.ReactNode, fullHeight?: boolean }) {
    const location = useLocation();
    const elysiaClient = useElysiaClient();

    const userProfileQuery = useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const response = await elysiaClient["auth"].profile.get();
            if (response.error) throw new Error("Error while fetching user details");
            return response.data;
        },
    });

    const balance = userProfileQuery.data?.balance;
    const isAdmin = userProfileQuery.data?.role === "ADMIN";

    return (
        <div className="min-h-screen bg-background flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border/50 flex flex-col bg-card/30 backdrop-blur-xl">
                {/* Brand & Balance */}
                <div className="px-5 py-5 border-b border-border/50 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_15px_-5px_rgba(var(--primary),0.4)]">
                            <Zap className="size-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-foreground">
                            PromptRouter
                        </span>
                    </div>

                    {/* Balance Chip */}
                    <Link to="/credits" className="block group">
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/[0.03] border border-primary/10 group-hover:bg-primary/[0.06] group-hover:border-primary/20 transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <Wallet className="size-3 text-primary/60 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 group-hover:text-foreground transition-colors">Balance</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {userProfileQuery.isLoading ? (
                                    <Loader2 className="size-3 animate-spin text-primary/40" />
                                ) : (
                                    <span className="text-xs font-black text-foreground tabular-nums">
                                        {Number(balance ?? 0).toLocaleString()}
                                    </span>
                                )}
                                <div className="size-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-3 py-4 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* User Section */}
                    <nav className="space-y-1">
                        <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Developer Stage</p>
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-[inset_0_0_12px_rgba(var(--primary),0.05)]"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                                    )}
                                >
                                    <item.icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground/60")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Admin Section */}
                    {isAdmin && (
                        <nav className="space-y-1 animate-in slide-in-from-left-4 duration-500">
                            <div className="flex items-center gap-2 px-3 mb-2">
                                <Shield className="size-3 text-amber-500/60" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60">Console Admin</p>
                            </div>
                            {adminNavItems.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-amber-500/10 text-amber-500"
                                                : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/5"
                                        )}
                                    >
                                        <item.icon className={cn("size-4", isActive ? "text-amber-500" : "text-muted-foreground/60")} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-4 border-t border-border/50 flex items-center justify-between bg-card/10">
                    <Link
                        to="/signin"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 flex-1"
                    >
                        <LogOut className="size-4" />
                        Sign out
                    </Link>
                    <ThemeToggle />
                </div>
            </aside>

            {/* Main content */}
            <main className={cn(
                "flex-1 h-screen flex flex-col overflow-x-hidden custom-scrollbar bg-background/50 relative",
                fullHeight ? "overflow-hidden" : "overflow-y-auto"
            )}>
                <div className={cn(
                    "flex flex-col max-w-5xl w-full mx-auto px-8 relative z-10",
                    fullHeight ? "flex-1 min-h-0 pt-4 pb-4" : "pt-8 pb-8"
                )}>
                    {children}
                </div>
                {/* Subtle Ambient Background Detail */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            </main>
        </div>
    );
}
