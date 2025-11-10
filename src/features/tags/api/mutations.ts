"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type MutationFunctionContext,
} from "@tanstack/react-query";
import type { TTagRow, TCreateTagInput, TPatchTagInput } from "../dto";
import { tagKeys } from "./queries";

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

export type CreateTagInput = TCreateTagInput;
export type UpdateTagInput = TPatchTagInput;
export type DeleteTagInput = { orgId: string; tagId: string };

async function createTag(input: CreateTagInput) {
  const { orgId, ...body } = input;
  return apiFetch<TTagRow>(`/api/orgs/${orgId}/tags`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function updateTag(input: UpdateTagInput) {
  const { orgId, tagId, ...body } = input;
  return apiFetch<TTagRow>(`/api/orgs/${orgId}/tags/${tagId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

async function deleteTag(input: DeleteTagInput) {
  const { orgId, tagId } = input;
  await apiFetch<void>(`/api/orgs/${orgId}/tags/${tagId}`, {
    method: "DELETE",
  });
}

export function useCreateTagMutation(
  options?: UseMutationOptions<TTagRow, Error, CreateTagInput>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: (
      data,
      variables,
      _onMutateResult,
      context: MutationFunctionContext
    ) => {
      qc.invalidateQueries({ queryKey: tagKeys.all(variables.orgId) });
      qc.setQueryData(tagKeys.detail(variables.orgId, data.id), data);
      options?.onSuccess?.(data, variables, _onMutateResult, context);
    },
    ...options,
  });
}

export function useUpdateTagMutation(
  options?: UseMutationOptions<TTagRow, Error, UpdateTagInput>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTag,
    onSuccess: (
      data,
      variables,
      _onMutateResult,
      context: MutationFunctionContext
    ) => {
      qc.invalidateQueries({ queryKey: tagKeys.all(variables.orgId) });
      qc.setQueryData(tagKeys.detail(variables.orgId, data.id), data);
      options?.onSuccess?.(data, variables, _onMutateResult, context);
    },
    ...options,
  });
}

export function useDeleteTagMutation(
  options?: UseMutationOptions<void, Error, DeleteTagInput>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: (
      _res,
      variables,
      _onMutateResult,
      context: MutationFunctionContext
    ) => {
      qc.removeQueries({
        queryKey: tagKeys.detail(variables.orgId, variables.tagId),
      });
      qc.invalidateQueries({ queryKey: tagKeys.all(variables.orgId) });
      options?.onSuccess?.(_res, variables, _onMutateResult, context);
    },
    ...options,
  });
}
