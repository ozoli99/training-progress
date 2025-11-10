"use client";

import { useEffect, useState } from "react";

type Role = "owner" | "admin" | "coach" | "athlete" | null;

export function useOrgMember(orgId: string) {
  const [role, setRole] = useState<Role>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ab = false;
    (async () => {
      try {
        const r = await fetch(`/api/orgs/${orgId}/me`, { cache: "no-store" });
        if (!r.ok) throw new Error("me fetch failed");
        const j = await r.json();
        if (!ab) {
          setRole((j.role as Role) ?? null);
          setAthleteId(j.athleteId ?? null);
        }
      } catch {
        if (!ab) {
          setRole(null);
          setAthleteId(null);
        }
      } finally {
        if (!ab) setLoading(false);
      }
    })();
    return () => {
      ab = true;
    };
  }, [orgId]);

  return { role, athleteId, loading };
}

export function useOrgRole(orgId: string) {
  const { role, loading } = useOrgMember(orgId);
  return { role, loading };
}
