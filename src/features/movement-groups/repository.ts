import { db } from "@/infrastructure/db/client";
import * as s from "@/infrastructure/db/schema";
import { and, eq, ilike, sql } from "drizzle-orm";
import type {
  TMovementGroupRow,
  TListMovementGroupsInput,
  TGetMovementGroupInput,
  TCreateMovementGroupInput,
  TPatchMovementGroupInput,
  TDeleteMovementGroupInput,
} from "./dto";

function mapRow(r: typeof s.movementGroup.$inferSelect): TMovementGroupRow {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    description: r.description ?? null,
    isActive: r.isActive,
  };
}

export interface MovementGroupsRepository {
  list(input: TListMovementGroupsInput): Promise<TMovementGroupRow[]>;
  getById(input: TGetMovementGroupInput): Promise<TMovementGroupRow | null>;
  create(input: TCreateMovementGroupInput): Promise<TMovementGroupRow>;
  update(input: TPatchMovementGroupInput): Promise<TMovementGroupRow>;
  delete(input: TDeleteMovementGroupInput): Promise<void>;
}

export function makeMovementGroupsRepository(): MovementGroupsRepository {
  return {
    async list(input) {
      const where = and(
        eq(s.movementGroup.orgId, input.orgId),
        input.q
          ? ilike(
              sql`${s.movementGroup.name} || ' ' || coalesce(${s.movementGroup.description}, '')`,
              `%${input.q}%`
            )
          : undefined,
        input.isActive === undefined
          ? undefined
          : eq(s.movementGroup.isActive, input.isActive)
      );

      const orderCol =
        input.orderBy === "id" ? s.movementGroup.id : s.movementGroup.name;
      const orderDir =
        (input.order ?? "asc").toLowerCase() === "desc" ? "desc" : "asc";

      const rows = await db
        .select()
        .from(s.movementGroup)
        .where(where)
        .orderBy(
          orderDir === "desc" ? sql`${orderCol} DESC` : sql`${orderCol} ASC`
        )
        .limit(input.limit ?? 50)
        .offset(input.offset ?? 0);

      return rows.map(mapRow);
    },

    async getById({ orgId, movementGroupId }) {
      const rows = await db
        .select()
        .from(s.movementGroup)
        .where(
          and(
            eq(s.movementGroup.id, movementGroupId),
            eq(s.movementGroup.orgId, orgId)
          )
        )
        .limit(1);
      if (!rows.length) return null;
      return mapRow(rows[0]);
    },

    async create(input) {
      const [row] = await db
        .insert(s.movementGroup)
        .values({
          orgId: input.orgId,
          name: input.name,
          description: input.description ?? null,
          isActive: input.isActive ?? true,
        })
        .returning();
      return mapRow(row);
    },

    async update(input) {
      const patch: Partial<typeof s.movementGroup.$inferInsert> = {};
      if ("name" in input && input.name !== undefined) patch.name = input.name;
      if ("description" in input) patch.description = input.description ?? null;
      if ("isActive" in input && input.isActive !== undefined)
        patch.isActive = input.isActive;

      const [row] = await db
        .update(s.movementGroup)
        .set(patch)
        .where(
          and(
            eq(s.movementGroup.id, input.movementGroupId),
            eq(s.movementGroup.orgId, input.orgId)
          )
        )
        .returning();

      return mapRow(row);
    },

    async delete({ orgId, movementGroupId }) {
      await db
        .delete(s.movementGroup)
        .where(
          and(
            eq(s.movementGroup.id, movementGroupId),
            eq(s.movementGroup.orgId, orgId)
          )
        );
    },
  };
}

export const movementGroupsRepository = makeMovementGroupsRepository();
