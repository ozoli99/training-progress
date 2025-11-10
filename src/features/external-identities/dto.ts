import { z } from "zod";

// ---------- Primitives
export const ExternalIdentityItem = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: z.string().min(1),
  externalUserId: z.string().min(1),
  credentials: z.unknown().nullable().optional(),
  createdAt: z.string(), // ISO
  updatedAt: z.string(), // ISO
});
export type TExternalIdentityItem = z.infer<typeof ExternalIdentityItem>;

// Shared pagination wrapper
export function Page<T extends z.ZodTypeAny>(Item: T) {
  return z.object({
    items: z.array(Item),
    nextCursor: z.string().nullable(),
  });
}
export type TPaged<T> = z.infer<ReturnType<typeof Page<z.ZodTypeAny>>> & {
  items: z.infer<any>[];
};

// ---------- Inputs
export const ListExternalIdentitiesInput = z.object({
  userId: z.string().uuid(),
  provider: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
  cursor: z.string().nullable().optional(), // base64-encoded { createdAt,id }
});
export type TListExternalIdentitiesInput = z.infer<
  typeof ListExternalIdentitiesInput
>;

export const GetExternalIdentityInput = z
  .object({
    userId: z.string().uuid(),
    id: z.string().uuid().optional(),
    provider: z.string().optional(),
    externalUserId: z.string().optional(),
  })
  .refine((v) => Boolean(v.id || (v.provider && v.externalUserId)), {
    message: "Provide either id or (provider & externalUserId).",
  });
export type TGetExternalIdentityInput = z.infer<
  typeof GetExternalIdentityInput
>;

export const UpsertExternalIdentityInput = z.object({
  userId: z.string().uuid(),
  provider: z.string().min(1),
  externalUserId: z.string().min(1),
  credentials: z.unknown().optional(),
});
export type TUpsertExternalIdentityInput = z.infer<
  typeof UpsertExternalIdentityInput
>;

export const UpdateCredentialsInput = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
  credentials: z.unknown(),
});
export type TUpdateCredentialsInput = z.infer<typeof UpdateCredentialsInput>;

export const RemoveExternalIdentityInput = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});
export type TRemoveExternalIdentityInput = z.infer<
  typeof RemoveExternalIdentityInput
>;
