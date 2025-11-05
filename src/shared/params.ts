import { ZodSchema } from "zod";

export function parseParams<T>(schema: ZodSchema<T>, params: unknown): T {
  return schema.parse(params);
}
