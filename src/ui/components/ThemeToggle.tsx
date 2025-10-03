"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <Button variant="ghost" aria-label="Toggle theme" disabled>
                <Sun size={16} />
                <span className="ml-2 hidden sm:inline">Theme</span>
            </Button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button variant="ghost" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label="Toggle theme">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="ml-2 hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
        </Button>
    );
}