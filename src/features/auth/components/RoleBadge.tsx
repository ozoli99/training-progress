"use client";

import { useOrgRole } from "@/features/auth/hooks";

export default function RoleBadge({ orgId }: { orgId: string }) {
  const { role, loading } = useOrgRole(orgId);
  if (loading || !orgId) return null;

  return (
    <span
      className="text-xs rounded-full border px-2 py-1 text-muted-foreground"
      title={`Your role in this org: ${role ?? "guest"}`}
    >
      {role ?? "guest"}
    </span>
  );
}
