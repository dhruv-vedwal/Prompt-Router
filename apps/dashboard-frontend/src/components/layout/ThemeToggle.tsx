import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex items-center justify-center rounded-[8px] transition-all size-8 flex-none relative"
            style={{
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground-2)",
                cursor: "pointer",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--border-2)";
                e.currentTarget.style.background = "var(--surface-2)";
                e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--background)";
                e.currentTarget.style.color = "var(--foreground-2)";
            }}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            <Sun className="h-[14px] w-[14px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[14px] w-[14px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}

