import useSWR from "swr";

export function useOrgSessions(
  orgId: string,
  range: { from: string; to: string },
  opts?: { limit?: number; offset?: number }
) {
  const params = new URLSearchParams({
    from: range.from,
    to: range.to,
    limit: String(opts?.limit ?? 50),
    offset: String(opts?.offset ?? 0),
  }).toString();

  const key = orgId ? `/api/orgs/${orgId}/analytics/sessions?${params}` : null;

  return useSWR(key, (url) => fetch(url).then((r) => r.json()));
}
