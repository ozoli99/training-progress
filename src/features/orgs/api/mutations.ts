"use client";

import { useMutation } from "@tanstack/react-query";
import type { TOrgRow, TOrgSettingsRow } from "@/features/orgs/dto";
import { useInvalidateOrgs } from "./queries";

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

export function useCreateOrg() {
  const inv = useInvalidateOrgs();
  return useMutation({
    mutationFn: (input: {
      name: string;
      ownerUserId?: string;
      clerkOrgId?: string;
    }) =>
      jsonFetch<TOrgRow>("/api/orgs", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await inv.list();
    },
  });
}

export function useAddOrgMember(orgId: string) {
  const inv = useInvalidateOrgs();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      role: "owner" | "admin" | "coach" | "athlete";
      clerkMembershipId?: string;
    }) =>
      jsonFetch<void>(`/api/orgs/${orgId}/members`, {
        method: "POST",
        body: JSON.stringify({ orgId, ...input }),
      }),
    onSuccess: async () => {
      await inv.members(orgId);
    },
  });
}

export function useSetOrgSettings(orgId: string) {
  const inv = useInvalidateOrgs();
  return useMutation({
    mutationFn: (input: {
      units?: "metric" | "imperial";
      timezone?: string;
      defaultTrainingLocationId?: string | null;
      preferences?: unknown;
    }) =>
      jsonFetch<TOrgSettingsRow>(`/api/orgs/${orgId}/settings`, {
        method: "PUT",
        body: JSON.stringify({ orgId, ...input }),
      }),
    onSuccess: async () => {
      await inv.detail(orgId);
    },
  });
}

export function useChangeMemberRole(orgId: string) {
  const inv = useInvalidateOrgs();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      role: "owner" | "admin" | "coach" | "athlete";
    }) =>
      jsonFetch<void>(`/api/orgs/${orgId}/members/${input.userId}`, {
        method: "PUT",
        body: JSON.stringify({ orgId, userId: input.userId, role: input.role }),
      }),
    onSuccess: async (_, vars) => {
      await inv.members(orgId);
    },
  });
}

export function useRemoveMember(orgId: string) {
  const inv = useInvalidateOrgs();
  return useMutation({
    mutationFn: (input: { userId: string }) =>
      jsonFetch<void>(`/api/orgs/${orgId}/members/${input.userId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await inv.members(orgId);
    },
  });
}

export function useSyncClerkUser() {
  return useMutation({
    mutationFn: (input: {
      clerkUserId: string;
      email: string;
      fullName?: string;
      avatarUrl?: string;
    }) =>
      jsonFetch<{ userId: string }>(`/api/orgs/clerk/sync-user`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useUpsertOrgFromClerk() {
  const inv = useInvalidateOrgs();
  return useMutation({
    mutationFn: (input: {
      clerkOrgId: string;
      name: string;
      ownerUserId?: string;
    }) =>
      jsonFetch<TOrgRow>(`/api/orgs/clerk/upsert-org`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await inv.list();
    },
  });
}
