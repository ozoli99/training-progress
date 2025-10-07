import HeroLiveStats from "./HeroLiveStats";
import { Dumbbell, LineChart, PlusCircle } from "lucide-react";
import { BackgroundDots } from "./BackgroundDots";
import { Cta, CtaButton } from "./CtaButton";

const CTAs: Cta[] = [
  {
    href: "/log",
    label: "Add a Log",
    icon: <PlusCircle className="mr-2 h-4 w-4" />,
  },
  {
    href: "/dashboard",
    label: "View Dashboard",
    icon: <LineChart className="mr-2 h-4 w-4" />,
    variant: "secondary",
  },
  {
    href: "/exercises",
    label: "Manage Exercises",
    icon: <Dumbbell className="mr-2 h-4 w-4" />,
    variant: "ghost",
  },
];

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/60 to-background p-8 md:p-12"
    >
      <BackgroundDots />
      <div className="relative">
        <p className="text-xs font-medium tracking-widest text-muted-foreground">
          Your training, at a glance.
        </p>
        <h1
          id="hero-title"
          className="mt-2 text-3xl md:text-4xl font-semibold leading-tight tracking-tight"
        >
          Visualize your training.
          <span className="block text-muted-foreground font-normal">
            Improve with data.
          </span>
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl">
          Log daily workouts and see progress across exercises - volume, best
          sets, and estimated 1RM.
        </p>
        <HeroLiveStats />
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {CTAs.map((cta) => (
            <CtaButton key={cta.href} {...cta} />
          ))}
        </div>
      </div>
    </section>
  );
}
