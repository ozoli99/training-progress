// lib/api.ts
export type DevHeaders = {
  orgId?: string | null;
  userId?: string | null;
};

function getDevHeaders(): DevHeaders {
  if (typeof window === "undefined") return {};
  return {
    orgId: localStorage.getItem("dev_org_id"),
    userId: localStorage.getItem("dev_user_id"),
  };
}

export async function api<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const { orgId, userId } = getDevHeaders();
  const headers = new Headers(init?.headers || {});
  headers.set("content-type", "application/json");
  if (orgId) headers.set("x-org-id", orgId);
  if (userId) headers.set("x-user-id", userId); // your dev mode helper

  const res = await fetch(input, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}
