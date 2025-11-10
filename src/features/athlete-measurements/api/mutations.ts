"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { TAthleteMeasurementRow } from "@/features/athlete-measurements/dto";
import { measurementKeys } from "./queries";

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

export type CreateMeasurementInput = {
  orgId: string;
  athleteId: string;
  measuredAt: string;
  type: string;
  valueNum?: number | null;
  valueJson?: unknown | null;
  source?: string | null;
  notes?: string | null;
};

export type UpdateMeasurementInput = {
  orgId: string;
  athleteId: string;
  athleteMeasurementId: string;
  measuredAt?: string;
  type?: string;
  valueNum?: number | null;
  valueJson?: unknown | null;
  source?: string | null;
  notes?: string | null;
};

export type DeleteMeasurementInput = {
  orgId: string;
  athleteId: string;
  athleteMeasurementId: string;
};

async function createMeasurement(input: CreateMeasurementInput) {
  const { orgId, athleteId, ...body } = input;
  return apiFetch<TAthleteMeasurementRow>(
    `/api/orgs/${orgId}/athletes/${athleteId}/measurements`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

async function updateMeasurement(input: UpdateMeasurementInput) {
  const { orgId, athleteId, athleteMeasurementId, ...body } = input;
  return apiFetch<TAthleteMeasurementRow>(
    `/api/orgs/${orgId}/athletes/${athleteId}/measurements/${athleteMeasurementId}`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
}

async function deleteMeasurement(input: DeleteMeasurementInput) {
  const { orgId, athleteId, athleteMeasurementId } = input;
  await apiFetch<void>(
    `/api/orgs/${orgId}/athletes/${athleteId}/measurements/${athleteMeasurementId}`,
    { method: "DELETE" }
  );
}

export function useCreateAthleteMeasurementMutation(
  options?: UseMutationOptions<
    TAthleteMeasurementRow,
    Error,
    CreateMeasurementInput
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMeasurement,
    onSuccess: (data, variables, onMutateResult, context) => {
      qc.invalidateQueries({
        queryKey: measurementKeys.all(variables.orgId, variables.athleteId),
      });
      qc.setQueryData(
        measurementKeys.detail(variables.orgId, variables.athleteId, data.id),
        data
      );
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...options,
  });
}

export function useUpdateAthleteMeasurementMutation(
  options?: UseMutationOptions<
    TAthleteMeasurementRow,
    Error,
    UpdateMeasurementInput
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMeasurement,
    onSuccess: (data, variables, onMutateResult, context) => {
      qc.invalidateQueries({
        queryKey: measurementKeys.all(variables.orgId, variables.athleteId),
      });
      qc.setQueryData(
        measurementKeys.detail(variables.orgId, variables.athleteId, data.id),
        data
      );
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...options,
  });
}

export function useDeleteAthleteMeasurementMutation(
  options?: UseMutationOptions<void, Error, DeleteMeasurementInput>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMeasurement,
    onSuccess: (_res, variables, onMutateResult, context) => {
      qc.invalidateQueries({
        queryKey: measurementKeys.all(variables.orgId, variables.athleteId),
      });
      options?.onSuccess?.(_res, variables, onMutateResult, context);
    },
    ...options,
  });
}
