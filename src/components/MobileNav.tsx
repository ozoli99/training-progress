"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavItem } from "@/lib/types";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="py-2">
          <div className="font-semibold text-lg px-1 mb-2">Navigation</div>
          <nav className="grid gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/60",
                  ].join(" ")}
                >
                  {Icon ? <Icon size={16} /> : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
