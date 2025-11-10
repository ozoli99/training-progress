// src/lib/api.ts
import type { NextRequest } from "next/server";
import { z } from "zod";

/** ---- date utils (local YYYY-MM-DD, no UTC shift) ---- */
const pad = (n: number) => String(n).padStart(2, "0");
export const fmtYmd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

/** ---- robust query parsing ---- */
function getSearchParams(src: NextRequest | Request | string): URLSearchParams {
  // NextRequest (has .nextUrl)
  const any = src as any;
  if (any?.nextUrl?.searchParams)
    return any.nextUrl.searchParams as URLSearchParams;

  // Request | string
  const url = typeof src === "string" ? src : (src as Request).url;

  // Try absolute URL; if relative, use a dummy base
  try {
    return new URL(url).searchParams;
  } catch {
    return new URL(url, "http://localhost").searchParams;
  }
}

/** Default range: last 28 calendar days (inclusive) in local time */
export function defaultRange() {
  const today = new Date();
  const to = endOfDay(today);
  const from = startOfDay(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 27)
  );
  return { from: fmtYmd(from), to: fmtYmd(to) };
}

/** Parse {from,to} from request/url; falls back to defaultRange(); validates YYYY-MM-DD */
export function parseDateRange(src: NextRequest | Request | string) {
  const sp = getSearchParams(src);
  const def = defaultRange();
  const from = sp.get("from") ?? def.from;
  const to = sp.get("to") ?? def.to;
  return z.object({ from: DateOnly, to: DateOnly }).parse({ from, to });
}

/** Parse pagination with sane clamps */
export function parsePagination(
  src: NextRequest | Request | string,
  options?: { maxLimit?: number; defLimit?: number; defOffset?: number }
) {
  const sp = getSearchParams(src);
  const maxLimit = options?.maxLimit ?? 100;
  const defLimit = options?.defLimit ?? 50;
  const defOffset = options?.defOffset ?? 0;

  const rawLimit = Number(sp.get("limit") ?? defLimit);
  const rawOffset = Number(sp.get("offset") ?? defOffset);

  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, maxLimit)
      : defLimit;
  const offset =
    Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : defOffset;

  return { limit, offset };
}

/** Tiny JSON helpers (kept) */
export const json = {
  ok: (data: unknown, status = 200) => Response.json(data, { status }),
  err: (error: string, status = 400) => Response.json({ error }, { status }),
};
