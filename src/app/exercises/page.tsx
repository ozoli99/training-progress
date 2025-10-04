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
        <div>
            <div>
                <h2>Exercises</h2>
                <ExerciseCreateDialog />
            </div>

            <div>
                {data.map((exercise: any) => (
                    <Card key={exercise.id}>
                        <CardContent>
                            <div>
                                <div>{exercise.name}</div>
                                <div>{exercise.unit}</div>
                            </div>
                            <a href={`/exercises/${exercise.id}`}>Open</a>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}