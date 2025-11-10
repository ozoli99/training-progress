import { cookies, headers } from "next/headers";
import { Suspense } from "react";
import AppHeaderClient, { type HeaderContext } from "./AppHeaderClient";

async function getHeaderContext(): Promise<HeaderContext> {
  try {
    const h = await headers();
    const c = await cookies();

    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    const base = host
      ? `${proto}://${host}`
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");

    const res = await fetch(`${base}/api/header-context`, {
      headers: { cookie: c.toString() },
      cache: "no-store",
      next: { revalidate: 10 },
    });

    if (!res.ok) throw new Error("ctx fetch failed");
    return (await res.json()) as HeaderContext;
  } catch {
    return {
      user: null,
      orgs: [],
      currentOrg: null,
      role: null,
      units: "metric",
      timezone: "UTC",
      defaultTrainingLocation: null,
      athletesICanLogFor: [],
      counts: { plannedToday: 0, unreadMessages: 0 },
    };
  }
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          <div className="hidden md:flex items-center gap-1">
            <div className="h-8 w-20 rounded bg-muted animate-pulse" />
            <div className="h-8 w-24 rounded bg-muted animate-pulse" />
            <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    </header>
  );
}

export default async function AppHeader() {
  const ctx = await getHeaderContext();
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <AppHeaderClient ctx={ctx} />
    </Suspense>
  );
}
