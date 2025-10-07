import type { Metric, WeeklyPoint } from "./types";

export function exportWeeklyCSV(
  weekly: WeeklyPoint[],
  metric: Metric,
  start: string,
  end: string
) {
  const rows = [
    ["week", metric],
    ...weekly.map((r) => [r.week, String(Math.round(r.value))]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard_${metric}_${start}_${end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
