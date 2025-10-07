export type Unit = "weight_reps" | "time" | "reps";

export type SortDir = "asc" | "desc";

export type SeriesPoint = { x: string; y: number };
export type WeeklyPoint = { week: string; value: number };

export type Metric = "volume" | "one_rm";

export type Exercise = { id: string; name: string; unit: Unit };

export type Log = {
  id: string;
  exerciseId: string;
  date: string;
  exercise?: Exercise;
  sets: Array<{
    weight?: number;
    reps?: number;
    timeSec?: number;
    rpe?: number;
  }>;
};

export type Cta = {
  href: string;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "secondary" | "ghost";
};

export type Feature = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};
