import Link from "next/link";
import { ArrowLeft, Home, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NotFound() {
  return (
    <div className="relative min-h-dvh grid place-items-center px-6 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,hsl(var(--primary)/.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]">
          <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border bg-card/80 backdrop-blur shadow-sm p-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <Compass className="h-3.5 w-3.5" />
            Lost in the gym?
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            404 — Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you’re looking for doesn’t exist, was moved, or the link is
            broken.
          </p>
          <form
            action="/search"
            method="GET"
            className="mx-auto flex items-center gap-2"
          >
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              <Input
                name="q"
                placeholder="Search exercises, sessions, athletes…"
                className="pl-8"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button asChild variant="secondary">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <Compass className="h-4 w-4 mr-2" />
                Open dashboard
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() =>
                typeof window !== "undefined" ? window.history.back() : null
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
            <Link
              href="/sessions"
              className="rounded-lg border p-3 text-sm hover:bg-accent/60 transition text-left"
            >
              Browse sessions →
            </Link>
            <Link
              href="/exercises"
              className="rounded-lg border p-3 text-sm hover:bg-accent/60 transition text-left"
            >
              Find exercises →
            </Link>
            <Link
              href="/help"
              className="rounded-lg border p-3 text-sm hover:bg-accent/60 transition text-left"
            >
              Help center →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
