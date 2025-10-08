"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  exerciseCreateSchema,
  type ExerciseCreate,
} from "@/domain/schemas/exercise";
import { Formik, Form, Field } from "formik";
import { makeZodFormikValidate } from "@/lib/zodFormik";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ExerciseCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: ExerciseCreate) => {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to create exercise");
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
      onCreated?.();
      onOpenChange?.(false);
    },
    onError: () => toast.error("Failed to create exercise"),
  });

  const validate = makeZodFormikValidate(exerciseCreateSchema);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Exercise</DialogTitle>
          <DialogDescription>
            Choose a clear, specific name and how you’ll track it.
          </DialogDescription>
        </DialogHeader>
        <Formik<ExerciseCreate>
          initialValues={{ name: "", unit: "weight_reps" }}
          validate={validate}
          // TODO handle submit
          onSubmit={(v, helpers) => {
            mutation.mutate(v, {
              onSuccess: () =>
                helpers.resetForm({
                  values: { name: "", unit: "weight_reps" },
                }),
            });
          }}
        >
          {({ errors, handleSubmit, setFieldValue, values, isSubmitting }) => (
            <Form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Back Squat"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {String(errors.name)}
                  </p>
                )}
              </div>

              <div>
                <Label>Unit</Label>
                <Select
                  value={values.unit}
                  onValueChange={(v) => setFieldValue("unit", v)}
                  disabled={isSubmitting || mutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_reps">Weight × Reps</SelectItem>
                    <SelectItem value="reps">Reps</SelectItem>
                    <SelectItem value="time">Time</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Pick how you’ll record sets for this exercise.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
              >
                {isSubmitting || mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
