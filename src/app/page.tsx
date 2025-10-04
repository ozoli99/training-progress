import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, LineChart, PlusCircle } from "lucide-react";

export default function Home() {
  return (
    <div>
      <section>
        <h1>Visualize your training. Improve with data.</h1>
        <p>Log daily workouts and see progress across exercises - volume, best sets, and estimated 1RM.</p>
        <div>
          <Button asChild>
            <Link href="/log">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add a Log
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">
              <LineChart className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/exercises">
              <Dumbbell className="mr-2 h-4 w-4" />
              Manage Exercises
            </Link>
          </Button>
        </div>
      </section>

      <section>
        <FeatureCard title="Fast Logging" description="Formik + Zod validation, dynamic sets, autosave drafts." icon={<PlusCircle className="h-4 w-4" />} href="/log" />
        <FeatureCard title="Trends & KPIs" description="Weekly volume and per-exercise trends using Recharts." icon={<LineChart className="h-4 w-4" />} href="/dashboard" />
        <FeatureCard title="Exercise Catalog" description="Create & organize exercises by type (reps, time, weight×reps)." icon={<Dumbbell className="h-4 w-4" />} href="/exercises" />
      </section>
    </div>
  );
}

function FeatureCard({ title, description, icon, href }: { title: string; description: string; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href}>
      <Card>
        <CardContent>
          <div>
            <span>{icon}</span>
            <span>{title}</span>
          </div>
          <p>{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}