"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseCreateDialog } from "@/ui/components/ExerciseCreateDialog";

export default function ExercisesPage() {
    const { data = [] } = useQuery({
        queryKey: ["exercises"],
        queryFn: async () => await (await fetch("/api/exercises")).json(),
    });

    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Exercises</h2>
                <ExerciseCreateDialog />
            </div>

            <div className="grid gap-2">
                {data.map((exercise: any) => (
                    <Card key={exercise.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <div className="font-medium">{exercise.name}</div>
                                <div className="text-xs text-muted-foreground">{exercise.unit}</div>
                            </div>
                            <a href={`/exercises/${exercise.id}`} className="underline text-sm">Open</a>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}