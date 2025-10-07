"use client";

import { Formik, Form, Field } from "formik";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Loader2, Save } from "lucide-react";
import { useGetExercises } from "@/components/hooks/api/exercises";
import { useCreateLog } from "@/components/hooks/api/logs";
import { SummaryBar } from "./SummaryBar";
import { SetList } from "./SetList";
import { sum, ymd } from "@/lib/utils";
import { estimate1RM } from "@/lib/training";

const DRAFT_KEY = "logFormDraft";

export function LogForm() {
  const { data: exercises = [], isLoading: loadingExercises } =
    useGetExercises();
  const createLog = useCreateLog();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const firstExId = exercises?.[0]?.id ?? "";
  const initial: LogCreate = useMemo(
    () => ({
      date: ymd(),
      exerciseId: firstExId,
      notes: "",
      sets: [],
    }),
    [firstExId]
  );

  const validate = makeZodFormikValidate(logCreateSchema);

  const getExercise = (id?: string) => exercises?.find((ex) => ex.id === id);

  const [autosavedAt, setAutosavedAt] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  if (loadingExercises) {
    return (
      <div className="p-4 md:p-0 flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading exercises...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0">
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
              sets: [],
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
          // TODO: invesgate if this can remain in jsx
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
            ...values.sets.map((s) =>
              estimate1RM(Number(s.reps), Number(s.weight))
            )
          );
          const totalSecs = sum(values.sets.map((s) => Number(s.timeSec ?? 0)));

          const saveDisabled =
            isSubmitting ||
            !isValid ||
            Object.keys(touched).length === 0 ||
            !values.exerciseId ||
            values.sets.length === 0;

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
                    value={values.exerciseId ?? ""}
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
                      {exercises.map((ex) => (
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
                    disabled={saveDisabled}
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

              <SummaryBar
                unit={unit}
                volume={totalVolume}
                best1RM={best1RM}
                totalSecs={totalSecs}
                autosavedAt={autosavedAt}
              />

              {!values.exerciseId ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Pick an exercise to add sets.
                </div>
              ) : (
                <SetList unit={unit} valuesSets={values.sets} />
              )}

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
