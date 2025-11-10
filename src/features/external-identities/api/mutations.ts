import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TExternalIdentityItem } from "../dto";
import { externalIdentityQueryKeys as qk } from "./queries";

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
  // Some endpoints return 204; guard for empty body:
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

/** POST /api/users/:userId/external-identities */
export async function upsertExternalIdentityRequest(input: {
  userId: string;
  provider: string;
  externalUserId: string;
  credentials?: unknown;
}): Promise<TExternalIdentityItem> {
  const { userId, provider, externalUserId, credentials } = input;
  return fetchJson<TExternalIdentityItem>(
    `/api/users/${userId}/external-identities`,
    {
      method: "POST",
      body: JSON.stringify({ provider, externalUserId, credentials }),
    }
  );
}

/** PATCH /api/users/:userId/external-identities/:id */
export async function updateExternalIdentityCredentialsRequest(input: {
  userId: string;
  id: string;
  credentials: unknown;
}): Promise<void> {
  const { userId, id, credentials } = input;
  await fetchJson(`/api/users/${userId}/external-identities/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ credentials }),
  });
}

/** DELETE /api/users/:userId/external-identities/:id */
export async function removeExternalIdentityRequest(input: {
  userId: string;
  id: string;
}): Promise<void> {
  const { userId, id } = input;
  await fetchJson(`/api/users/${userId}/external-identities/${id}`, {
    method: "DELETE",
  });
}

/* ---------------------- React Query hooks ---------------------- */

export function useUpsertExternalIdentity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: upsertExternalIdentityRequest,
    onSuccess: (created, vars) => {
      // Refresh list for this user (all providers)
      qc.invalidateQueries({ queryKey: qk.list(vars.userId, undefined) });
      // Also refresh provider-specific list if caller likely filtered by provider
      qc.invalidateQueries({ queryKey: qk.list(vars.userId, vars.provider) });
      // Prime item cache
      if (created?.id) {
        qc.setQueryData(qk.item(vars.userId, created.id), created);
      }
    },
  });
}

export function useUpdateExternalIdentityCredentials() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateExternalIdentityCredentialsRequest,
    onSuccess: (_void, vars) => {
      // Refetch both item and list views
      qc.invalidateQueries({ queryKey: qk.item(vars.userId, vars.id) });
      qc.invalidateQueries({ queryKey: qk.list(vars.userId, undefined) });
    },
  });
}

export function useRemoveExternalIdentity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: removeExternalIdentityRequest,
    onSuccess: (_void, vars) => {
      // Drop the item and refresh lists
      qc.removeQueries({ queryKey: qk.item(vars.userId, vars.id) });
      qc.invalidateQueries({ queryKey: qk.list(vars.userId, undefined) });
    },
  });
}
