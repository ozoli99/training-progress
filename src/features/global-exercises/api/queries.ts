import {
  GlobalExerciseRow,
  ListGlobalExercisesInput,
  GetGlobalExerciseInput,
  GlobalExerciseMediaRow,
  ListGlobalExerciseMediaInput,
  type TListGlobalExercisesInput,
} from "../dto";

export const qk = {
  all: ["global-exercises"] as const,
  list: (args: TListGlobalExercisesInput) => [...qk.all, "list", args] as const,
  get: (id: string) => [...qk.all, "get", id] as const,
  media: (globalExerciseId: string) =>
    [...qk.all, "media", globalExerciseId] as const,
};

function toQuery(obj: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchGlobalExercises(input: unknown) {
  const args = ListGlobalExercisesInput.parse(input);
  const url =
    "/api/global-exercises" +
    toQuery({
      search: args.search,
      category: args.category,
      modality: args.modality,
      isActive: args.isActive,
      limit: args.limit,
      offset: args.offset,
    });

  const data = await getJSON<unknown[]>(url);
  return (data as unknown[]).map((r) => GlobalExerciseRow.parse(r));
}

export async function fetchGlobalExercise(input: unknown) {
  const { id } = GetGlobalExerciseInput.parse(input);
  const url = "/api/global-exercises" + toQuery({ id });
  const row = await getJSON<unknown>(url);
  return GlobalExerciseRow.parse(row);
}

export async function fetchGlobalExerciseMedia(input: unknown) {
  const { globalExerciseId } = ListGlobalExerciseMediaInput.parse(input);
  const url = `/api/global-exercises/${globalExerciseId}/media`;
  const data = await getJSON<unknown[]>(url);
  return data.map((m) => GlobalExerciseMediaRow.parse(m));
}
