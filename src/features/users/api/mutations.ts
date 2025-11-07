"use client";

import { useMutation } from "@tanstack/react-query";
import type { TUserRow, TExternalIdentityRow } from "@/features/users/dto";
import { useInvalidateUsers } from "./queries";

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

export function useCreateUser() {
  const inv = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: {
      email: string;
      fullName?: string;
      avatarUrl?: string;
      clerkUserId?: string;
    }) =>
      jsonFetch<TUserRow>(`/api/users`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await inv.list();
    },
  });
}

export function useUpdateUser(userId: string) {
  const inv = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: {
      email?: string;
      fullName?: string | null;
      avatarUrl?: string | null;
    }) =>
      jsonFetch<TUserRow>(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ userId, ...input }),
      }),
    onSuccess: async () => {
      await inv.detail(userId);
      await inv.me();
    },
  });
}

export function useDeleteUser(userId: string) {
  const inv = useInvalidateUsers();
  return useMutation({
    mutationFn: () =>
      jsonFetch<void>(`/api/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await inv.list();
    },
  });
}

export function useSyncUserFromClerk() {
  const inv = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: {
      clerkUserId: string;
      email: string;
      fullName?: string;
      avatarUrl?: string;
    }) =>
      jsonFetch<TUserRow>(`/api/users/sync`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async (data) => {
      await inv.detail(data.id);
      await inv.me();
      await inv.list();
    },
  });
}

export function useCreateExternalIdentity(userId: string) {
  const inv = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: {
      provider: string;
      externalUserId: string;
      credentials?: unknown;
    }) =>
      jsonFetch<TExternalIdentityRow>(
        `/api/users/${userId}/external-identities`,
        {
          method: "POST",
          body: JSON.stringify({ userId, ...input }),
        }
      ),
    onSuccess: async () => {
      await inv.identities(userId);
    },
  });
}

export function useUpdateExternalIdentity(userId: string, id: string) {
  const inv = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { externalUserId?: string; credentials?: unknown }) =>
      jsonFetch<TExternalIdentityRow>(
        `/api/users/${userId}/external-identities/${id}`,
        {
          method: "PUT",
          body: JSON.stringify({ userId, id, ...input }),
        }
      ),
    onSuccess: async () => {
      await inv.identities(userId);
    },
  });
}

export function useDeleteExternalIdentity(userId: string, id: string) {
  const inv = useInvalidateUsers();
  return useMutation({
    mutationFn: () =>
      jsonFetch<void>(`/api/users/${userId}/external-identities/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await inv.identities(userId);
    },
  });
}
