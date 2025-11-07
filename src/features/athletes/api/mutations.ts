"use client";

import { useMutation } from "@tanstack/react-query";
import type {
  TAthleteRow,
  TAthleteWithRelations,
  TAthleteVisibilityRow,
} from "@/features/athletes/dto";
import { useInvalidateAthletes } from "./queries";

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
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}

export function useCreateAthlete(orgId: string) {
  const inv = useInvalidateAthletes();
  return useMutation({
    mutationFn: (input: {
      displayName: string;
      email?: string;
      clerkUserId?: string;
    }) =>
      jsonFetch<TAthleteRow>(`/api/orgs/${orgId}/athletes`, {
        method: "POST",
        body: JSON.stringify({ orgId, ...input }),
      }),
    onSuccess: async () => {
      await inv.list(orgId);
    },
  });
}

export function useUpdateAthlete(orgId: string, athleteId: string) {
  const inv = useInvalidateAthletes();
  return useMutation({
    mutationFn: (input: { displayName?: string; email?: string | null }) =>
      jsonFetch<TAthleteWithRelations>(
        `/api/orgs/${orgId}/athletes/${athleteId}`,
        {
          method: "PUT",
          body: JSON.stringify({ orgId, athleteId, ...input }),
        }
      ),
    onSuccess: async () => {
      await inv.detail(orgId, athleteId);
      await inv.list(orgId);
    },
  });
}

export function useDeleteAthlete(orgId: string, athleteId: string) {
  const inv = useInvalidateAthletes();
  return useMutation({
    mutationFn: () =>
      jsonFetch<void>(`/api/orgs/${orgId}/athletes/${athleteId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await inv.list(orgId);
    },
  });
}

export function useLinkAthleteLocation(orgId: string, athleteId: string) {
  const inv = useInvalidateAthletes();
  return useMutation({
    mutationFn: (input: { trainingLocationId: string; isDefault?: boolean }) =>
      jsonFetch<void>(`/api/orgs/${orgId}/athletes/${athleteId}/locations`, {
        method: "POST",
        body: JSON.stringify({ orgId, athleteId, ...input }),
      }),
    onSuccess: async () => {
      await inv.locations(orgId, athleteId);
      await inv.detail(orgId, athleteId);
    },
  });
}

export function useUnlinkAthleteLocation(orgId: string, athleteId: string) {
  const inv = useInvalidateAthletes();
  return useMutation({
    mutationFn: (input: { trainingLocationId: string }) =>
      jsonFetch<void>(
        `/api/orgs/${orgId}/athletes/${athleteId}/locations/${input.trainingLocationId}`,
        { method: "DELETE" }
      ),
    onSuccess: async () => {
      await inv.locations(orgId, athleteId);
      await inv.detail(orgId, athleteId);
    },
  });
}

export function useSetDefaultAthleteLocation(orgId: string, athleteId: string) {
  const inv = useInvalidateAthletes();
  return useMutation({
    mutationFn: (input: { trainingLocationId: string }) =>
      jsonFetch<void>(
        `/api/orgs/${orgId}/athletes/${athleteId}/locations/${input.trainingLocationId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            orgId,
            athleteId,
            trainingLocationId: input.trainingLocationId,
            isDefault: true,
          }),
        }
      ),
    onSuccess: async () => {
      await inv.locations(orgId, athleteId);
      await inv.detail(orgId, athleteId);
    },
  });
}

export function useSetAthleteVisibility(orgId: string, athleteId: string) {
  const inv = useInvalidateAthletes();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      canView?: boolean;
      canLog?: boolean;
      canViewCoachNotes?: boolean;
    }) =>
      jsonFetch<TAthleteVisibilityRow>(
        `/api/orgs/${orgId}/athletes/${athleteId}/visibility`,
        {
          method: "POST",
          body: JSON.stringify({ orgId, athleteId, ...input }),
        }
      ),
    onSuccess: async () => {
      await inv.visibility(orgId, athleteId);
    },
  });
}
