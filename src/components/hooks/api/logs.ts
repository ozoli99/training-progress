import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type RangeFilter = { start: string; end: string };

export type GetLogsDTO = {
    id?: string;
    exerciseId?: string;
    date?: string;
    notes?: string;
    exercise?: {
        id?: string;
        name?: string;
        unit?: string;
    };
    sets?: {
        id?: string;
        reps?: number | null;
        weight?: number | null;
        duration?: number | null;
    }[];
};

export type CreateLogDTO = {
    date: string;
    exerciseId: string;
    sets: {
        reps?: number | null;
        weight?: number | null;
        timeSec?: number | null;
        rpe?: number | null;
    }[];
    notes?: string | null;
};

const queryKey = "logs";

export const useGetLogs = (safeRange: RangeFilter) => {
    return useQuery({
        queryKey: [queryKey, safeRange],
        queryFn: async () => {
            const url = `/api/logs?start=${safeRange.start}&end=${safeRange.end}`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Failed to fetch: ${res.status}`);
            }
            const data = await res.json() as GetLogsDTO[];
            return data;
        },
        staleTime: 10_000,
    });
};

export const useCreateLog = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (payload: CreateLogDTO) => {
            const res = await fetch("/api/logs", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                throw new Error("Failed to create log");
            }
            const data = await res.json() as { id: string };
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            toast.success("Logged ✅", { description: "Your training entry was saved." });
        },
        onError: () => toast.error("Save failed", { description: "Check fields and try again." }),
    });
};