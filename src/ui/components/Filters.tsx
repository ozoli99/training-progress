"use client";

import { Metric } from "@/app/exercises/[id]/page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Unit } from "@/lib/types";

type Props = {
  start: string;
  end: string;
  unit: Unit;
  metric: Metric;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  onChangeMetric: (v: Metric) => void;
};

export function Filters({
  start,
  end,
  unit,
  metric,
  onChangeStart,
  onChangeEnd,
  onChangeMetric,
}: Props) {
  return (
    <div className="grid md:grid-cols-12 gap-4 items-end">
      <div className="md:col-span-3">
        <Label>Start</Label>
        <Input
          type="date"
          value={start}
          onChange={(e) => onChangeStart(e.target.value)}
        />
      </div>
      <div className="md:col-span-3">
        <Label>End</Label>
        <Input
          type="date"
          value={end}
          onChange={(e) => onChangeEnd(e.target.value)}
        />
      </div>
      <div className="md:col-span-6">
        <Label>Metric</Label>
        <Tabs value={metric} onValueChange={(v) => onChangeMetric(v as Metric)}>
          <TabsList className="w-full">
            <TabsTrigger value="one_rm" className="flex-1">
              Est. 1RM
            </TabsTrigger>
            <TabsTrigger value="volume" className="flex-1">
              {unit === "time" ? "Total Time" : "Volume"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
