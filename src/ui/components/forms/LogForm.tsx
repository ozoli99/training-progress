"use client";

import { Formik, Form, FieldArray, Field } from "formik";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { makeZodFormikValidate } from "@/ui/lib/zodFormik";
import { logCreateSchema, type LogCreate } from "@/domain/schemas/log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Copy, Trash2, Save } from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  unit: "weight_reps" | "time" | "reps";
};

const DRAFT_KEY = "logFormDraft";

const ymd = (d = new Date()) => d.toISOString().slice(0, 10);
const est1RM = (reps?: number, weight?: number) =>
  !reps || !weight ? 0 : weight * (1 + reps / 30);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function LogForm() {
  const queryClient = useQueryClient();

  // todo: extract to custom hook, see log.ts for reference
  const { data: exercises, isLoading: loadingExercises } = useQuery<Exercise[]>(
    {
      queryKey: ["exercises"],
      queryFn: async () => (await fetch("/api/exercises")).json(),
    }
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const firstExId = exercises?.[0]?.id ?? "";
  const initial: LogCreate = useMemo(
    () => ({
      date: ymd(),
      exerciseId: firstExId,
      notes: "",
      // make this an empty array to force user to think about sets
      sets: [{ reps: 5, weight: 50 }],
    }),
    [firstExId]
  );

  const validate = makeZodFormikValidate(logCreateSchema);

  // todo: extract to custom hook, see log.ts for reference
  const createLog = useMutation({
    mutationFn: async (payload: LogCreate) => {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to create log");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast.success("Logged ✅", {
        description: "Your training entry was saved.",
      });
    },
    onError: () =>
      toast.error("Save failed", {
        description: "Check fields and try again.",
      }),
  });

  const getExercise = (id?: string) => exercises?.find((ex) => ex.id === id);

  const [autosavedAt, setAutosavedAt] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  return (
    <div className="p-4 md:p-0">
      {loadingExercises && (
        <div>
          <Loader2 />
          Loading exercises...
        </div>
      )}

      <Formik<LogCreate>
        enableReinitialize
        initialValues={
          mounted &&
          typeof window !== "undefined" &&
          localStorage.getItem(DRAFT_KEY)
            ? (JSON.parse(localStorage.getItem(DRAFT_KEY)!) as LogCreate)
            : { ...initial }
        }
        validate={validate}
        onSubmit={async (values, helpers) => {
          await createLog.mutateAsync(values);
          if (createLog.isSuccess) {
            localStorage.removeItem(DRAFT_KEY);
            const keep: LogCreate = {
              date: values.date,
              exerciseId: values.exerciseId,
              notes: "",
              sets: [{ reps: 5, weight: 50 }],
            };
            helpers.resetForm({ values: keep });
          }
        }}
      >
        {({
          values,
          errors,
          setFieldValue,
          setFieldTouched,
          isValid,
          touched,
          isSubmitting,
        }) => {
          // todo invesgate if this can remain in jsx
          useEffect(() => {
            if (!mounted) {
              return;
            }
            if (saveTimer.current) {
              window.clearTimeout(saveTimer.current);
            }
            saveTimer.current = window.setTimeout(() => {
              localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
              setAutosavedAt(Date.now());
            }, 400);
            return () => {
              if (saveTimer.current) {
                window.clearTimeout(saveTimer.current);
              }
            };
          }, [values, mounted]);

          const ex = getExercise(values.exerciseId);
          const unit = ex?.unit ?? "weight_reps";

          const totalVolume = sum(
            values.sets.map((s) => (s.reps && s.weight ? s.reps * s.weight : 0))
          );
          const best1RM = Math.max(
            0,
            ...values.sets.map((s) => est1RM(Number(s.reps), Number(s.weight)))
          );

          return (
            <Form className="grid gap-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    name="date"
                    value={values.date}
                    onChange={(e) => setFieldValue("date", e.target.value)}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500 mt-1">
                      {String(errors.date)}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Exercise</Label>
                  <Select
                    value={values.exerciseId}
                    name="exerciseId"
                    onOpenChange={(open) => {
                      if (!open) setFieldTouched("exerciseId", true);
                    }}
                    onValueChange={(v) => {
                      setFieldValue("exerciseId", v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {(exercises ?? []).map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>
                          {ex.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.exerciseId && touched.exerciseId && (
                    <p className="text-sm text-red-500 mt-1">
                      {String(errors.exerciseId)}
                    </p>
                  )}
                </div>
                <div className="self-end flex items-center gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isSubmitting ||
                      !isValid ||
                      Object.keys(touched).length === 0
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {unit === "weight_reps"
                    ? "This exercise tracks weight × reps."
                    : unit === "reps"
                      ? "This exercise tracks reps only."
                      : "This exercise tracks time (seconds)."}
                </span>
                <span className="hidden sm:inline text-muted-foreground">
                  •
                </span>
                <span className="text-muted-foreground">
                  <strong>Summary:</strong>{" "}
                  {unit === "time"
                    ? `${sum(values.sets.map((s) => Number(s.timeSec ?? 0)))} sec total`
                    : `Volume ${Math.round(totalVolume)}${unit === "reps" ? " reps" : ""}${unit === "weight_reps" ? "" : ""}${unit === "weight_reps" ? ` · est. 1RM ${Math.round(best1RM)}` : ""}`}
                </span>
                {autosavedAt && (
                  <>
                    <span className="hidden sm:inline text-muted-foreground">
                      •
                    </span>
                    <span className="text-muted-foreground">
                      Autosaved {new Date(autosavedAt).toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
              {/* TODO: when there is no exercise selected hide set array */}

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
                          onClick={() => push({ reps: 5, weight: 50 })}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add set
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const last = values.sets[values.sets.length - 1];
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

                    {values.sets.map((_, i) => (
                      <SetRow
                        key={i}
                        index={i}
                        unit={unit}
                        onRemove={() => remove(i)}
                      />
                    ))}
                  </div>
                )}
              </FieldArray>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Field
                  as={Textarea}
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="How did it feel?"
                />
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

function SetRow({
  index,
  unit,
  onRemove,
}: {
  index: number;
  unit: Exercise["unit"];
  onRemove: () => void;
}) {
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
