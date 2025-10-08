"use client";

import { Card, CardContent } from "@/components/ui/card";

type Props = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtle?: string;
  className?: string;
};

export function KPICard({ icon, label, value, subtle, className }: Props) {
  return (
    <Card
      className={[
        "relative transition-all hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/60",
        className ?? "",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-accent/30 text-accent-foreground">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 text-2xl font-semibold leading-tight">
              {value}
            </div>
            {subtle && (
              <div className="mt-1 text-xs text-muted-foreground">{subtle}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
