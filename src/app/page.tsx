import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, LineChart, PlusCircle, ChevronRight } from "lucide-react";
import HeroLiveStats from "@/ui/components/HeroLiveStats";

export default function Home() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/60 to-background p-8 md:p-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" style={{ backgroundImage: "radial-gradient(1px 1px at 20px 20px, hsl(var(--muted-foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px", }} />
        <div className="relative">
          <p className="text-xs font-medium tracking-widest text-muted-foreground">Your training, at a glance.</p>
          <h1 id="hero-title" className="mt-2 text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
            Visualize your training.
            <span className="block text-muted-foreground font-normal">
              Improve with data.
            </span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl">
            Log daily workouts and see progress across exercises - volume, best sets, and estimated 1RM.
          </p>

          <HeroLiveStats />

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <Button asChild size="sm" className="sm:h-9">
              <Link href="/log">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add a Log
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="sm:h-9">
            <Link href="/dashboard">
              <LineChart className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="sm:h-9">
            <Link href="/exercises">
              <Dumbbell className="mr-2 h-4 w-4" />
              Manage Exercises
            </Link>
          </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard title="Fast Logging" description="Formik + Zod validation, dynamic sets, autosave drafts." icon={<PlusCircle className="h-4 w-4" />} href="/log" />
        <FeatureCard title="Trends & KPIs" description="Weekly volume and per-exercise trends using Recharts." icon={<LineChart className="h-4 w-4" />} href="/dashboard" />
        <FeatureCard title="Exercise Catalog" description="Create & organize exercises by type (reps, time, weight×reps)." icon={<Dumbbell className="h-4 w-4" />} href="/exercises" />
      </section>
    </div>
  );
}

function FeatureCard({ title, description, icon, href }: { title: string; description: string; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="group block focus:outline-none" aria-label={`${title} - ${description}`}>
      <Card className={[
          "relative transition-all",
          "hover:-translate-y-0.5 hover:shadow-lg",
          "focus-visible:ring-2 focus-visible:ring-primary",
        ].join(" ")}>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        />

        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-accent text-accent-foreground",
                  "bg-gradient-to-b from-background to-muted/60",
                ].join(" ")}
              >
                {icon}
              </span>
              <div className="flex flex-col">
                <span className="font-medium leading-none">{title}</span>
              </div>
            </div>

            <ChevronRight
              className="h-4 w-4 text-muted-foreground transition-all duration-200 translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>
          
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          
          <div className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
            <span className="underline-offset-4 group-hover:underline">Open</span>
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}