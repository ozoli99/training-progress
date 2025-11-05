// components/DevAuthBar.tsx
"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, Database, Save, UserCircle2 } from "lucide-react";

type AthleteItem = {
  id: string;
  displayName?: string | null;
  email?: string | null;
};

function useLocalStore(key: string, initial = "") {
  const [val, setVal] = React.useState<string>(initial);
  React.useEffect(() => {
    const v = localStorage.getItem(key);
    if (v) setVal(v);
  }, [key]);
  const save = (next: string) => {
    setVal(next);
    if (next) localStorage.setItem(key, next);
    else localStorage.removeItem(key);
  };
  return [val, save] as const;
}

export function DevAuthBar() {
  const [orgId, setOrgId] = useLocalStore("dev_org_id");
  const [athleteId, setAthleteId] = useLocalStore("dev_athlete_id");
  const [expanded, setExpanded] = React.useState(false);

  // Try to fetch athletes; if your API expects orgId, include it.
  const { data: athletes = [], isLoading } = useQuery<AthleteItem[]>({
    queryKey: ["dev-athletes", { orgId }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (orgId) qs.set("orgId", orgId);
      // Adjust the route to whatever you already have
      const res = await api(`/api/athletes?${qs.toString()}`);
      return Array.isArray(res) ? (res as AthleteItem[]) : [];
    },
  });

  const activeAthlete = athletes.find((a) => a.id === athleteId);

  const setDemo = () => {
    // Matches the UUIDs from the sample seed I gave you
    setOrgId("22222222-2222-2222-2222-222222222222"); // Chaos Gym
    setAthleteId("33333333-3333-3333-3333-333333333333"); // Zoli
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto w-full max-w-6xl px-3 pb-3">
        <div className="rounded-xl border bg-background/95 backdrop-blur shadow-sm">
          {/* Header row */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="uppercase tracking-wide">
                Dev
              </Badge>
              <span className="text-muted-foreground">Auth / Context</span>
              {athleteId && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <UserCircle2 className="h-3.5 w-3.5" />
                  {activeAthlete?.displayName || "Athlete"} ·{" "}
                  {athleteId.slice(0, 8)}…
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          {expanded && (
            <>
              <Separator />
              <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* ORG */}
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Org ID
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="org UUID…"
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value.trim())}
                    />
                    <Button variant="outline" size="icon" title="Save orgId">
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* ATHLETE SELECT */}
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Athlete
                  </label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={athleteId || undefined}
                      onValueChange={(v) => setAthleteId(v)}
                      disabled={isLoading || athletes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoading
                              ? "Loading…"
                              : athletes.length
                                ? "Pick athlete"
                                : "No athletes"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {athletes.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {(a.displayName || "Unnamed") +
                              (a.email ? ` · ${a.email}` : "")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {athleteId && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>

                {/* ATHLETE BY ID */}
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Athlete ID (manual)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="athlete UUID…"
                      value={athleteId}
                      onChange={(e) => setAthleteId(e.target.value.trim())}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      title="Save athleteId"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="text-xs text-muted-foreground">
                  Stored keys: <code>dev_org_id</code>,{" "}
                  <code>dev_athlete_id</code>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={setDemo}>
                    <Database className="mr-2 h-4 w-4" />
                    Use Demo IDs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem("dev_org_id");
                      localStorage.removeItem("dev_athlete_id");
                      location.reload();
                    }}
                  >
                    Clear & Reload
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
