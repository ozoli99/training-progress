"use client";

import { usePathname } from "next/navigation";
import { Dumbbell, LineChart, PlusCircle } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { Brand } from "./Brand";
import { DesktopNav } from "./DesktopNav";
import { QuickActions } from "./QuickActions";
import { NavItem } from "@/lib/types";

const NAV: NavItem[] = [
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
          <MobileNav items={NAV} />
          <Brand />
          <DesktopNav items={NAV} pathname={pathname} />
        </div>
        <QuickActions />
      </div>
    </header>
  );
}
