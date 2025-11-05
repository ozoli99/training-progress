"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 sm:p-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Train smarter. <span className="text-primary">See progress.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Atlas helps you plan, log, and analyze your training—so you can make
            better decisions, track trends, and hit your next PR with intent.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/log">Quick Log</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/exercises">Browse Exercises</Link>
            </Button>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">
            Built with Next.js · shadcn/ui · Drizzle · React Query
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 translate-x-8 -translate-y-6 opacity-70"
        >
          <div className="rounded-full border px-3 py-1 text-xs bg-background/80">
            v0.1.0 • Early Preview
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Structure blocks, sets, and progression rules. Assign programs and
            planned sessions that materialize into daily training.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Log</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Fast input for sets, workouts, intervals, and skills—optimized for
            speed on desktop and mobile.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Analyze</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Trends, estimated 1RMs, rolling volume, density, and readiness
            signals—turn data into actionable insight.
          </CardContent>
        </Card>
      </section>
      <Separator />
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ol className="space-y-3 list-decimal list-inside">
              <li>
                Go to{" "}
                <Link className="underline" href="/dashboard">
                  Dashboard
                </Link>{" "}
                and set your dev{" "}
                <code className="px-1 py-0.5 rounded bg-muted text-foreground">
                  athleteId
                </code>
                .
              </li>
              <li>
                Use <span className="font-medium">Quick Log</span> to add a
                measurement or record a workout.
              </li>
              <li>
                Review trends and KPIs—iterate on your plan with real data.
              </li>
            </ol>
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/log">Log Session</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>What’s included today</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-2">
              <li>• Exercises, sessions, planned sessions, sets</li>
              <li>• Athlete measurements (HRV, bodyweight, sleep, etc.)</li>
              <li>• Org + members + training locations</li>
              <li>• Basic analytics tables for sessions/workouts</li>
            </ul>
            <div className="mt-4 text-xs text-muted-foreground">
              Coming soon: richer dashboards, goal tracking, and coach views.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
