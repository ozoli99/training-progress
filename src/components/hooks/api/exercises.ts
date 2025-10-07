import { useQuery } from "@tanstack/react-query";

export type GetExerciseDTO = {
  id?: string;
  name?: string;
  unit?: "weight_reps" | "time" | "reps";
};

export type Exercise = {
  id: string;
  name: string;
  unit: "weight_reps" | "time" | "reps";
};

const queryKey = "exercises";

const normalize = (raw: GetExerciseDTO[]): Exercise[] =>
  (raw ?? [])
    .filter(
      (item): item is Required<Pick<GetExerciseDTO, "id">> & GetExerciseDTO =>
        typeof item?.id === "string" && item.id.length > 0
    )
    .map((item) => ({
      id: item.id,
      name: item.name ?? "",
      unit:
        item.unit === "time" || item.unit === "reps"
          ? item.unit
          : ("weight_reps" as const),
    }));

export const useGetExercises = () =>
  useQuery<Exercise[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await fetch("/api/exercises");
      if (!res.ok) {
        throw new Error(`Failed to fetch exercises: ${res.status}`);
      }
      const data = (await res.json()) as GetExerciseDTO[];
      return normalize(data);
    },
    staleTime: 10_000,
  });
