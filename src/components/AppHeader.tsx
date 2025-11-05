"use client";

import { usePathname } from "next/navigation";
import { Dumbbell, LineChart, PlusCircle } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { Brand } from "./Brand";
import { DesktopNav } from "./DesktopNav";
import { QuickActions } from "@/components/QuickActions";
import { NavItem } from "@/lib/types";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

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
      <div className="mx-auto w-full max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MobileNav items={NAV} />
          <Brand />
          <DesktopNav items={NAV} pathname={pathname} />
        </div>

        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="inline-flex items-center rounded-md px-3 py-2 text-sm border hover:bg-accent/60">
                Sign in
              </button>
            </SignInButton>

            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="inline-flex items-center rounded-md px-3 py-2 text-sm bg-primary text-primary-foreground hover:opacity-90">
                Create account
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <QuickActions />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
