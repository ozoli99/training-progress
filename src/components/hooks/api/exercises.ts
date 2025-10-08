import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

export type CreateExerciseDTO = {
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

export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateExerciseDTO) => {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to create exercise");
      }
      const data = (await res.json()) as { id: string };
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Exercise created");
    },
    onError: () => toast.error("Failed to create exercise"),
  });
};
