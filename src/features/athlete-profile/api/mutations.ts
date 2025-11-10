import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AthleteProfileRow,
  AthleteProfileMetricRow,
  UpsertAthleteProfileInput,
  UpdateAthleteProfileInput,
  DeleteAthleteProfileInput,
  SetProfileMetricInput,
} from "../dto";
import type { TAthleteProfileRow, TAthleteProfileMetricRow } from "../dto";
import { z } from "zod";

async function sendJSON<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${method} ${url} failed: ${res.status} ${txt}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export async function upsertAthleteProfile(
  input: z.infer<typeof UpsertAthleteProfileInput>
): Promise<TAthleteProfileRow> {
  const url = `/api/orgs/${input.orgId}/athletes/${input.athleteId}/profile`;
  const data = await sendJSON<unknown>(url, "POST", input);
  return AthleteProfileRow.parse(data);
}

export async function updateAthleteProfile(
  input: z.infer<typeof UpdateAthleteProfileInput> & {
    orgId: string;
    athleteId: string;
  }
): Promise<TAthleteProfileRow> {
  const url = `/api/orgs/${input.orgId}/athletes/${input.athleteId}/profile`;
  const data = await sendJSON<unknown>(url, "PATCH", input);
  return AthleteProfileRow.parse(data);
}

export async function deleteAthleteProfile(
  input: z.infer<typeof DeleteAthleteProfileInput> & { athleteId: string }
): Promise<void> {
  const qs = new URLSearchParams({
    athleteProfileId: input.athleteProfileId,
  }).toString();
  const url = `/api/orgs/${input.orgId}/athletes/${input.athleteId}/profile?${qs}`;
  await sendJSON<void>(url, "DELETE");
}

export async function setAthleteProfileMetric(
  input: z.infer<typeof SetProfileMetricInput> & { orgId: string }
): Promise<TAthleteProfileMetricRow> {
  const url = `/api/orgs/${input.orgId}/athletes/${input.athleteId}/profile/metrics`;
  const data = await sendJSON<unknown>(url, "POST", input);
  return AthleteProfileMetricRow.parse(data);
}

export function useUpsertAthleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertAthleteProfile,
    onSuccess: (row) => {
      qc.invalidateQueries({
        queryKey: ["athlete-profile", "list", row.orgId, row.athleteId],
        exact: false,
      });
      qc.invalidateQueries({
        queryKey: [
          "athlete-profile",
          "by-day",
          row.orgId,
          row.athleteId,
          row.profileDate,
        ],
      });
    },
  });
}

export function useUpdateAthleteProfile(orgId: string, athleteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<z.infer<typeof UpdateAthleteProfileInput>, "orgId">
    ) => updateAthleteProfile({ ...input, orgId, athleteId }),
    onSuccess: (row) => {
      qc.invalidateQueries({
        queryKey: ["athlete-profile", "list", row.orgId, row.athleteId],
        exact: false,
      });
      qc.invalidateQueries({
        queryKey: [
          "athlete-profile",
          "by-id",
          row.orgId,
          row.athleteId,
          row.id,
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "athlete-profile",
          "by-day",
          row.orgId,
          row.athleteId,
          row.profileDate,
        ],
      });
    },
  });
}

export function useDeleteAthleteProfile(orgId: string, athleteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<
        z.infer<typeof DeleteAthleteProfileInput>,
        "orgId" | "athleteId"
      >
    ) => deleteAthleteProfile({ ...input, orgId, athleteId }),
    onSuccess: (_, vars) => {
      // Best-effort invalidations
      qc.invalidateQueries({
        queryKey: ["athlete-profile", "list", orgId, athleteId],
        exact: false,
      });
      qc.invalidateQueries({
        queryKey: [
          "athlete-profile",
          "by-id",
          orgId,
          athleteId,
          vars.athleteProfileId,
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "athlete-profile",
          "metrics",
          orgId,
          athleteId,
          vars.athleteProfileId,
        ],
      });
    },
  });
}

export function useSetAthleteProfileMetric(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<z.infer<typeof SetProfileMetricInput>, "orgId">) =>
      setAthleteProfileMetric({ ...input, orgId }),
    onSuccess: (row) => {
      qc.invalidateQueries({
        queryKey: [
          "athlete-profile",
          "metrics",
          row.orgId,
          row.athleteId,
          row.athleteProfileId,
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "athlete-profile",
          "by-id",
          row.orgId,
          row.athleteId,
          row.athleteProfileId,
        ],
      });
    },
  });
}
