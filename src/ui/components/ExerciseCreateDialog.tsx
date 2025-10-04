"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exerciseCreateSchema, type ExerciseCreate } from "@/domain/schemas/exercise";
import { Formik, Form, Field } from "formik";
import { makeZodFormikValidate } from "@/ui/lib/zodFormik";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function ExerciseCreateDialog() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (payload: ExerciseCreate) => {
            const res = await fetch("/api/exercises", { method: "POST", body: JSON.stringify(payload) });
            if (!res.ok) throw new Error("Failed to create exercise");
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
    });

    return (
        <Dialog>
            <DialogTrigger asChild><Button size="sm">New Exercise</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Create Exercise</DialogTitle></DialogHeader>
                <Formik<ExerciseCreate>
                    initialValues={{ name: "", unit: "weight_reps" }}
                    validate={makeZodFormikValidate(exerciseCreateSchema)}
                    onSubmit={v => mutation.mutate(v)}
                >
                    {({ errors, handleSubmit, setFieldValue, values }) => (
                        <Form onSubmit={handleSubmit}>
                            <div>
                                <Label>Name</Label>
                                <Field as={Input} name="name" placeholder="Back Squat" />
                                {errors.name && <p>{String(errors.name)}</p>}
                            </div>
                            <div>
                                <Label>Unit</Label>
                                <Select value={values.unit} onValueChange={v => setFieldValue("unit", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weight_reps">Weight × Reps</SelectItem>
                                        <SelectItem value="reps">Reps</SelectItem>
                                        <SelectItem value="time">Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit">Create</Button>
                        </Form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
}