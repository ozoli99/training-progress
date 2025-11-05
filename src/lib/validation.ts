import { z } from "zod";
import { AppError } from "@/shared/errors";

export function parseWith<TOut>(schema: z.ZodTypeAny, data: unknown): TOut {
  const res = schema.safeParse(data);
  if (!res.success) {
    const msg = res.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new AppError.Validation(msg);
  }
  return res.data as TOut;
}
