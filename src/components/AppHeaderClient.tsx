"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Dumbbell,
  LineChart,
  MessageSquare,
  Plus,
  Timer,
  UserRound,
  MapPin,
} from "lucide-react";
import {
  OrganizationSwitcher,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useCallback, useEffect, useMemo, useState } from "react";

import RoleBadge from "@/features/auth/components/RoleBadge";

export type HeaderContext = {
  user: null | { id: string; email: string; name?: string; avatarUrl?: string };
  orgs: Array<{ id: string; name: string }>;
  currentOrg: null | { id: string; name: string };
  role: null | "owner" | "admin" | "coach" | "athlete";
  units: "metric" | "imperial";
  timezone: string;
  defaultTrainingLocation: null | { id: string; name: string };
  athletesICanLogFor: Array<{ id: string; displayName: string }>;
  counts: { plannedToday: number; unreadMessages: number };
};

type Props = { ctx: HeaderContext };

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LineChart },
  { href: "/sessions", label: "Sessions", icon: Timer },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/analytics", label: "Analytics", icon: LineChart },
] as const;

export default function AppHeaderClient({ ctx }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const currentOrgId = useMemo(() => {
    const fromUrl = pathname?.match(/^\/org\/([^/]+)/)?.[1];
    return ctx.currentOrg?.id ?? fromUrl ?? null;
  }, [ctx.currentOrg?.id, pathname]);

  const orgPath = useCallback(
    (path: string) => {
      const id = currentOrgId;
      return id ? `/org/${id}${path}` : path;
    },
    [currentOrgId]
  );

  const [units, setUnits] = useState<"metric" | "imperial">(ctx.units);
  const toggleUnits = useCallback(() => {
    setUnits((prev) => {
      const next = prev === "metric" ? "imperial" : "metric";
      if (currentOrgId) {
        fetch(`/api/orgs/${currentOrgId}/settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ units: next }),
        }).catch(() => setUnits(prev));
      }
      return next;
    });
  }, [currentOrgId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "." && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        router.push("/log/new-session");
      }
      if (e.key === "d" && (e as any).prevKey === "g")
        router.push("/dashboard");
      if (e.key === "s" && (e as any).prevKey === "g")
        router.push(orgPath("/sessions"));
      if (e.key === "e" && (e as any).prevKey === "g")
        router.push(orgPath("/exercises"));

      (e as any).prevKey = e.key;
      setTimeout(() => ((e as any).prevKey = null), 600);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, orgPath]);

  const switchAthlete = async (id: string) => {
    await fetch(`/api/active-athlete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId: id }),
    });
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            aria-label="Atlas home"
            className="font-semibold tracking-tight text-foreground hover:opacity-80"
          >
            Atlas
          </Link>
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-1"
          >
            {NAV.map(({ href, label, icon: Icon }) => {
              const needsOrg = ["/sessions", "/exercises", "/analytics"];
              const disabled = needsOrg.includes(href) && !currentOrgId;
              return (
                <Link
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : 0}
                  key={href}
                  href={disabled ? "#" : orgPath(href)}
                  aria-current={
                    pathname?.startsWith(orgPath(href)) ? "page" : undefined
                  }
                  className={cn(
                    buttonVariants({
                      variant: pathname?.startsWith(orgPath(href))
                        ? "secondary"
                        : "ghost",
                      size: "sm",
                    }),
                    "gap-2",
                    disabled && "pointer-events-none opacity-60"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <SignedIn>
            <div className="flex items-center gap-2">
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/dashboard"
                afterSelectOrganizationUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: "min-w-[160px]",
                    organizationSwitcherTrigger:
                      "h-9 px-3 text-sm inline-flex items-center gap-2 rounded-md border hover:bg-accent/60",
                    organizationSwitcherTriggerIcon: "h-4 w-4",
                    organizationPreviewMainIdentifier: "font-medium",
                  },
                }}
              />
              {currentOrgId && (
                <div className="hidden sm:block">
                  <RoleBadge orgId={currentOrgId} />
                </div>
              )}
            </div>
            {ctx.athletesICanLogFor.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserRound className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:block">
                      {ctx.athletesICanLogFor[0].displayName}
                    </span>
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={6}
                  className="min-w-56 max-h-72 overflow-auto"
                >
                  {ctx.athletesICanLogFor.map((a) => (
                    <DropdownMenuItem
                      key={a.id}
                      onClick={() => switchAthlete(a.id)}
                    >
                      {a.displayName}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={orgPath("/athletes")}>Manage athletes</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div className="hidden lg:flex items-center gap-2">
              {ctx.defaultTrainingLocation && (
                <span
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground"
                  title="Default training location"
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {ctx.defaultTrainingLocation.name}
                </span>
              )}
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link
                  href={orgPath("/sessions?filter=today")}
                  title="Planned sessions today"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1"
                  )}
                >
                  <Timer className="h-4 w-4" aria-hidden />
                  <span
                    aria-live="polite"
                    className="tabular-nums w-[2ch] text-center"
                  >
                    {String(ctx.counts.plannedToday ?? 0)}
                  </span>
                  <span className="sr-only">sessions today</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleUnits}
                title={`Timezone: ${ctx.timezone}`}
                aria-label={`Toggle units, currently ${units}`}
              >
                {units === "metric" ? "Metric" : "Imperial"}
              </Button>
            </div>
            <div className="h-9 grid place-items-center">
              <ThemeToggle />
            </div>
            <DropdownMenu>
              <div className="inline-flex rounded-md overflow-hidden border">
                <Link
                  href={orgPath("/sessions")}
                  title="Quick Add (.)"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "rounded-none gap-2"
                  )}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:block">Quick Add</span>
                </Link>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-none px-2"
                    aria-label="Open quick add menu"
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="min-w-56"
              >
                <DropdownMenuItem asChild>
                  <Link href="/log/new-session">New Session</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/log/new-set">Add Set Log</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/log/new-measurement">Record Measurement</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={orgPath("/exercises")}>Browse Exercises</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="relative gap-2"
            >
              <Link
                href={orgPath("/messages")}
                title="Messages"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "relative gap-2"
                )}
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                <span className="hidden sm:block">Messages</span>
                <span
                  aria-live="polite"
                  className={cn(
                    "absolute -top-1 -right-1 min-w-5 h-5 rounded-full text-[11px] grid place-items-center px-1",
                    ctx.counts.unreadMessages
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-transparent"
                  )}
                  style={{
                    visibility: ctx.counts.unreadMessages
                      ? "visible"
                      : "hidden",
                  }}
                >
                  {Math.min(ctx.counts.unreadMessages || 0, 99)}
                </span>
              </Link>
            </Button>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </SignedIn>
          <SignedOut>
            <div className="h-9 grid place-items-center">
              <ThemeToggle />
            </div>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <Button size="sm">Create account</Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
