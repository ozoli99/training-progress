// features/external-identities/queries.ts
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { TExternalIdentityItem } from "../dto";

export type Page<T> = { items: T[]; nextCursor: string | null };

const qk = {
  all: ["external-identities"] as const,
  list: (userId: string, provider?: string) =>
    [...qk.all, "list", { userId, provider }] as const,
  item: (userId: string, id: string) =>
    [...qk.all, "item", { userId, id }] as const,
};

function toQuery(params: Record<string, unknown | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = (body?.message || body?.error || msg) as string;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/** Raw request for list (useful for SSR or non-hook calls) */
export async function listExternalIdentitiesRequest(params: {
  userId: string;
  provider?: string;
  limit?: number;
  cursor?: string | null;
}): Promise<Page<TExternalIdentityItem>> {
  const { userId, provider, limit, cursor } = params;
  const q = toQuery({ provider, limit, cursor });
  return fetchJson<Page<TExternalIdentityItem>>(
    `/api/users/${userId}/external-identities${q}`
  );
}

/** Raw request for single item */
export async function getExternalIdentityRequest(params: {
  userId: string;
  id: string;
}): Promise<TExternalIdentityItem> {
  const { userId, id } = params;
  return fetchJson<TExternalIdentityItem>(
    `/api/users/${userId}/external-identities/${id}`
  );
}

export function useExternalIdentitiesInfinite(options: {
  userId: string;
  provider?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { userId, provider, limit, enabled = true } = options;

  return useInfiniteQuery<
    Page<TExternalIdentityItem>, // TData
    Error, // TError
    Page<TExternalIdentityItem>, // TData (again, for v5 selector chain)
    ReturnType<typeof qk.list>, // TQueryKey
    string | null // TPageParam
  >({
    queryKey: qk.list(userId, provider),
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      listExternalIdentitiesRequest({
        userId,
        provider,
        limit,
        cursor: (pageParam as string | null) ?? null,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && Boolean(userId),
    staleTime: 30_000,
  });
}

export function useExternalIdentity(params: {
  userId: string;
  id?: string;
  enabled?: boolean;
}) {
  const { userId, id, enabled = true } = params;

  return useQuery({
    queryKey: id ? qk.item(userId, id) : qk.all,
    queryFn: () => getExternalIdentityRequest({ userId, id: id! }),
    enabled: enabled && Boolean(userId && id),
    staleTime: 60_000,
  });
}

export const externalIdentityQueryKeys = qk;
