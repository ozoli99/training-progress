// src/lib/api.ts  (moved from apiAuth to a neutral place)
import { z } from "zod";

const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 27);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export function parseDateRange(url: string) {
  const { searchParams } = new URL(url);
  const from = searchParams.get("from") ?? defaultRange().from;
  const to = searchParams.get("to") ?? defaultRange().to;
  const parsed = z.object({ from: DateOnly, to: DateOnly }).parse({ from, to });
  return parsed;
}

export function parsePagination(url: string) {
  const { searchParams } = new URL(url);
  const limit = Number(searchParams.get("limit") ?? 10);
  const offset = Number(searchParams.get("offset") ?? 0);
  return {
    limit: Number.isFinite(limit) ? limit : 10,
    offset: Number.isFinite(offset) ? offset : 0,
  };
}

export const json = {
  ok: (data: unknown, status = 200) => Response.json(data, { status }),
  err: (error: string, status = 400) => Response.json({ error }, { status }),
};
