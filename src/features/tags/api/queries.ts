"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { TTagRow } from "../dto";

export type ListTagsParams = {
  orgId: string;
  kind?: string;
  q?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "name" | "createdAt";
  order?: "asc" | "desc";
};

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

function toSearchParams(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "boolean") sp.set(k, v ? "true" : "false");
    else sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const tagKeys = {
  root: ["tags"] as const,
  all: (orgId: string) => [...tagKeys.root, orgId] as const,
  list: (orgId: string, params?: Omit<ListTagsParams, "orgId">) =>
    [...tagKeys.all(orgId), "list", params ?? {}] as const,
  detail: (orgId: string, tagId: string) =>
    [...tagKeys.all(orgId), "detail", tagId] as const,
};

export function useTagsQuery(
  params: ListTagsParams,
  options?: UseQueryOptions<TTagRow[], Error>
) {
  const { orgId, ...rest } = params;
  const search = toSearchParams({
    ...rest,
    limit: rest.limit ?? 50,
    offset: rest.offset ?? 0,
    orderBy: rest.orderBy ?? "name",
    order: rest.order ?? "asc",
  });

  return useQuery({
    queryKey: tagKeys.list(orgId, { ...rest }),
    queryFn: () =>
      apiFetch<TTagRow[]>(`/api/orgs/${orgId}/tags${search}`, {
        method: "GET",
      }),
    ...options,
  });
}

export function useTagDetailQuery(
  input: { orgId: string; tagId: string },
  options?: UseQueryOptions<TTagRow | null, Error>
) {
  const { orgId, tagId } = input;
  return useQuery({
    queryKey: tagKeys.detail(orgId, tagId),
    queryFn: () =>
      apiFetch<TTagRow>(`/api/orgs/${orgId}/tags/${tagId}`, {
        method: "GET",
      }).catch((e) => {
        if (String(e?.message || "").includes("404")) return null;
        throw e;
      }),
    ...options,
  });
}
