import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { plannedSession } from "@/infrastructure/db/schema";
import type {
  TPlannedSessionRow,
  TListPlannedSessionsInput,
  TGetPlannedSessionInput,
  TCreatePlannedSessionInput,
  TPatchPlannedSessionInput,
  TDeletePlannedSessionInput,
} from "./dto";

export interface PlannedSessionsRepository {
  list(i: TListPlannedSessionsInput): Promise<TPlannedSessionRow[]>;
  get(i: TGetPlannedSessionInput): Promise<TPlannedSessionRow | null>;
  create(i: TCreatePlannedSessionInput): Promise<TPlannedSessionRow>;
  patch(i: TPatchPlannedSessionInput): Promise<TPlannedSessionRow | null>;
  del(i: TDeletePlannedSessionInput): Promise<void>;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const plannedSessionsRepository: PlannedSessionsRepository = {
  async list(i) {
    const limit = clamp(i.limit ?? 50, 1, 200);
    const offset = Math.max(i.offset ?? 0, 0);

    const filters = [eq(plannedSession.orgId, i.orgId)];
    if (i.athleteId) filters.push(eq(plannedSession.athleteId, i.athleteId));
    if (i.dateFrom) filters.push(gte(plannedSession.plannedDate, i.dateFrom));
    if (i.dateTo) filters.push(lte(plannedSession.plannedDate, i.dateTo));

    const col =
      i.orderBy === "title"
        ? plannedSession.title
        : i.orderBy === "createdAt"
          ? plannedSession.createdAt
          : i.orderBy === "updatedAt"
            ? plannedSession.updatedAt
            : i.orderBy === "plannedDate"
              ? plannedSession.plannedDate
              : plannedSession.id;

    const dir = (i.order ?? "asc") === "desc" ? desc(col) : asc(col);

    return db
      .select()
      .from(plannedSession)
      .where(and(...filters))
      .orderBy(dir)
      .limit(limit)
      .offset(offset);
  },

  async get(i) {
    const rows = await db
      .select()
      .from(plannedSession)
      .where(
        and(eq(plannedSession.orgId, i.orgId), eq(plannedSession.id, i.id))
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async create(i) {
    const [row] = await db
      .insert(plannedSession)
      .values({
        orgId: i.orgId,
        athleteId: i.athleteId,
        plannedDate: i.plannedDate,
        title: i.title ?? null,
        notes: i.notes ?? null,
      })
      .returning();
    return row!;
  },

  async patch(i) {
    const [row] = await db
      .update(plannedSession)
      .set({
        ...(i.athleteId !== undefined ? { athleteId: i.athleteId } : {}),
        ...(i.plannedDate !== undefined ? { plannedDate: i.plannedDate } : {}),
        ...(i.title !== undefined ? { title: i.title } : {}),
        ...(i.notes !== undefined ? { notes: i.notes } : {}),
      })
      .where(
        and(eq(plannedSession.orgId, i.orgId), eq(plannedSession.id, i.id))
      )
      .returning();
    return row ?? null;
  },

  async del(i) {
    await db
      .delete(plannedSession)
      .where(
        and(eq(plannedSession.orgId, i.orgId), eq(plannedSession.id, i.id))
      );
  },
};
