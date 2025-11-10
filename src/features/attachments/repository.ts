import { and, eq, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  attachment,
  type attachment as AttachmentTbl,
} from "@/infrastructure/db/schema";
import type { TAttachmentRow } from "./dto";

export interface AttachmentsRepository {
  create(input: {
    orgId: string;
    entityType: string;
    entityId: string;
    url: string;
    fileType?: string;
    title?: string;
    uploadedBy?: string;
  }): Promise<TAttachmentRow>;

  list(input: {
    orgId: string;
    entityType?: string;
    entityId?: string;
  }): Promise<TAttachmentRow[]>;

  getById(id: string): Promise<TAttachmentRow | null>;

  update(input: {
    id: string;
    title?: string;
    fileType?: string;
  }): Promise<TAttachmentRow>;

  delete(id: string): Promise<void>;
}

export function makeAttachmentsRepository(
  database = defaultDatabase
): AttachmentsRepository {
  return {
    async create({
      orgId,
      entityType,
      entityId,
      url,
      fileType,
      title,
      uploadedBy,
    }) {
      const [row] = await database
        .insert(attachment)
        .values({
          orgId,
          entityType,
          entityId,
          url,
          fileType: fileType ?? null,
          title: title ?? null,
          uploadedBy: uploadedBy ?? null,
        })
        .returning();

      return mapAttachmentRow(row);
    },

    async list({ orgId, entityType, entityId }) {
      const where = and(
        eq(attachment.orgId, orgId),
        entityType ? eq(attachment.entityType, entityType) : sql`true`,
        entityId ? eq(attachment.entityId, entityId) : sql`true`
      );

      const rows = await database
        .select()
        .from(attachment)
        .where(where)
        .orderBy(attachment.createdAt);

      return rows.map(mapAttachmentRow);
    },

    async getById(id) {
      const [row] = await database
        .select()
        .from(attachment)
        .where(eq(attachment.id, id))
        .limit(1);

      return row ? mapAttachmentRow(row) : null;
    },

    async update({ id, title, fileType }) {
      const [row] = await database
        .update(attachment)
        .set({
          title:
            title === undefined ? sql`${attachment.title}` : (title ?? null),
          fileType:
            fileType === undefined
              ? sql`${attachment.fileType}`
              : (fileType ?? null),
        })
        .where(eq(attachment.id, id))
        .returning();

      return mapAttachmentRow(row!);
    },

    async delete(id) {
      await database.delete(attachment).where(eq(attachment.id, id));
    },
  };
}

function mapAttachmentRow(
  r: typeof AttachmentTbl.$inferSelect
): TAttachmentRow {
  return {
    id: r.id,
    orgId: r.orgId,
    entityType: r.entityType,
    entityId: r.entityId,
    url: r.url,
    fileType: r.fileType ?? null,
    title: r.title ?? null,
    createdAt: String(r.createdAt),
    uploadedBy: r.uploadedBy ?? null,
  };
}

export const attachmentsRepository = makeAttachmentsRepository();
