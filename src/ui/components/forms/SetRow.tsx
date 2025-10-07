"use client";

import { Unit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "formik";
import { Trash2 } from "lucide-react";

type Props = {
  index: number;
  unit: Unit;
  onRemove: () => void;
};

export function SetRow({ index, unit, onRemove }: Props) {
  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      {(unit === "weight_reps" || unit === "reps") && (
        <div className="col-span-3 sm:col-span-2">
          <Label htmlFor={`sets.${index}.reps`}>Reps</Label>
          <Field
            as={Input}
            id={`sets.${index}.reps`}
            name={`sets.${index}.reps`}
            type="number"
            min={1}
          />
          <Field name={`sets.${index}.reps`}>
            {({ meta }: any) =>
              meta.touched && meta.error ? (
                <p className="text-xs text-red-500 mt-1">
                  {String(meta.error)}
                </p>
              ) : null
            }
          </Field>
        </div>
      )}

      {unit === "weight_reps" && (
        <div className="col-span-3 sm:col-span-2">
          <Label htmlFor={`sets.${index}.weight`}>Weight</Label>
          <Field
            as={Input}
            id={`sets.${index}.weight`}
            name={`sets.${index}.weight`}
            type="number"
            min={0}
            step="0.5"
          />
          <Field name={`sets.${index}.weight`}>
            {({ meta }: any) =>
              meta.touched && meta.error ? (
                <p className="text-xs text-red-500 mt-1">
                  {String(meta.error)}
                </p>
              ) : null
            }
          </Field>
        </div>
      )}

      {unit === "time" && (
        <div className="col-span-4 sm:col-span-3">
          <Label htmlFor={`sets.${index}.timeSec`}>Time (sec)</Label>
          <Field
            as={Input}
            id={`sets.${index}.timeSec`}
            name={`sets.${index}.timeSec`}
            type="number"
            min={0}
          />
          <Field name={`sets.${index}.timeSec`}>
            {({ meta }: any) =>
              meta.touched && meta.error ? (
                <p className="text-xs text-red-500 mt-1">
                  {String(meta.error)}
                </p>
              ) : null
            }
          </Field>
        </div>
      )}

      <div className="col-span-3 sm:col-span-2">
        <Label htmlFor={`sets.${index}.rpe`}>RPE</Label>
        <Field
          as={Input}
          id={`sets.${index}.rpe`}
          name={`sets.${index}.rpe`}
          type="number"
          min={1}
          max={10}
          step="0.5"
        />
        <Field name={`sets.${index}.rpe`}>
          {({ meta }: any) =>
            meta.touched && meta.error ? (
              <p className="text-xs text-red-500 mt-1">{String(meta.error)}</p>
            ) : null
          }
        </Field>
      </div>

      <div className="col-span-3 sm:col-span-1 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          aria-label="Remove set"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
