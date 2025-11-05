import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Unit } from "./types";
import { UNIT_LABELS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const tickFmt = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });

export const fullDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

export const num = (n: number) => Math.round(n).toLocaleString();

export const unitLabel = (unit: Unit, isOneRm: boolean) => {
  return isOneRm ? UNIT_LABELS[unit].oneRm : UNIT_LABELS[unit].volume;
};

export const getTrendColor = (up: boolean, unit: Unit) => {
  const positive = "text-emerald-600 dark:text-emerald-400";
  const negative = "text-rose-600 dark:text-rose-400";

  if (unit === "time") {
    return up ? negative : positive;
  }
  return up ? positive : negative;
};

export function computeDomain(values: number[]): [() => number, () => number] {
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = max - min;
  const pad = range === 0 ? Math.max(1, max * 0.1 || 1) : range * 0.1;
  return [() => Math.max(0, Math.floor(min - pad)), () => Math.ceil(max + pad)];
}

export function isActive(pathname: string, href: string): boolean {
  const clean = (s: string) => s.replace(/\/+$/, "") || "/";
  const p = clean(pathname);
  const h = clean(href);
  if (h === "/") return p === "/";
  return p === h || p.startsWith(h + "/");
}

export function ymd(d: Date = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function clampRange(start: string, end: string) {
  return new Date(start) <= new Date(end)
    ? { start, end }
    : { start: end, end: start };
}

export function formatSeconds(totalSec: number) {
  if (!Number.isFinite(totalSec)) return "0:00";

  const sign = totalSec < 0 ? "-" : "";
  let s = Math.abs(Math.round(totalSec));
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return h > 0
    ? `${sign}${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${sign}${m}:${String(sec).padStart(2, "0")}`;
}

export const isTimeUnit = (unit: Unit) => unit === "time";

export const isDeltaImproved = (delta: number, unit: Unit) =>
  isTimeUnit(unit) ? delta < 0 : delta > 0;

export const formatMetric = (value: number, unit: Unit, isOneRm: boolean) =>
  isTimeUnit(unit) ? formatSeconds(value) : `${num(value)}${isOneRm ? "" : ""}`;

export const formatDelta = (delta: number, unit: Unit) =>
  isTimeUnit(unit) ? formatSeconds(Math.abs(delta)) : num(Math.abs(delta));

export function weekKey(isoDate: string) {
  const date = new Date(isoDate + "T00:00:00");
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}
