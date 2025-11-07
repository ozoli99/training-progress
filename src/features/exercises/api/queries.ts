"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TExerciseRow } from "@/features/exercises/dto";

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

export const exercisesKeys = {
  all: ["exercises"] as const,
  list: (
    orgId: string | undefined,
    params?: {
      search?: string;
      category?: string;
      modality?: string;
      limit?: number;
      offset?: number;
    }
  ) =>
    [
      ...exercisesKeys.all,
      "list",
      { orgId: orgId ?? "unknown", ...(params ?? {}) },
    ] as const,
  detail: (orgId: string | undefined, exerciseId: string | undefined) =>
    [
      ...exercisesKeys.all,
      "detail",
      { orgId: orgId ?? "unknown", id: exerciseId ?? "unknown" },
    ] as const,
};

export function useExercises(
  orgId: string | undefined,
  params?: {
    search?: string;
    category?: string;
    modality?: string;
    limit?: number;
    offset?: number;
  }
) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.category) qs.set("category", params.category);
  if (params?.modality) qs.set("modality", params.modality);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));

  return useQuery({
    enabled: !!orgId,
    queryKey: exercisesKeys.list(orgId, params),
    queryFn: () =>
      jsonFetch<TExerciseRow[]>(
        `/api/orgs/${orgId}/exercises${qs.toString() ? `?${qs.toString()}` : ""}`
      ),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useExercise(
  orgId: string | undefined,
  exerciseId: string | undefined
) {
  return useQuery({
    enabled: !!orgId && !!exerciseId,
    queryKey: exercisesKeys.detail(orgId, exerciseId),
    queryFn: () =>
      jsonFetch<TExerciseRow>(`/api/orgs/${orgId}/exercises/${exerciseId}`),
    staleTime: 30_000,
  });
}

export function useInvalidateExercises() {
  const qc = useQueryClient();
  return {
    list: (
      orgId: string,
      params?: {
        search?: string;
        category?: string;
        modality?: string;
        limit?: number;
        offset?: number;
      }
    ) =>
      qc.invalidateQueries({
        queryKey: exercisesKeys.list(orgId, params),
      }),
    detail: (orgId: string, exerciseId: string) =>
      qc.invalidateQueries({
        queryKey: exercisesKeys.detail(orgId, exerciseId),
      }),
  };
}
