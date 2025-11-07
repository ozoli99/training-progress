"use client";

import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { TUserRow, TExternalIdentityRow } from "@/features/users/dto";

async function jsonFetch<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
  });
  if (!res.ok) {
    let body: any = undefined;
    try {
      body = await res.json();
    } catch {}
    const msg = body?.message || body?.error || res.statusText;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const usersKeys = {
  all: ["users"] as const,
  list: (search?: string, limit?: number, offset?: number) =>
    [
      ...usersKeys.all,
      "list",
      { search: search ?? "", limit: limit ?? 20, offset: offset ?? 0 },
    ] as const,
  detail: (userId: string) => [...usersKeys.all, "detail", userId] as const,
  me: () => [...usersKeys.all, "me"] as const,
  identities: (userId: string) =>
    [...usersKeys.all, "identities", userId] as const,
};

export function useUsers(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, limit, offset } = params ?? {};
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (limit) qs.set("limit", String(limit));
  if (offset) qs.set("offset", String(offset));

  return useQuery<TUserRow[]>({
    queryKey: usersKeys.list(search, limit, offset),
    queryFn: () =>
      jsonFetch<TUserRow[]>(`/api/users${qs.toString() ? `?${qs}` : ""}`),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useUser(userId: string | undefined) {
  return useQuery<TUserRow>({
    enabled: !!userId,
    queryKey: usersKeys.detail(userId || "unknown"),
    queryFn: () => jsonFetch<TUserRow>(`/api/users/${userId}`),
    staleTime: 30_000,
  });
}

export function useMe() {
  return useQuery<TUserRow>({
    queryKey: usersKeys.me(),
    queryFn: () => jsonFetch<TUserRow>(`/api/users/me`),
    staleTime: 30_000,
  });
}

export function useUserExternalIdentities(userId: string | undefined) {
  return useQuery<
    { items: TExternalIdentityRow[] },
    Error,
    TExternalIdentityRow[]
  >({
    enabled: !!userId,
    queryKey: usersKeys.identities(userId || "unknown"),
    queryFn: () =>
      jsonFetch<{ items: TExternalIdentityRow[] }>(
        `/api/users/${userId}/external-identities`
      ),
    select: (r) => r.items,
    staleTime: 30_000,
  });
}

export function useInvalidateUsers() {
  const qc = useQueryClient();
  return {
    list: (opts?: { search?: string; limit?: number; offset?: number }) =>
      qc.invalidateQueries({
        queryKey: usersKeys.list(opts?.search, opts?.limit, opts?.offset),
      }),
    detail: (userId: string) =>
      qc.invalidateQueries({ queryKey: usersKeys.detail(userId) }),
    me: () => qc.invalidateQueries({ queryKey: usersKeys.me() }),
    identities: (userId: string) =>
      qc.invalidateQueries({ queryKey: usersKeys.identities(userId) }),
  };
}
