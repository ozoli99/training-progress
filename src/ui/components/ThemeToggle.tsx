"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const dark = resolvedTheme === "dark";

    return (
        <Button variant="ghost" onClick={() => setTheme(dark ? "light" : "dark")} aria-label="Toggle theme">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="ml-2 hidden sm:inline">{dark ? "Light" : "Dark"}</span>
        </Button>
    );
}