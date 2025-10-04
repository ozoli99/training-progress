"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function ExerciseDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const { data: logs = [] } = useQuery({
        queryKey: ["logsByExercise", id],
        queryFn: async () => {
            const end = new Date().toISOString().slice(0, 10);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            const start = startDate.toISOString().slice(0, 10);
            const all = await (await fetch(`/api/logs?start=${start}&end=${end}`)).json();
            return all.filter((log: any) => log.exerciseId === id);
        }
    });

    return (
        <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Exercise Trend</h2>
            <div className="text-sm text-muted-foreground">Sessions: {logs.length}</div>
            {/* TODO: Add chart 1RM over time + table of sets */}
        </div>
    )
}