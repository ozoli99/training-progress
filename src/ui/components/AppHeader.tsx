"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/ui/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Dumbbell, LineChart, Menu, PlusCircle } from "lucide-react";

const NAV = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard", icon: LineChart },
    { href: "/log", label: "Add Log", icon: PlusCircle },
    { href: "/exercises", label: "Exercises", icon: Dumbbell },
];

export function AppHeader() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MobileNav pathname={pathname} />
                    <Link href="/" className="font-semibold tracking-tight">
                        Training <span className="text-primary">Progress</span>
                    </Link>

                    <nav className="ml-6 hidden md:flex items-center gap-1">
                        {NAV.map((n) => {
                            const Icon = n.icon;
                            const active = pathname === n.href;
                            return (
                                <Link
                                    key={n.href}
                                    href={n.href}
                                    className={[
                                        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                                        active
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                                    ].join(" ")}>
                                    {Icon ? <Icon size={16} /> : null}
                                    {n.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <Link href="/log">
                        <Button size="sm" aria-label="Quick add log" className="hidden sm:inline-flex">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Log
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}

function MobileNav({ pathname }: { pathname: string }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
                <div className="py-2">
                    <div className="font-semibold text-lg px-1 mb-2">Navigation</div>
                    <nav className="grid gap-1">
                        {NAV.map((n) => {
                            const Icon = n.icon;
                            const active = pathname === n.href;
                            return (
                                <Link
                                    key={n.href}
                                    href={n.href}
                                    className={[
                                        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                                        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                                    ].join(" ")}>
                                    {Icon ? <Icon size={16} /> : null}
                                    {n.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </SheetContent>
        </Sheet>
    );
}