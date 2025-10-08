"use client";

import { Exercise } from "@/components/hooks/api/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Unit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Dumbbell, Hash, Timer } from "lucide-react";
import Link from "next/link";

function unitMeta(unit: Unit) {
  switch (unit) {
    case "weight_reps":
      return {
        label: "weight × reps",
        help: "Track sets with load and repetitions.",
        icon: <Dumbbell className="h-4 w-4" />,
      };
    case "time":
      return {
        label: "time",
        help: "Track durations (e.g., intervals, runs).",
        icon: <Timer className="h-4 w-4" />,
      };
    case "reps":
    default:
      return {
        label: "reps",
        help: "Track bodyweight or count-only movements.",
        icon: <Hash className="h-4 w-4" />,
      };
  }
}

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const meta = unitMeta(exercise.unit);

  return (
    <Link
      key={exercise.id}
      href={`/exercises/${exercise.id}`}
      className="group block focus:outline-none"
    >
      <Card
        className={cn(
          "relative transition-all",
          "hover:-translate-y-0.5 hover:shadow-lg",
          "focus-visible:ring-2 focus-visible:ring-primary/60"
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                  "bg-accent/30 text-muted-foreground"
                )}
                aria-hidden
              >
                {meta.icon}
              </span>
              <div className="min-w-0">
                <div className="font-medium leading-tight truncate">
                  {exercise.name}
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-xs capitalize">
                    {meta.label}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{meta.help}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
