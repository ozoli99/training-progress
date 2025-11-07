"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TOrgRow,
  TOrgWithSettings,
  TOrgMemberRow,
} from "@/features/orgs/dto";

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

export const orgsKeys = {
  all: ["orgs"] as const,
  listMe: () => [...orgsKeys.all, "list-me"] as const,
  detail: (orgId: string) => [...orgsKeys.all, "detail", orgId] as const,
  members: (orgId: string) => [...orgsKeys.all, "members", orgId] as const,
};

export function useUserOrgs() {
  return useQuery({
    queryKey: orgsKeys.listMe(),
    queryFn: () => jsonFetch<TOrgRow[]>("/api/orgs"),
    staleTime: 30_000,
  });
}

export function useOrgWithSettings(orgId: string | undefined) {
  return useQuery({
    enabled: !!orgId,
    queryKey: orgsKeys.detail(orgId || "unknown"),
    queryFn: () => jsonFetch<TOrgWithSettings>(`/api/orgs/${orgId}`),
    staleTime: 15_000,
  });
}

export function useOrgMembers(orgId: string | undefined) {
  return useQuery({
    enabled: !!orgId,
    queryKey: orgsKeys.members(orgId || "unknown"),
    queryFn: () =>
      jsonFetch<{ items: TOrgMemberRow[] }>(`/api/orgs/${orgId}/members`),
    select: (r) => r.items,
    staleTime: 15_000,
  });
}

export function useInvalidateOrgs() {
  const qc = useQueryClient();
  return {
    list: () => qc.invalidateQueries({ queryKey: orgsKeys.listMe() }),
    detail: (orgId: string) =>
      qc.invalidateQueries({ queryKey: orgsKeys.detail(orgId) }),
    members: (orgId: string) =>
      qc.invalidateQueries({ queryKey: orgsKeys.members(orgId) }),
  };
}
