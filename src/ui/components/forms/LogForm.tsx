"use client";

import { Formik, Form, FieldArray, Field } from "formik";
import { makeZodFormikValidate } from "@/ui/lib/zodFormik";
import { logCreateSchema, type LogCreate } from "@/domain/schemas/log";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Exercise = { id: string; name: string; unit: "weight_reps" | "time" | "reps" };

export function LogForm() {
    const { data: exercises } = useQuery<Exercise[]>({
        queryKey: ["exercises"],
        queryFn: async () => (await fetch("/api/exercises")).json(),
    });

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [draftKey] = useState("logFormDraft");

    const initial: LogCreate = {
        date: today,
        exerciseId: exercises?.[0]?.id ?? "",
        notes: "",
        sets: [{ reps: 5, weight: 50 }],
    };

    const validate = makeZodFormikValidate(logCreateSchema);

    return (
        <Card>
            <CardContent>
                <Formik<LogCreate> enableReinitialize initialValues={
                    (typeof window !== "undefined" && localStorage.getItem(draftKey) ? JSON.parse(localStorage.getItem(draftKey)!) : { ...initial, exerciseId: exercises?.[0]?.id ?? "" }) as LogCreate
                } validate={validate} onSubmit={async (values, helpers) => {
                    const res = await fetch("/api/logs", { method: "POST", body: JSON.stringify(values) });
                    if (res.ok) {
                        localStorage.removeItem(draftKey);
                        toast.success("Logged ✅", { description: "Your training entry was saved." });
                        helpers.resetForm({ values: { ...values, notes: "" } });
                    } else {
                        toast.error("Validation failed", { description: "Check fields and try again." });
                    }
                }}>
                    {({ values, errors, setFieldValue }) => {
                        useEffect(() => {
                            const id = setTimeout(() => localStorage.setItem(draftKey, JSON.stringify(values)), 400);
                            return () => clearTimeout(id);
                        }, [values]);

                        return (
                            <Form>
                                <div>
                                    <div>
                                        <Label>Date</Label>
                                        <Input id="date" type="date" name="date" value={values.date} onChange={e => setFieldValue("date", e.target.value)} />
                                        {errors.date && <p>{String(errors.date)}</p>}
                                    </div>
                                    <div>
                                        <Label>Exercise</Label>
                                        <Select value={values.exerciseId} onValueChange={(v) => setFieldValue("exerciseId", v)}>
                                            <SelectTrigger><SelectValue placeholder="Pick exercise" /></SelectTrigger>
                                            <SelectContent>
                                                {(exercises ?? []).map((ex) => (
                                                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.exerciseId && <p>{String(errors.exerciseId)}</p>}
                                    </div>
                                    <div>
                                        <Button type="submit">Save</Button>
                                    </div>
                                </div>

                                <FieldArray name="sets">
                                    {({ push, remove }) => (
                                        <div>
                                            <div>
                                                <Label>Sets</Label>
                                                <Button type="button" variant="secondary" onClick={() => push({ reps: 5, weight: 50 })}>Add set</Button>
                                            </div>
                                            {values.sets.map((s, i) => (
                                                <div key={i}>
                                                    <div>
                                                        <Label>Reps</Label>
                                                        <Field as={Input} name={`sets.${i}.reps`} type="number" min={1} />
                                                    </div>
                                                    <div>
                                                        <Label>Weight</Label>
                                                        <Field as={Input} name={`sets.${i}.weight`} type="number" min={0} step="0.5" />
                                                    </div>
                                                    <div>
                                                        <Label>Time (sec)</Label>
                                                        <Field as={Input} name={`sets.${i}.timeSec`} type="number" min={0} />
                                                    </div>
                                                    <div>
                                                        <Label>RPE</Label>
                                                        <Field as={Input} name={`sets.${i}.rpe`} type="number" min={1} max={10} step="0.5" />
                                                    </div>
                                                    <div>
                                                        <Button type="button" variant="ghost" onClick={() => remove(i)}>✕</Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </FieldArray>

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Field as={Textarea} id="notes" name="notes" rows={3} placeholder="How did it feel?" />
                                </div>
                            </Form>
                        );
                    }}
                </Formik>
            </CardContent>
        </Card>
    );
}