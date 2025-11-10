import { z } from "zod";

export const UUID = z.string().uuid();
export const Visibility = z.enum(["org", "private", "public"]);

export const CreateCoachNoteInput = z.object({
  orgId: UUID,
  authorUserId: UUID,
  entityType: z.string().min(1),
  entityId: UUID,
  content: z.string().min(1),
  isPrivate: z.boolean().optional(),
  visibility: Visibility.optional(),
});

export const UpdateCoachNoteInput = z.object({
  id: UUID,
  content: z.string().min(1).optional(),
  isPrivate: z.boolean().optional(),
  visibility: Visibility.optional(),
});

export const DeleteCoachNoteInput = z.object({
  id: UUID,
});

export const ListCoachNotesInput = z.object({
  orgId: UUID,
  entityType: z.string().optional(),
  entityId: UUID.optional(),
  authorUserId: UUID.optional(),
  visibility: Visibility.optional(),
  isPrivate: z.boolean().optional(),
});

export const CoachNoteRow = z.object({
  id: UUID,
  orgId: UUID,
  authorUserId: UUID,
  entityType: z.string(),
  entityId: UUID,
  isPrivate: z.boolean(),
  visibility: Visibility,
  content: z.string(),
  createdAt: z.string(),
});

export const CoachNotesResponse = z.object({
  items: z.array(CoachNoteRow),
});

export type TCoachNoteRow = z.infer<typeof CoachNoteRow>;
