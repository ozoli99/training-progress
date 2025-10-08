import { Button } from "@/components/ui/button";
import { Unit } from "@/lib/types";
import { Dumbbell, Hash, PlusCircle, Timer } from "lucide-react";
import Link from "next/link";

function unitMeta(unit: Unit) {
  switch (unit) {
    case "weight_reps":
      return {
        label: "weight × reps",
        icon: <Dumbbell className="h-4 w-4" />,
        help: "Load and repetitions per set.",
      };
    case "time":
      return {
        label: "time",
        icon: <Timer className="h-4 w-4" />,
        help: "Track total duration in seconds.",
      };
    default:
      return {
        label: "reps",
        icon: <Hash className="h-4 w-4" />,
        help: "Count-only movements.",
      };
  }
}

type Props = {
  id: string;
  name: string;
  unit: Unit;
};

export function HeaderCard({ id, name, unit }: Props) {
  const meta = unitMeta(unit);

  return (
    <div className="rounded-2xl border bg-gradient-to-b from-muted/60 to-background p-6 md:p-8 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 20px, hsl(var(--muted-foreground)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
            {name}
          </h2>
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border bg-muted px-2 py-0.5 text-xs capitalize">
              {meta.icon} {meta.label}
            </span>
            <span className="text-xs text-muted-foreground">{meta.help}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/log?exerciseId=${id}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Log
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
