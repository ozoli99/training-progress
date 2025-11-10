import { z } from "zod";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  AthleteProfileRow,
  AthleteProfileMetricRow,
  ListAthleteProfilesInput,
  GetAthleteProfileByIdInput,
  GetAthleteProfileByDayInput,
  ListProfileMetricsInput,
  TAthleteProfileRow,
  TAthleteProfileMetricRow,
} from "../dto";

// --- small helpers -----------------------------------------------------------
const qk = {
  base: ["athlete-profile"] as const,
  list: (i: z.infer<typeof ListAthleteProfilesInput>) =>
    [
      ...qk.base,
      "list",
      i.orgId,
      i.athleteId,
      i.from ?? "",
      i.to ?? "",
      i.limit,
      i.offset,
      i.order,
    ] as const,
  byId: (
    i: z.infer<typeof GetAthleteProfileByIdInput> & { athleteId: string }
  ) => [...qk.base, "by-id", i.orgId, i.athleteId, i.athleteProfileId] as const,
  byDay: (
    i: z.infer<typeof GetAthleteProfileByDayInput> & { athleteId: string }
  ) => [...qk.base, "by-day", i.orgId, i.athleteId, i.profileDate] as const,
  metrics: (
    i: z.infer<typeof ListProfileMetricsInput> & { athleteId: string }
  ) =>
    [...qk.base, "metrics", i.orgId, i.athleteId, i.athleteProfileId] as const,
};

function toQS(params: Record<string, string | number | boolean | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  });
  return usp.toString();
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

// --- plain fetchers ----------------------------------------------------------
export async function fetchAthleteProfilesList(
  input: z.infer<typeof ListAthleteProfilesInput>
): Promise<TAthleteProfileRow[]> {
  const qs = toQS({
    from: input.from,
    to: input.to,
    limit: input.limit,
    offset: input.offset,
    order: input.order,
  });
  const url = `/api/orgs/${input.orgId}/athletes/${input.athleteId}/profile?${qs}`;
  const data = await getJSON<unknown>(url);
  // Validate array of rows
  return (data as unknown[]).map((r) => AthleteProfileRow.parse(r));
}

export async function fetchAthleteProfileById(
  input: z.infer<typeof GetAthleteProfileByIdInput> & { athleteId: string }
): Promise<TAthleteProfileRow | null> {
  const qs = toQS({ athleteProfileId: input.athleteProfileId });
  const url = `/api/orgs/${input.orgId}/athletes/${input.athleteId}/profile?${qs}`;
  const data = await getJSON<unknown>(url);
  if (!data) return null;
  return data ? AthleteProfileRow.parse(data) : null;
}

export async function fetchAthleteProfileByDay(
  input: z.infer<typeof GetAthleteProfileByDayInput> & { orgId: string }
): Promise<TAthleteProfileRow | null> {
  const qs = toQS({ profileDate: input.profileDate });
  const url = `/api/orgs/${input.orgId}/athletes/${input.athleteId}/profile?${qs}`;
  const data = await getJSON<unknown>(url);
  if (!data) return null;
  return data ? AthleteProfileRow.parse(data) : null;
}

export async function fetchAthleteProfileMetrics(
  input: z.infer<typeof ListProfileMetricsInput> & { athleteId: string }
): Promise<TAthleteProfileMetricRow[]> {
  const qs = toQS({ athleteProfileId: input.athleteProfileId });
  const url = `/api/orgs/${input.orgId}/athletes/${input.athleteId}/profile/metrics?${qs}`;
  const data = await getJSON<unknown>(url);
  return (data as unknown[]).map((r) => AthleteProfileMetricRow.parse(r));
}

// --- hooks -------------------------------------------------------------------
export function useAthleteProfilesList(
  input: z.infer<typeof ListAthleteProfilesInput>
): UseQueryResult<TAthleteProfileRow[]> {
  return useQuery({
    queryKey: qk.list(input),
    queryFn: () => fetchAthleteProfilesList(input),
    enabled: Boolean(input?.orgId && input?.athleteId),
  });
}

export function useAthleteProfileById(
  input: z.infer<typeof GetAthleteProfileByIdInput> & { athleteId: string }
): UseQueryResult<TAthleteProfileRow | null> {
  return useQuery({
    queryKey: qk.byId(input),
    queryFn: () => fetchAthleteProfileById(input),
    enabled: Boolean(
      input?.orgId && input?.athleteId && input?.athleteProfileId
    ),
  });
}

export function useAthleteProfileByDay(
  input: z.infer<typeof GetAthleteProfileByDayInput> & { orgId: string }
): UseQueryResult<TAthleteProfileRow | null> {
  return useQuery({
    queryKey: qk.byDay(input),
    queryFn: () => fetchAthleteProfileByDay(input),
    enabled: Boolean(input?.orgId && input?.athleteId && input?.profileDate),
  });
}

export function useAthleteProfileMetrics(
  input: z.infer<typeof ListProfileMetricsInput> & { athleteId: string }
): UseQueryResult<TAthleteProfileMetricRow[]> {
  return useQuery({
    queryKey: qk.metrics(input),
    queryFn: () => fetchAthleteProfileMetrics(input),
    enabled: Boolean(
      input?.orgId && input?.athleteId && input?.athleteProfileId
    ),
  });
}
