import {
  GlobalExerciseRow,
  CreateGlobalExerciseInput,
  UpdateGlobalExerciseInput,
  DeleteGlobalExerciseInput,
  GlobalExerciseMediaRow,
  CreateGlobalExerciseMediaInput,
  UpdateGlobalExerciseMediaInput,
  DeleteGlobalExerciseMediaInput,
} from "../dto";

async function sendJSON<T>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${url} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export async function createGlobalExercise(input: unknown) {
  const payload = CreateGlobalExerciseInput.parse(input);
  const row = await sendJSON<unknown>("/api/global-exercises", "POST", payload);
  return GlobalExerciseRow.parse(row);
}

export async function updateGlobalExercise(input: unknown) {
  const payload = UpdateGlobalExerciseInput.parse(input);
  const row = await sendJSON<unknown>("/api/global-exercises", "PUT", payload);
  return GlobalExerciseRow.parse(row);
}

export async function deleteGlobalExercise(input: unknown) {
  const { id } = DeleteGlobalExerciseInput.parse(input);
  await sendJSON<void>(
    `/api/global-exercises?id=${encodeURIComponent(id)}`,
    "DELETE"
  );
}

export async function createGlobalExerciseMedia(input: unknown) {
  const payload = CreateGlobalExerciseMediaInput.parse(input);
  const url = `/api/global-exercises/${payload.globalExerciseId}/media`;
  const row = await sendJSON<unknown>(url, "POST", {
    mediaType: payload.mediaType,
    url: payload.url,
    title: payload.title,
    displayOrder: payload.displayOrder,
  });
  return GlobalExerciseMediaRow.parse(row);
}

export async function updateGlobalExerciseMedia(input: unknown) {
  const payload = UpdateGlobalExerciseMediaInput.parse(input);
  const url = `/api/global-exercises/_/media/${payload.id}`;
  const row = await sendJSON<unknown>(url, "PUT", {
    title: payload.title,
    displayOrder: payload.displayOrder,
  });
  return GlobalExerciseMediaRow.parse(row);
}

export async function deleteGlobalExerciseMedia(input: unknown) {
  const { id } = DeleteGlobalExerciseMediaInput.parse(input);
  const url = `/api/global-exercises/_/media/${id}`;
  await sendJSON<void>(url, "DELETE");
}
