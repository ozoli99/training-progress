// app/exercises/page.tsx
"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Exercise = {
  id: string;
  orgId: string;
  name: string;
  category: string | null;
  modality: string | null;
};

export default function ExercisesPage() {
  const [items, setItems] = React.useState<Exercise[]>([]);
  const [q, setQ] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      // Basic list — adapt to your actual endpoint if it uses search
      const res = await api<Exercise[]>("/api/orgs/any/exercises"); // if you have a canonical list route use that
      setItems(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load exercises");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = q
    ? items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase().trim()))
    : items;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Exercises</h1>
        <Input
          placeholder="Search exercises…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <Card key={ex.id} className="hover:bg-muted/40 transition">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{ex.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {ex.category || "—"} · {ex.modality || "—"}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">
              No exercises found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
