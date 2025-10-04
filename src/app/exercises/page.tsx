"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExerciseCreateDialog } from "@/ui/components/ExerciseCreateDialog";
import { ArrowUpDown, ExternalLink, Plus, RefreshCcw, Dumbbell, Timer, Hash, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Exercise = { id: string; name: string; unit: "weight_reps" | "time" | "reps" };

function unitMeta(unit: "weight_reps" | "time" | "reps") {
    switch (unit) {
        case "weight_reps":
            return {
                label: "weight × reps",
                help: "Track sets with load and repetitions.",
                icon: <Dumbbell className="h-4 w-4" />,
            };
        case "time":
            return {
                label: "time",
                help: "Track durations (e.g., intervals, runs).",
                icon: <Timer className="h-4 w-4" />,
            };
        case "reps":
        default:
            return {
                label: "reps",
                help: "Track bodyweight or count-only movements.",
                icon: <Hash className="h-4 w-4" />,
            };
    }
}

export default function ExercisesPage() {
    const { data = [], isLoading, isError, refetch } = useQuery<Exercise[]>({
        queryKey: ["exercises"],
        queryFn: async () => {
            const res = await fetch("/api/exercises");
            if (!res.ok) {
                throw new Error("Failed to load exercises");
            }
            return res.json();
        },
        staleTime: 10_000,
    });

    const [q, setQ] = React.useState("");
    const [unit, setUnit] = React.useState<Exercise["unit"] | "all">("all");
    const [sortAsc, setSortAsc] = React.useState(true);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA|SELECT/)) {
                return;
            }
            if (e.key.toLowerCase() === "n") {
                e.preventDefault();
                setOpen(true);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const filtered = React.useMemo(() => {
        const needle = q.trim().toLowerCase();
        return data
            .filter((x) => (unit === "all" ? true : x.unit === unit))
            .filter((x) => (!needle ? true : x.name.toLowerCase().includes(needle)))
            .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    }, [data, q, unit, sortAsc]);

    return (
        <div className="grid gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Exercises</h2>
                    <p className="text-sm text-muted-foreground">Create, filter, and open exercises. Press <kbd className="px-1 py-0.5 rounded border text-xs">N</kbd> to add quickly.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} aria-label="Refresh list">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Exercise
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div>
                    <Label htmlFor="q">Search</Label>
                    <Input id="q" placeholder="Back Squat..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div>
                    <Label>Unit</Label>
                    <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="All units" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All units</SelectItem>
                            <SelectItem value="weight_reps">Weight × Reps</SelectItem>
                            <SelectItem value="reps">Reps</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="self-end">
                    <Button type="button" variant="secondary" className="w-full" onClick={() => setSortAsc((v) => !v)}>
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Sort {sortAsc ? "A→Z" : "Z→A"}
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="grid gap-2">
                    <div className="h-16 rounded-xl bg-muted animate-pulse" />
                    <div className="h-16 rounded-xl bg-muted animate-pulse" />
                    <div className="h-16 rounded-xl bg-muted animate-pulse" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl border p-4 text-sm">
                    Failed to load exercises.
                    <Button size="sm" variant="link" onClick={() => refetch()} className="ml-2 p-0 h-auto">
                        Try again
                    </Button>
                </div>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
                <div className="rounded-xl border p-6 text-sm text-muted-foreground">
                    No exercises found. Adjust filters or{" "}
                    <button className="underline" onClick={() => setOpen(true)}>create a new one</button>.
                </div>
            )}

            {!isLoading && !isError && filtered.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((ex) => {
                        const meta = unitMeta(ex.unit);
                        return (
                            <Link key={ex.id} href={`/exercises/${ex.id}`} className="group block focus:outline-none">
                                <Card
                                    className={cn(
                                        "relative transition-all",
                                        "hover:-translate-y-0.5 hover:shadow-lg",
                                        "focus-visible:ring-2 focus-visible:ring-primary/60"
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                                    />
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={cn(
                                                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                                                        "bg-accent/30 text-muted-foreground"
                                                    )}
                                                    aria-hidden
                                                >
                                                    {meta.icon}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="font-medium leading-tight truncate">{ex.name}</div>
                                                    <div className="mt-1">
                                                        <span className="inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-xs capitalize">
                                                            {meta.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <ChevronRight className="h-4 w-4 text-muted-foreground transition opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
                                        </div>
                                        <p className="mt-3 text-xs text-muted-foreground">
                                            {meta.help}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}

            <ExerciseCreateDialog
                open={open}
                onOpenChange={(o) => setOpen(o)}
                onCreated={() => {
                    toast.success("Exercise created");
                    refetch();
                }}
            />
        </div>
    );
}