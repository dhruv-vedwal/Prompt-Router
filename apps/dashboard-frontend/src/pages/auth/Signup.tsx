import { useElysiaClient } from "@/providers/Eden";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export function Signup() {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const elysiaClient = useElysiaClient();
    const navigate = useNavigate();

    const mutation = useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const response = await elysiaClient.auth["sign-up"].post({ email, password });
            if (response.error) {
                const errValue = response.error.value as { message?: string } | undefined;
                throw new Error(errValue?.message || "Registration failed");
            }
            return response.data;
        },
        onSuccess: () => {
            setTimeout(() => navigate("/dashboard"), 600);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            email: emailRef.current?.value ?? "",
            password: passwordRef.current?.value ?? "",
        });
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: "var(--background)" }}
        >
            {/* Subtle bg blob */}
            <div
                className="pointer-events-none fixed"
                style={{
                    width: 480,
                    height: 480,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(62,99,221,0.10) 0%, transparent 70%)",
                    bottom: "-80px",
                    right: "-100px",
                    filter: "blur(40px)",
                }}
            />

            <div className="w-full max-w-[380px] px-4">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <span
                        className="w-[22px] h-[22px] flex items-center justify-center rounded-[6px] flex-none"
                        style={{ background: "var(--accent-blue)" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]">
                            <path d="M6 18v-6h9V6"/>
                        </svg>
                    </span>
                    <span className="text-[14px] font-[600]">PromptRouter</span>
                </div>

                {/* Card */}
                <div
                    className="rounded-[10px] overflow-hidden"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <div className="px-6 pt-6 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <h1 className="text-[18px] font-[600] tracking-[-0.01em] m-0 mb-1">Create account</h1>
                        <p className="text-[13px] m-0" style={{ color: "var(--foreground-2)" }}>
                            Start routing LLM requests with PromptRouter.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4">
                        {/* Error state */}
                        {mutation.isError && (
                            <div
                                className="flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-[12.5px]"
                                style={{ background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)", color: "#e5484d" }}
                            >
                                <AlertCircle className="size-4 flex-none" />
                                {mutation.error?.message || "Registration failed"}
                            </div>
                        )}

                        {/* Success state */}
                        {mutation.isSuccess && (
                            <div
                                className="flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-[12.5px]"
                                style={{ background: "rgba(62,179,95,0.08)", border: "1px solid rgba(62,179,95,0.2)", color: "#3EB35F" }}
                            >
                                <CheckCircle2 className="size-4 flex-none" />
                                Account created! Redirecting…
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-[500]" style={{ color: "var(--foreground-2)" }}>
                                Email address
                            </label>
                            <input
                                ref={emailRef}
                                type="email"
                                required
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="w-full h-9 px-3 rounded-[6px] text-[13px] outline-none transition-all"
                                style={{
                                    background: "var(--background)",
                                    border: "1px solid var(--border)",
                                    color: "var(--foreground)",
                                    fontFamily: "var(--font-sans)",
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-[500]" style={{ color: "var(--foreground-2)" }}>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    ref={passwordRef}
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="Min 8 characters"
                                    autoComplete="new-password"
                                    minLength={8}
                                    className="w-full h-9 px-3 pr-10 rounded-[6px] text-[13px] outline-none transition-all"
                                    style={{
                                        background: "var(--background)",
                                        border: "1px solid var(--border)",
                                        color: "var(--foreground)",
                                        fontFamily: "var(--font-sans)",
                                    }}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: "var(--foreground-3)" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground-2)")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-3)")}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={mutation.isPending || mutation.isSuccess}
                            className="w-full h-9 rounded-[6px] text-[13px] font-[500] text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: "var(--accent-blue)" }}
                            onMouseEnter={e => { if (!mutation.isPending) e.currentTarget.style.background = "var(--accent-blue-hover)"; }}
                            onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-blue)")}
                        >
                            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                            {mutation.isPending ? "Creating account…" : "Create account"}
                        </button>

                        <p className="text-center text-[12.5px]" style={{ color: "var(--foreground-3)" }}>
                            Already have an account?{" "}
                            <Link
                                to="/signin"
                                className="transition-colors"
                                style={{ color: "var(--accent-blue-text)" }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                            >
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
