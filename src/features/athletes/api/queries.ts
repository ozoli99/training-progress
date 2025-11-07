"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TAthleteRow,
  TAthleteWithRelations,
  TAthleteLocationRow,
  TAthleteVisibilityRow,
} from "@/features/athletes/dto";

function toParams(params: Record<string, unknown>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

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

export const athletesKeys = {
  all: ["athletes"] as const,
  byOrg: (orgId: string) => [...athletesKeys.all, orgId] as const,
  list: (
    orgId: string,
    params?: { search?: string; limit?: number; offset?: number }
  ) => [...athletesKeys.byOrg(orgId), "list", params ?? {}] as const,
  detail: (orgId: string, athleteId: string) =>
    [...athletesKeys.byOrg(orgId), "detail", athleteId] as const,
  locations: (orgId: string, athleteId: string) =>
    [...athletesKeys.byOrg(orgId), "locations", athleteId] as const,
  visibility: (orgId: string, athleteId: string) =>
    [...athletesKeys.byOrg(orgId), "visibility", athleteId] as const,
};

export function useAthletes(
  orgId: string | undefined,
  params?: { search?: string; limit?: number; offset?: number }
) {
  return useQuery({
    enabled: !!orgId,
    queryKey: athletesKeys.list(orgId || "unknown", params),
    queryFn: () =>
      jsonFetch<TAthleteRow[]>(
        `/api/orgs/${orgId}/athletes${toParams(params ?? {})}`
      ),
    staleTime: 15_000,
  });
}

export function useAthlete(
  orgId: string | undefined,
  athleteId: string | undefined
) {
  return useQuery({
    enabled: !!orgId && !!athleteId,
    queryKey: athletesKeys.detail(orgId || "unknown", athleteId || "unknown"),
    queryFn: () =>
      jsonFetch<TAthleteWithRelations>(
        `/api/orgs/${orgId}/athletes/${athleteId}`
      ),
    staleTime: 10_000,
  });
}

export function useAthleteLocations(
  orgId: string | undefined,
  athleteId: string | undefined
) {
  return useQuery({
    enabled: !!orgId && !!athleteId,
    queryKey: athletesKeys.locations(
      orgId || "unknown",
      athleteId || "unknown"
    ),
    queryFn: () =>
      jsonFetch<TAthleteLocationRow[]>(
        `/api/orgs/${orgId}/athletes/${athleteId}/locations`
      ),
    staleTime: 10_000,
  });
}

export function useAthleteVisibility(
  orgId: string | undefined,
  athleteId: string | undefined
) {
  return useQuery({
    enabled: !!orgId && !!athleteId,
    queryKey: athletesKeys.visibility(
      orgId || "unknown",
      athleteId || "unknown"
    ),
    queryFn: () =>
      jsonFetch<TAthleteVisibilityRow[]>(
        `/api/orgs/${orgId}/athletes/${athleteId}/visibility`
      ),
    staleTime: 10_000,
  });
}

export function useInvalidateAthletes() {
  const qc = useQueryClient();
  return {
    list: (orgId: string) =>
      qc.invalidateQueries({ queryKey: athletesKeys.list(orgId) }),
    detail: (orgId: string, athleteId: string) =>
      qc.invalidateQueries({ queryKey: athletesKeys.detail(orgId, athleteId) }),
    locations: (orgId: string, athleteId: string) =>
      qc.invalidateQueries({
        queryKey: athletesKeys.locations(orgId, athleteId),
      }),
    visibility: (orgId: string, athleteId: string) =>
      qc.invalidateQueries({
        queryKey: athletesKeys.visibility(orgId, athleteId),
      }),
    allForOrg: (orgId: string) =>
      qc.invalidateQueries({ queryKey: athletesKeys.byOrg(orgId) }),
  };
}
