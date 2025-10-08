"use client";

import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: React.ReactNode;
  subtle?: string;
};

export function KPI({ label, value, subtle }: Props) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold leading-tight">{value}</div>
        {subtle && (
          <div className="mt-1 text-xs text-muted-foreground">{subtle}</div>
        )}
      </CardContent>
    </Card>
  );
}
