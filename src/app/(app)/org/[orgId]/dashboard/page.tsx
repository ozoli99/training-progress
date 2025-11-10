// src/app/(app)/org/[orgId]/dashboard/page.tsx (server component)
import { cookies, headers } from "next/headers";
import DashboardView from "./DashboardView";

async function absoluteUrl(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  if (!host) throw new Error("Missing host header");
  return new URL(path, `${proto}://${host}`).toString();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const h = new Headers(init?.headers);
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (cookieHeader) h.set("cookie", cookieHeader);
  const url = await absoluteUrl(path);
  const res = await fetch(url, { ...init, headers: h, cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export default async function OrgDashboardPage({
  params,
}: {
  params: { orgId: string };
}) {
  const { orgId } = params;

  const me = await api<{
    role: "owner" | "admin" | "coach" | "athlete" | null;
    athleteId: string | null;
  }>(`/api/orgs/${orgId}/me`);

  // role-aware data (same endpoint both paths)
  const summary = await api<{ role: typeof me.role; data: any }>(
    `/api/orgs/${orgId}/dashboard/summary`
  );

  return (
    <DashboardView
      orgId={orgId}
      role={me.role}
      athleteId={me.athleteId}
      // ✅ Do NOT pass `summary` prop anymore (your client components fetch themselves)
    />
  );
}
