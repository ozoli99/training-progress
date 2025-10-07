import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Unit } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export const unitLabel = (unit: Unit, isOneRm: boolean) =>
  isOneRm ? "kg (est. 1RM)" : unit === "time" ? "sec" : "kg·reps";

// TODO: give better name
export const getVariant = (up: boolean, unit: Unit) => {
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

export function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}
