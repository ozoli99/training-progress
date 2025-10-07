import { Dumbbell, LineChart, PlusCircle } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { Feature } from "@/lib/types";

const FEATURES: Feature[] = [
  {
    title: "Fast Logging",
    description: "Formik + Zod validation, dynamic sets, autosave drafts.",
    href: "/log",
    icon: <PlusCircle className="h-4 w-4" />,
  },
  {
    title: "Trends & KPIs",
    description: "Weekly volume and per-exercise trends using Recharts.",
    href: "/dashboard",
    icon: <LineChart className="h-4 w-4" />,
  },
  {
    title: "Exercise Catalog",
    description:
      "Create & organize exercises by type (reps, time, weight×reps).",
    href: "/exercises",
    icon: <Dumbbell className="h-4 w-4" />,
  },
];

export function FeatureGrid() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => (
        <FeatureCard key={feature.href} {...feature} />
      ))}
    </section>
  );
}
