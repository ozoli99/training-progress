// features/lookups/dto.ts
import { z } from "zod";

/* ----------------------------- Base helpers ----------------------------- */
export const Uuid = z.string().uuid();
export const IsoDate = z.string().datetime();

/* ----------------------------- Entity Kind ------------------------------ */
export const EntityKindRow = z.object({
  code: z.string().min(1),
  orgId: Uuid,
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type TEntityKindRow = z.infer<typeof EntityKindRow>;

export const ListEntityKindsInput = z.object({
  orgId: Uuid,
  activeOnly: z.boolean().optional(),
});
export type TListEntityKindsInput = z.infer<typeof ListEntityKindsInput>;

export const CreateEntityKindInput = z.object({
  orgId: Uuid,
  code: z.string().min(1),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type TCreateEntityKindInput = z.infer<typeof CreateEntityKindInput>;

export const UpdateEntityKindInput = z.object({
  code: z.string().min(1),
  patch: z.object({
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});
export type TUpdateEntityKindInput = z.infer<typeof UpdateEntityKindInput>;

export const DeleteEntityKindInput = z.object({
  code: z.string().min(1),
});
export type TDeleteEntityKindInput = z.infer<typeof DeleteEntityKindInput>;

export const EntityKindsResponse = z.object({
  items: z.array(EntityKindRow),
});
export type TEntityKindsResponse = z.infer<typeof EntityKindsResponse>;

/* --------------------------- Code/Label tables -------------------------- */
export const CodeLabelRow = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
});
export type TCodeLabelRow = z.infer<typeof CodeLabelRow>;

export const UpsertCodeLabelInput = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
});
export type TUpsertCodeLabelInput = z.infer<typeof UpsertCodeLabelInput>;

export const DeleteCodeInput = z.object({
  code: z.string().min(1),
});
export type TDeleteCodeInput = z.infer<typeof DeleteCodeInput>;

export const CodeLabelListResponse = z.object({
  items: z.array(CodeLabelRow),
});
export type TCodeLabelListResponse = z.infer<typeof CodeLabelListResponse>;

/* ----------------------------- Named aliases ---------------------------- */
export const SessionStatusRow = CodeLabelRow;
export type TSessionStatusRow = TCodeLabelRow;

export const MeasurementTypeRow = CodeLabelRow;
export type TMeasurementTypeRow = TCodeLabelRow;

export const WorkoutTypeRow = CodeLabelRow;
export type TWorkoutTypeRow = TCodeLabelRow;
