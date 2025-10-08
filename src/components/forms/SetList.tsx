"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Unit } from "@/lib/types";
import { FieldArray } from "formik";
import { Copy, Plus } from "lucide-react";
import { SetRow } from "./SetRow";

type Props = {
  unit: Unit;
  valuesSets: {
    reps?: number | undefined;
    weight?: number | undefined;
    timeSec?: number | undefined;
    rpe?: number | undefined;
  }[];
  disabled?: boolean;
};

export function SetList({ unit, valuesSets, disabled }: Props) {
  return (
    <FieldArray name="sets">
      {({ push, remove }) => (
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label>Sets</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  if (unit === "time") {
                    push({ timeSec: 30, rpe: 6 });
                  } else if (unit === "reps") {
                    push({ reps: 8, rpe: 7 });
                  } else {
                    push({ reps: 5, weight: 50, rpe: 8 });
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add set
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || valuesSets.length === 0}
                onClick={() => {
                  const last = valuesSets[valuesSets.length - 1];
                  if (last) {
                    push({ ...last });
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate last
              </Button>
            </div>
          </div>

          {valuesSets.map((_, i) => (
            <SetRow key={i} index={i} unit={unit} onRemove={() => remove(i)} />
          ))}
        </div>
      )}
    </FieldArray>
  );
}
