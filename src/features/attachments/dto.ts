import { z } from "zod";

export const UUID = z.string().uuid();

export const CreateAttachmentInput = z.object({
  orgId: UUID,
  entityType: z.string().min(1),
  entityId: UUID,
  url: z.string().url(),
  fileType: z.string().optional(),
  title: z.string().optional(),
  uploadedBy: UUID.optional(),
});

export const UpdateAttachmentInput = z.object({
  id: UUID,
  title: z.string().optional(),
  fileType: z.string().optional(),
});

export const DeleteAttachmentInput = z.object({
  id: UUID,
});

export const ListAttachmentsInput = z.object({
  orgId: UUID,
  entityType: z.string().optional(),
  entityId: UUID.optional(),
});

export const AttachmentRow = z.object({
  id: UUID,
  orgId: UUID,
  entityType: z.string(),
  entityId: UUID,
  url: z.string().url(),
  fileType: z.string().nullable(),
  title: z.string().nullable(),
  createdAt: z.string(),
  uploadedBy: UUID.nullable(),
});

export const AttachmentsResponse = z.object({
  items: z.array(AttachmentRow),
});

export type TAttachmentRow = z.infer<typeof AttachmentRow>;
