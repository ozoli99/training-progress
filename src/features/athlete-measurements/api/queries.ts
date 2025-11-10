"use client";

import {
  useQuery,
  keepPreviousData,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { z } from "zod";
import type { TAthleteMeasurementRow } from "@/features/athlete-measurements/dto";

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

export const measurementKeys = {
  all: (orgId: string, athleteId: string) =>
    ["athlete-measurements", orgId, athleteId] as const,
  list: (args: ListArgs) =>
    [
      ...measurementKeys.all(args.orgId, args.athleteId),
      "list",
      args.from ?? null,
      args.to ?? null,
      (args.types ?? []).slice().sort().join(",") || null,
      args.limit ?? null,
      args.offset ?? null,
      args.order ?? null,
    ] as const,
  detail: (orgId: string, athleteId: string, athleteMeasurementId: string) =>
    [
      ...measurementKeys.all(orgId, athleteId),
      "detail",
      athleteMeasurementId,
    ] as const,
};

const ListArgsSchema = z.object({
  orgId: z.string().uuid(),
  athleteId: z.string().uuid(),
  from: z.string().optional(),
  to: z.string().optional(),
  types: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListArgs = z.infer<typeof ListArgsSchema>;

export async function fetchAthleteMeasurements(args: ListArgs) {
  const a = ListArgsSchema.parse(args);
  const params = new URLSearchParams();
  if (a.from) params.set("from", a.from);
  if (a.to) params.set("to", a.to);
  if (a.types?.length) params.set("types", a.types.join(","));
  params.set("limit", String(a.limit));
  params.set("offset", String(a.offset));
  params.set("order", a.order);

  const url = `/api/orgs/${a.orgId}/athletes/${a.athleteId}/measurements?${params.toString()}`;
  return apiFetch<TAthleteMeasurementRow[]>(url);
}

export async function fetchAthleteMeasurementById(opts: {
  orgId: string;
  athleteId: string;
  athleteMeasurementId: string;
}) {
  const { orgId, athleteId, athleteMeasurementId } = opts;
  return apiFetch<TAthleteMeasurementRow>(
    `/api/orgs/${orgId}/athletes/${athleteId}/measurements/${athleteMeasurementId}`
  );
}

export function useAthleteMeasurementsQuery(
  args: ListArgs,
  options?: Omit<
    UseQueryOptions<TAthleteMeasurementRow[], Error, TAthleteMeasurementRow[]>,
    "queryKey" | "queryFn"
  >
) {
  const parsed = ListArgsSchema.parse(args);
  return useQuery({
    queryKey: measurementKeys.list(parsed),
    queryFn: () => fetchAthleteMeasurements(parsed),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useAthleteMeasurementQuery(
  opts: { orgId: string; athleteId: string; athleteMeasurementId: string },
  options?: Omit<
    UseQueryOptions<TAthleteMeasurementRow, Error, TAthleteMeasurementRow>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: measurementKeys.detail(
      opts.orgId,
      opts.athleteId,
      opts.athleteMeasurementId
    ),
    queryFn: () => fetchAthleteMeasurementById(opts),
    enabled: Boolean(opts.orgId && opts.athleteId && opts.athleteMeasurementId),
    ...options,
  });
}
