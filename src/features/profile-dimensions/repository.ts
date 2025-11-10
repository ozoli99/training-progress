import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { profileDimension } from "@/infrastructure/db/schema";
import type {
  TCreateProfileDimensionInput,
  TDeleteProfileDimensionInput,
  TGetProfileDimensionInput,
  TListProfileDimensionsInput,
  TPatchProfileDimensionInput,
  TProfileDimensionRow,
} from "./dto";

export const profileDimensionsRepository = {
  async list(
    input: TListProfileDimensionsInput
  ): Promise<TProfileDimensionRow[]> {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const offset = Math.max(input.offset ?? 0, 0);

    const filters = [eq(profileDimension.orgId, input.orgId)];
    if (input.activeOnly) filters.push(eq(profileDimension.isActive, true));

    const orderCol =
      input.orderBy === "key"
        ? profileDimension.key
        : input.orderBy === "label"
          ? profileDimension.label
          : input.orderBy === "displayOrder"
            ? profileDimension.displayOrder
            : input.orderBy === "isDefault"
              ? profileDimension.isDefault
              : input.orderBy === "isActive"
                ? profileDimension.isActive
                : profileDimension.id;

    const orderDir =
      (input.order ?? "asc") === "desc" ? desc(orderCol) : asc(orderCol);

    return db
      .select()
      .from(profileDimension)
      .where(and(...filters))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
  },

  async getById(
    input: TGetProfileDimensionInput
  ): Promise<TProfileDimensionRow | null> {
    const rows = await db
      .select()
      .from(profileDimension)
      .where(
        and(
          eq(profileDimension.orgId, input.orgId),
          eq(profileDimension.id, input.id)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async create(
    input: TCreateProfileDimensionInput
  ): Promise<TProfileDimensionRow> {
    const [row] = await db
      .insert(profileDimension)
      .values({
        orgId: input.orgId,
        key: input.key,
        label: input.label,
        description: input.description ?? null,
        isDefault: input.isDefault ?? false,
        displayOrder: input.displayOrder ?? 0,
        isActive: input.isActive ?? true,
      })
      .returning();
    return row!;
  },

  async update(
    input: TPatchProfileDimensionInput
  ): Promise<TProfileDimensionRow | null> {
    const [row] = await db
      .update(profileDimension)
      .set({
        ...(input.key !== undefined ? { key: input.key } : {}),
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.isDefault !== undefined
          ? { isDefault: input.isDefault }
          : {}),
        ...(input.displayOrder !== undefined
          ? { displayOrder: input.displayOrder ?? 0 }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      })
      .where(
        and(
          eq(profileDimension.orgId, input.orgId),
          eq(profileDimension.id, input.id)
        )
      )
      .returning();
    return row ?? null;
  },

  async delete(input: TDeleteProfileDimensionInput): Promise<void> {
    await db
      .delete(profileDimension)
      .where(
        and(
          eq(profileDimension.orgId, input.orgId),
          eq(profileDimension.id, input.id)
        )
      );
  },

  async unsetOtherDefaults(orgId: string, exceptId?: string): Promise<void> {
    await db
      .update(profileDimension)
      .set({ isDefault: false })
      .where(
        and(
          eq(profileDimension.orgId, orgId),
          ...(exceptId ? [ne(profileDimension.id, exceptId)] : [])
        )
      );
  },
};
