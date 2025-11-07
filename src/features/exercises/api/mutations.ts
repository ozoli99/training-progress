"use client";

import { useMutation } from "@tanstack/react-query";
import type { TExerciseRow } from "@/features/exercises/dto";
import { useInvalidateExercises } from "./queries";

async function jsonFetch<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let body: any = undefined;
    try {
      body = await res.json();
    } catch {
      /* no-op */
    }
    const msg = body?.message || body?.error || res.statusText;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export function useCreateExercise(orgId: string) {
  const inv = useInvalidateExercises();
  return useMutation({
    mutationFn: (input: {
      name: string;
      category?: string;
      modality?: string;
      globalExerciseId?: string;
    }) =>
      jsonFetch<TExerciseRow>(`/api/orgs/${orgId}/exercises`, {
        method: "POST",
        body: JSON.stringify({ orgId, ...input }),
      }),
    onSuccess: async () => {
      await inv.list(orgId);
    },
  });
}

export function useUpdateExercise(orgId: string) {
  const inv = useInvalidateExercises();
  return useMutation({
    mutationFn: (input: {
      exerciseId: string;
      name?: string;
      category?: string | null;
      modality?: string | null;
      globalExerciseId?: string | null;
    }) =>
      jsonFetch<TExerciseRow>(
        `/api/orgs/${orgId}/exercises/${input.exerciseId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            orgId,
            exerciseId: input.exerciseId,
            name: input.name,
            category: input.category,
            modality: input.modality,
            globalExerciseId: input.globalExerciseId,
          }),
        }
      ),
    onSuccess: async (row) => {
      await inv.detail(orgId, row.id);
    },
  });
}

export function useDeleteExercise(orgId: string) {
  const inv = useInvalidateExercises();
  return useMutation({
    mutationFn: (input: { exerciseId: string }) =>
      fetch(`/api/orgs/${orgId}/exercises/${input.exerciseId}`, {
        method: "DELETE",
        credentials: "include",
      }).then((r) => {
        if (!r.ok) throw new Error(r.statusText);
      }),
    onSuccess: async () => {
      await inv.list(orgId);
    },
  });
}
