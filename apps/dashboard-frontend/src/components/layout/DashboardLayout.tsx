import { Link, useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import {
    Code,
    BarChart3,
    Search,
    ChevronDown,
    ChevronsUpDown,
    LogOut,
    Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
        ),
    },
    {
        label: "Analytics",
        href: "/analytics",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-4">
                <path d="M4 20V10M12 20V4M20 20v-7"/>
            </svg>
        ),
    },
    {
        label: "Playground",
        href: "/playground",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M5 4h11l3 5-3 5H5z"/><path d="M5 14v6"/>
            </svg>
        ),
    },
    {
        label: "API Keys",
        href: "/api-keys",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <circle cx="7" cy="15" r="3.2"/><path d="M9.4 12.6L19 3M19 3v4M19 3h-4"/>
            </svg>
        ),
    },
    {
        label: "Credits",
        href: "/credits",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/>
            </svg>
        ),
    },
    {
        label: "SDKs",
        href: "/sdks",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>
            </svg>
        ),
    },
];

const adminNavItems = [
    {
        label: "Manage Models",
        href: "/admin/models",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7.3L12 12l8.7-4.7M12 12v9"/>
            </svg>
        ),
    },
    {
        label: "Manage Providers",
        href: "/admin/providers",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M12 2l9 4.5-9 4.5-9-4.5z"/><path d="M3 11l9 4.5 9-4.5M3 15.5L12 20l9-4.5"/>
            </svg>
        ),
    },
    {
        label: "Manage Companies",
        href: "/admin/companies",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <rect x="4" y="3" width="11" height="18"/><path d="M15 9h5v12h-5M7.5 7h1M7.5 11h1M7.5 15h1"/>
            </svg>
        ),
    },
    {
        label: "Platform Stats",
        href: "/admin/stats",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M4 19V9M11 19V4M18 19v-6"/>
            </svg>
        ),
    },
    {
        label: "Manage Users",
        href: "/admin/users",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M16 3.13a4 4 0 010 7.75"/>
            </svg>
        ),
    },
];

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link
            to={href}
            className="flex items-center gap-2.5 px-2 py-[6.5px] rounded-[8px] text-[13px] font-[500] transition-all duration-100"
            style={{
                background: active ? "var(--active)" : hovered ? "var(--hover)" : "transparent",
                color: active ? "var(--foreground)" : hovered ? "var(--foreground)" : "var(--foreground-2)",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span
                className="transition-colors flex-none"
                style={{
                    color: active ? "var(--foreground)" : hovered ? "var(--foreground)" : "var(--foreground-3)"
                }}
            >
                {icon}
            </span>
            {label}
        </Link>
    );
}

export function DashboardLayout({ children, fullHeight = false }: { children: React.ReactNode; fullHeight?: boolean }) {
    const location = useLocation();
    const navigate = useNavigate();
    const elysiaClient = useElysiaClient();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [updateMessage, setUpdateMessage] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const [showBrandMenu, setShowBrandMenu] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);

    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [paletteQuery, setPaletteQuery] = useState("");

    const brandMenuRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const userProfileQuery = useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const response = await elysiaClient["auth"].profile.get();
            if (response.error) throw new Error("Error while fetching user details");
            return response.data;
        },
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setShowCommandPalette(prev => !prev);
            }
            if (e.key === "Escape") {
                setShowCommandPalette(false);
                setShowProfileMenu(false);
                setShowBrandMenu(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (brandMenuRef.current && !brandMenuRef.current.contains(event.target as Node)) {
                setShowBrandMenu(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const balance = userProfileQuery.data?.balance;
    const email = userProfileQuery.data?.email ?? "";
    const isAdmin = userProfileQuery.data?.role === "ADMIN";

    // Get initials from email
    const initials = email ? email.slice(0, 2).toUpperCase() : "??";
    const balanceNum = Number(balance ?? 0).toLocaleString();

    const handleSignOut = () => {
        navigate("/signin");
    };

    return (
        <div
            className="h-screen w-screen overflow-hidden flex"
            style={{ background: "var(--background)", color: "var(--foreground)" }}
        >
            {/* Command Palette */}
            {showCommandPalette && (
                <div
                    className="fixed inset-0 z-[100] flex items-start justify-center p-6 pt-[15vh]"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                    onClick={() => setShowCommandPalette(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-[10px] overflow-hidden shadow-2xl"
                        style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                            <Search className="size-4" style={{ color: "var(--foreground-3)" }} />
                            <input
                                autoFocus
                                placeholder="Type a command or search pages..."
                                value={paletteQuery}
                                onChange={e => setPaletteQuery(e.target.value)}
                                className="flex-1 bg-transparent border-0 outline-none text-[13.5px]"
                                style={{ color: "var(--foreground)" }}
                            />
                            <kbd className="kbd">ESC</kbd>
                        </div>
                        <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <div className="text-[11px] font-[600] uppercase tracking-[0.05em] px-2.5 py-1.5" style={{ color: "var(--foreground-3)" }}>
                                Navigation
                            </div>
                            {[
                                ...navItems,
                                ...(isAdmin ? adminNavItems : [])
                            ]
                            .filter(item => item.label.toLowerCase().includes(paletteQuery.toLowerCase()))
                            .map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        navigate(item.href);
                                        setShowCommandPalette(false);
                                        setPaletteQuery("");
                                    }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 w-full text-left rounded-[6px] text-[13px] font-[500] hover-bg transition-colors"
                                    style={{ color: "var(--foreground)" }}
                                >
                                    <span style={{ color: "var(--foreground-3)" }}>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Profile settings modal */}
            {showProfileModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-md rounded-[10px] overflow-hidden shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-[14.5px] font-[600] m-0">Profile Settings</h3>
                            <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                View your account details and update your security credentials.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-[600] uppercase tracking-[0.05em]" style={{ color: "var(--foreground-3)" }}>Email Address</label>
                                <p className="text-[13.5px] font-[500] m-0" style={{ color: "var(--foreground-2)" }}>{email || "Loading..."}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-[8px]" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                                    <p className="text-[11px] font-[600] uppercase tracking-[0.05em] m-0 mb-1" style={{ color: "var(--foreground-3)" }}>Credits Balance</p>
                                    <p className="text-[16px] font-[600] m-0 tabular-nums">${Number(balance ?? 0).toFixed(2)}</p>
                                </div>
                                <div className="p-3 rounded-[8px]" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                                    <p className="text-[11px] font-[600] uppercase tracking-[0.05em] m-0 mb-1" style={{ color: "var(--foreground-3)" }}>Account Role</p>
                                    <p className="text-[16px] font-[600] m-0 uppercase" style={{ color: isAdmin ? "#F5A623" : "#3EB35F" }}>{userProfileQuery.data?.role || "USER"}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                <label className="text-[12px] font-[500]" style={{ color: "var(--foreground-2)" }}>Change Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>

                            {updateMessage && (
                                <p className="text-[12px] m-0" style={{ color: updateMessage.includes("success") ? "var(--success)" : "var(--destructive)" }}>
                                    {updateMessage}
                                </p>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setShowProfileModal(false);
                                        setNewPassword("");
                                        setUpdateMessage("");
                                    }}
                                    className="flex-1 h-9 rounded-[6px] text-[12.5px] font-[500] transition-colors"
                                    style={{ border: "1px solid var(--border-2)", color: "var(--foreground-2)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.045)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    Close
                                </button>
                                <button
                                    disabled={!newPassword.trim() || isUpdatingPassword}
                                    onClick={async () => {
                                        setIsUpdatingPassword(true);
                                        setUpdateMessage("");
                                        try {
                                            const response = await elysiaClient.auth.profile.put({ password: newPassword });
                                            if (response.error) throw new Error("Failed to update password");
                                            setUpdateMessage("Password updated successfully!");
                                            setNewPassword("");
                                        } catch (err: any) {
                                            setUpdateMessage("Failed to update password.");
                                        } finally {
                                            setIsUpdatingPassword(false);
                                        }
                                    }}
                                    className="flex-[2] h-9 rounded-[6px] text-[12.5px] font-[500] text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    style={{ background: "var(--accent-blue)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                                >
                                    {isUpdatingPassword ? <Loader2 className="size-4 animate-spin" /> : null}
                                    Update Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* About Modal */}
            {showAboutModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(6px)" }}
                >
                    <div className="w-full max-w-md rounded-[10px] overflow-hidden shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}>
                        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-[14.5px] font-[600] m-0">About PromptRouter</h3>
                            <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--foreground-3)" }}>
                                Unified API gateway for LLM inference and routing.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-[13px] leading-relaxed m-0" style={{ color: "var(--foreground-2)" }}>
                                PromptRouter is an open-source gateway designed to optimize LLM usage, minimize latency, and handle failover routing across multiple AI providers automatically.
                            </p>
                            <div className="text-[12px] space-y-1.5" style={{ color: "var(--foreground-3)" }}>
                                <div>Version: <span className="font-mono text-[#7C96EE]">1.0.0</span></div>
                                <div>Architecture: <span className="font-mono">React / Elysia / Prisma</span></div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setShowAboutModal(false)}
                                    className="h-9 px-4 rounded-[6px] text-[12.5px] font-[500] text-white transition-colors"
                                    style={{ background: "var(--accent-blue)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-blue-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Sidebar ===== */}
            <aside
                className="w-[232px] flex-none flex flex-col custom-scrollbar overflow-y-auto"
                style={{
                    background: "var(--surface)",
                    borderRight: "1px solid var(--border)",
                    padding: "10px 10px 12px",
                }}
            >
                {/* Workspace branding */}
                <div ref={brandMenuRef} style={{ position: "relative" }}>
                    <button
                        onClick={() => setShowBrandMenu(prev => !prev)}
                        className="flex items-center gap-[9px] px-[7px] py-[7px] rounded-[8px] w-full text-left transition-colors hover-bg"
                        style={{ color: "var(--foreground)" }}
                    >
                        <span
                            className="w-[22px] h-[22px] flex-none flex items-center justify-center rounded-[6px]"
                            style={{ background: "var(--accent-blue)" }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]">
                                <path d="M6 18v-6h9V6"/>
                            </svg>
                        </span>
                        <span className="flex-1 text-[13.5px] font-[600] truncate" style={{ color: "var(--foreground)" }}>PromptRouter</span>
                        <ChevronDown className="w-[14px] h-[14px] flex-none" style={{ color: "var(--foreground-3)" }} />
                    </button>
                    {showBrandMenu && (
                        <div
                            className="absolute top-[36px] left-0 right-0 z-50 rounded-[8px] p-1.5 shadow-xl"
                            style={{
                                background: "var(--surface-2)",
                                border: "1px solid var(--border-2)",
                            }}
                        >
                            <button
                                onClick={() => {
                                    setShowBrandMenu(false);
                                    setShowAboutModal(true);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 w-full text-left rounded-[6px] text-[12.5px] font-[500] hover-bg transition-colors"
                                style={{ color: "var(--foreground)" }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5 flex-none" style={{ color: "var(--foreground-3)" }}>
                                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                                </svg>
                                About PromptRouter
                            </button>
                            <a
                                href="https://github.com/dhruv-vedwal/Prompt-Router"
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setShowBrandMenu(false)}
                                className="flex items-center gap-2 px-2.5 py-1.5 w-full text-left rounded-[6px] text-[12.5px] font-[500] hover-bg transition-colors"
                                style={{ color: "var(--foreground)" }}
                            >
                                <Code className="size-3.5 flex-none" style={{ color: "var(--foreground-3)" }} />
                                Source Code
                            </a>
                            <Link
                                to="/admin/stats"
                                onClick={() => setShowBrandMenu(false)}
                                className="flex items-center gap-2 px-2.5 py-1.5 w-full text-left rounded-[6px] text-[12.5px] font-[500] hover-bg transition-colors"
                                style={{ color: "var(--foreground)" }}
                            >
                                <BarChart3 className="size-3.5 flex-none" style={{ color: "var(--foreground-3)" }} />
                                Platform Status
                            </Link>
                        </div>
                    )}
                </div>

                {/* Search button & Theme Toggle Row */}
                <div className="flex items-center gap-2 mt-2 mb-4">
                    <button
                        onClick={() => setShowCommandPalette(true)}
                        className="flex items-center gap-2 flex-1 text-left transition-colors rounded-[8px]"
                        style={{
                            padding: "6.5px 8px 6.5px 9px",
                            border: "1px solid var(--border)",
                            background: "var(--background)",
                            color: "var(--foreground-3)",
                            height: "32px",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                    >
                        <Search className="w-[14px] h-[14px] flex-none" />
                        <span className="flex-1 text-[12.5px]">Search</span>
                        <kbd className="kbd">⌘K</kbd>
                    </button>
                    <ThemeToggle />
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-[18px] flex-1">
                    {/* Developer section */}
                    <div>
                        <p className="text-[11px] font-[600] uppercase tracking-[0.02em] text-[#6E6E76] px-2 mb-1">
                            Developer
                        </p>
                        <div className="flex flex-col gap-[1px]">
                            {navItems.map(item => (
                                <NavItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    active={location.pathname === item.href}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Admin section */}
                    {isAdmin && (
                        <div>
                            <p className="text-[11px] font-[600] uppercase tracking-[0.02em] text-[#6E6E76] px-2 mb-1">
                                Console Admin
                            </p>
                            <div className="flex flex-col gap-[1px]">
                                {adminNavItems.map(item => (
                                    <NavItem
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        active={location.pathname === item.href}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Account footer */}
                <div ref={profileMenuRef} style={{ marginTop: "8px", position: "relative" }}>
                    <button
                        onClick={() => setShowProfileMenu(prev => !prev)}
                        className="flex items-center gap-[9px] px-[7px] w-full text-left transition-colors rounded-[8px] hover-bg"
                        style={{
                            borderTop: "1px solid var(--border)",
                            paddingTop: "12px",
                            marginTop: "4px",
                        }}
                    >
                        <span
                            className="w-[24px] h-[24px] flex-none rounded-full flex items-center justify-center text-[10.5px] font-[600]"
                            style={{
                                background: "var(--surface-2)",
                                border: "1px solid var(--border-2)",
                                color: "var(--foreground-2)",
                            }}
                        >
                            {initials}
                        </span>
                        <span className="flex-1 min-w-0">
                            <div className="text-[12.5px] font-[500] truncate" style={{ color: "var(--foreground)" }}>{email || "Loading..."}</div>
                            <div className="text-[11px]" style={{ color: "var(--foreground-3)" }}>
                                {userProfileQuery.isLoading ? (
                                    <Loader2 className="size-3 animate-spin inline" />
                                ) : (
                                    `${balanceNum} credits`
                                )}
                            </div>
                        </span>
                        <ChevronsUpDown className="w-[14px] h-[14px] flex-none" style={{ color: "var(--foreground-3)" }} />
                    </button>
                    {showProfileMenu && (
                        <div
                            className="absolute bottom-[44px] left-0 right-0 z-50 rounded-[8px] p-1.5 shadow-xl"
                            style={{
                                background: "var(--surface-2)",
                                border: "1px solid var(--border-2)",
                            }}
                        >
                            <button
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    setShowProfileModal(true);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 w-full text-left rounded-[6px] text-[12.5px] font-[500] hover-bg transition-colors"
                                style={{ color: "var(--foreground)" }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5 flex-none" style={{ color: "var(--foreground-3)" }}>
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                                Profile Settings
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-2.5 py-1.5 w-full text-left rounded-[6px] text-[12.5px] font-[500] hover-bg text-destructive transition-colors"
                                style={{ color: "var(--destructive)" }}
                            >
                                <LogOut className="size-3.5 flex-none" />
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* ===== Main Content ===== */}
            <main
                className={cn(
                    "flex-1 flex flex-col custom-scrollbar",
                    fullHeight ? "overflow-hidden h-screen" : "overflow-y-auto"
                )}
                style={{ background: "var(--background)" }}
            >
                <div
                    className={cn(
                        "flex flex-col w-full",
                        fullHeight ? "flex-1 min-h-0" : ""
                    )}
                    style={{
                        padding: fullHeight ? "0" : "28px 36px 56px",
                        maxWidth: fullHeight ? "none" : "1180px",
                    }}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
