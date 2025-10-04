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
        <header>
            <div>
                <div>
                    <MobileNav pathname={pathname} />
                    <Link href="/">Training <span>Progress</span></Link>

                    <nav>
                        {NAV.map((n) => {
                            const Icon = n.icon;
                            const active = pathname === n.href;
                            return (
                                <Link key={n.href} href={n.href} className={active ? "font-semibold" : "text-muted-foreground"}>
                                    {Icon ? <Icon size={16} /> : null}
                                    {n.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div>
                    <ThemeToggle />
                    <Separator orientation="vertical" />
                    <Link href="/log">
                        <Button size="sm" aria-label="Quick add log">
                            <PlusCircle className="mr-2" />
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
                <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <div>
                    <div>Navigation</div>
                    <nav>
                        {NAV.map((n) => {
                            const Icon = n.icon;
                            const active = pathname === n.href;
                            return (
                                <Link key={n.href} href={n.href} className={active ? "font-semibold" : "text-muted-foreground"}>
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