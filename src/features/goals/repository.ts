import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { athleteGoal, athleteGoalProgress } from "@/infrastructure/db/schema";
import type {
  GoalStatus,
  TAthleteGoalRow,
  TListGoalsInput,
  TGetGoalInput,
  TCreateGoalInput,
  TPatchGoalInput,
  TDeleteGoalInput,
  TAthleteGoalProgressRow,
  TListGoalProgressInput,
  TGetGoalProgressInput,
  TCreateGoalProgressInput,
  TPatchGoalProgressInput,
  TDeleteGoalProgressInput,
} from "./dto";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ———————————————————— Interfaces ————————————————————
export interface GoalsRepository {
  list(i: TListGoalsInput): Promise<TAthleteGoalRow[]>;
  get(i: TGetGoalInput): Promise<TAthleteGoalRow | null>;
  create(i: TCreateGoalInput): Promise<TAthleteGoalRow>;
  patch(i: TPatchGoalInput): Promise<TAthleteGoalRow | null>;
  del(i: TDeleteGoalInput): Promise<void>;
}

export interface GoalProgressRepository {
  list(i: TListGoalProgressInput): Promise<TAthleteGoalProgressRow[]>;
  get(i: TGetGoalProgressInput): Promise<TAthleteGoalProgressRow | null>;
  create(i: TCreateGoalProgressInput): Promise<TAthleteGoalProgressRow>;
  patch(i: TPatchGoalProgressInput): Promise<TAthleteGoalProgressRow | null>;
  del(i: TDeleteGoalProgressInput): Promise<void>;
}

// ———————————————————— Mappers ————————————————————
function mapGoalRow<R extends { status: string }>(r: R): TAthleteGoalRow {
  return { ...(r as any), status: r.status as GoalStatus };
}

// ———————————————————— Goals ————————————————————
export const goalsRepository: GoalsRepository = {
  async list(i) {
    const limit = clamp(i.limit ?? 50, 1, 200);
    const offset = Math.max(i.offset ?? 0, 0);

    const wh: any[] = [eq(athleteGoal.orgId, i.orgId)];
    if (i.athleteId) wh.push(eq(athleteGoal.athleteId, i.athleteId));
    if (i.status) wh.push(eq(athleteGoal.status, i.status));
    if (i.goalType) wh.push(eq(athleteGoal.goalType, i.goalType));
    if (i.targetFrom) wh.push(gte(athleteGoal.targetDate, i.targetFrom));
    if (i.targetTo) wh.push(lte(athleteGoal.targetDate, i.targetTo));

    const col =
      i.orderBy === "title"
        ? athleteGoal.title
        : i.orderBy === "goalType"
          ? athleteGoal.goalType
          : i.orderBy === "status"
            ? athleteGoal.status
            : i.orderBy === "targetDate"
              ? athleteGoal.targetDate
              : i.orderBy === "updatedAt"
                ? athleteGoal.updatedAt
                : i.orderBy === "createdAt"
                  ? athleteGoal.createdAt
                  : athleteGoal.id;

    const dir = (i.order ?? "asc") === "desc" ? desc(col) : asc(col);

    const rows = await db
      .select()
      .from(athleteGoal)
      .where(and(...wh))
      .orderBy(dir)
      .limit(limit)
      .offset(offset);

    return rows.map(mapGoalRow);
  },

  async get(i) {
    const rows = await db
      .select()
      .from(athleteGoal)
      .where(and(eq(athleteGoal.orgId, i.orgId), eq(athleteGoal.id, i.id)))
      .limit(1);

    return rows[0] ? mapGoalRow(rows[0]) : null;
  },

  async create(i) {
    const [row] = await db
      .insert(athleteGoal)
      .values({
        orgId: i.orgId,
        athleteId: i.athleteId,
        goalType: i.goalType,
        title: i.title,
        description: i.description ?? null,
        targetEntityType: i.targetEntityType ?? null,
        targetEntityId: i.targetEntityId ?? null,
        targetValue: i.targetValue ?? null,
        targetDate: i.targetDate ?? null,
        status: i.status ?? "active",
      })
      .returning();

    return mapGoalRow(row!);
  },

  async patch(i) {
    const [row] = await db
      .update(athleteGoal)
      .set({
        ...(i.athleteId !== undefined ? { athleteId: i.athleteId } : {}),
        ...(i.goalType !== undefined ? { goalType: i.goalType } : {}),
        ...(i.title !== undefined ? { title: i.title } : {}),
        ...(i.description !== undefined ? { description: i.description } : {}),
        ...(i.targetEntityType !== undefined
          ? { targetEntityType: i.targetEntityType }
          : {}),
        ...(i.targetEntityId !== undefined
          ? { targetEntityId: i.targetEntityId }
          : {}),
        ...(i.targetValue !== undefined ? { targetValue: i.targetValue } : {}),
        ...(i.targetDate !== undefined ? { targetDate: i.targetDate } : {}),
        ...(i.status !== undefined ? { status: i.status } : {}),
      })
      .where(and(eq(athleteGoal.orgId, i.orgId), eq(athleteGoal.id, i.id)))
      .returning();

    return row ? mapGoalRow(row) : null;
  },

  async del(i) {
    await db
      .delete(athleteGoal)
      .where(and(eq(athleteGoal.orgId, i.orgId), eq(athleteGoal.id, i.id)));
  },
};

// ———————————————————— Goal Progress ————————————————————
export const goalProgressRepository: GoalProgressRepository = {
  async list(i) {
    const limit = clamp(i.limit ?? 50, 1, 200);
    const offset = Math.max(i.offset ?? 0, 0);

    // Build all filters for a single .where(and(...))
    const wh: any[] = [
      eq(athleteGoal.id, athleteGoalProgress.athleteGoalId),
      eq(athleteGoal.orgId, i.orgId),
      eq(athleteGoalProgress.athleteGoalId, i.athleteGoalId),
    ];
    if (i.createdFrom)
      wh.push(gte(athleteGoalProgress.createdAt, i.createdFrom));
    if (i.createdTo) wh.push(lte(athleteGoalProgress.createdAt, i.createdTo));

    const col =
      i.orderBy === "createdAt"
        ? athleteGoalProgress.createdAt
        : athleteGoalProgress.id;
    const dir = (i.order ?? "asc") === "desc" ? desc(col) : asc(col);

    const rows = await db
      .select({
        id: athleteGoalProgress.id,
        athleteGoalId: athleteGoalProgress.athleteGoalId,
        sessionId: athleteGoalProgress.sessionId,
        sourceEntityId: athleteGoalProgress.sourceEntityId,
        sourceEntityType: athleteGoalProgress.sourceEntityType,
        value: athleteGoalProgress.value,
        note: athleteGoalProgress.note,
        createdAt: athleteGoalProgress.createdAt,
      })
      .from(athleteGoalProgress)
      .innerJoin(
        athleteGoal,
        eq(athleteGoal.id, athleteGoalProgress.athleteGoalId)
      )
      .where(and(...wh))
      .orderBy(dir)
      .limit(limit)
      .offset(offset);

    // Rows are already shaped as TAthleteGoalProgressRow
    return rows as TAthleteGoalProgressRow[];
  },

  async get(i) {
    const rows = await db
      .select({
        id: athleteGoalProgress.id,
        athleteGoalId: athleteGoalProgress.athleteGoalId,
        sessionId: athleteGoalProgress.sessionId,
        sourceEntityId: athleteGoalProgress.sourceEntityId,
        sourceEntityType: athleteGoalProgress.sourceEntityType,
        value: athleteGoalProgress.value,
        note: athleteGoalProgress.note,
        createdAt: athleteGoalProgress.createdAt,
      })
      .from(athleteGoalProgress)
      .innerJoin(
        athleteGoal,
        eq(athleteGoal.id, athleteGoalProgress.athleteGoalId)
      )
      .where(
        and(eq(athleteGoal.orgId, i.orgId), eq(athleteGoalProgress.id, i.id))
      )
      .limit(1);

    return (rows[0] as TAthleteGoalProgressRow) ?? null;
  },

  async create(i) {
    const [row] = await db
      .insert(athleteGoalProgress)
      .values({
        athleteGoalId: i.athleteGoalId,
        sessionId: i.sessionId ?? null,
        sourceEntityId: i.sourceEntityId ?? null,
        sourceEntityType: i.sourceEntityType ?? null,
        value: i.value ?? null,
        note: i.note ?? null,
      })
      .returning();

    return row as TAthleteGoalProgressRow;
  },

  async patch(i) {
    const [row] = await db
      .update(athleteGoalProgress)
      .set({
        ...(i.sessionId !== undefined ? { sessionId: i.sessionId } : {}),
        ...(i.sourceEntityId !== undefined
          ? { sourceEntityId: i.sourceEntityId }
          : {}),
        ...(i.sourceEntityType !== undefined
          ? { sourceEntityType: i.sourceEntityType }
          : {}),
        ...(i.value !== undefined ? { value: i.value } : {}),
        ...(i.note !== undefined ? { note: i.note } : {}),
      })
      .where(eq(athleteGoalProgress.id, i.id))
      .returning();

    return (row as TAthleteGoalProgressRow) ?? null;
  },

  async del(i) {
    await db
      .delete(athleteGoalProgress)
      .where(eq(athleteGoalProgress.id, i.id));
  },
};
