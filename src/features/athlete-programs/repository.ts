import { and, desc, asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { athleteProgram } from "@/infrastructure/db/schema";
import type {
  TAthleteProgramRow,
  TListAthleteProgramsInput,
  TGetAthleteProgramInput,
  TEnrollAthleteProgramInput,
  TUnenrollAthleteProgramInput,
  TPatchAthleteProgramInput,
} from "./dto";

function orderCol(name: NonNullable<TListAthleteProgramsInput["orderBy"]>) {
  switch (name) {
    case "createdAt":
      return athleteProgram.createdAt;
    case "updatedAt":
      return athleteProgram.updatedAt;
    case "currentWeek":
      return athleteProgram.currentWeek;
    default:
      return athleteProgram.startDate;
  }
}

export const athleteProgramsRepository = {
  async list(input: TListAthleteProgramsInput): Promise<TAthleteProgramRow[]> {
    const col = orderCol(input.orderBy ?? "startDate");
    const direction = (input.order ?? "desc") === "desc" ? desc : asc;

    return db
      .select()
      .from(athleteProgram)
      .where(
        and(
          eq(athleteProgram.orgId, input.orgId),
          eq(athleteProgram.athleteId, input.athleteId),
          ...(input.activeOnly ? [eq(athleteProgram.isActive, true)] : [])
        )
      )
      .orderBy(direction(col))
      .limit(input.limit ?? 50)
      .offset(input.offset ?? 0);
  },

  async getById(
    input: TGetAthleteProgramInput
  ): Promise<TAthleteProgramRow | undefined> {
    const rows = await db
      .select()
      .from(athleteProgram)
      .where(
        and(
          eq(athleteProgram.orgId, input.orgId),
          eq(athleteProgram.id, input.athleteProgramId)
        )
      )
      .limit(1);
    return rows[0];
  },

  async enroll(input: TEnrollAthleteProgramInput): Promise<TAthleteProgramRow> {
    const existing = await db
      .select()
      .from(athleteProgram)
      .where(
        and(
          eq(athleteProgram.orgId, input.orgId),
          eq(athleteProgram.athleteId, input.athleteId),
          eq(athleteProgram.programId, input.programId)
        )
      )
      .limit(1);

    const todayIso = new Date().toISOString().slice(0, 10);
    const startDate = input.startDate ?? todayIso;

    if (existing[0]) {
      const [row] = await db
        .update(athleteProgram)
        .set({
          isActive: true,
          startDate,
          currentWeek: existing[0].currentWeek ?? 1,
          updatedAt: new Date(),
        })
        .where(eq(athleteProgram.id, existing[0].id))
        .returning();
      return row!;
    }

    const [row] = await db
      .insert(athleteProgram)
      .values({
        orgId: input.orgId,
        athleteId: input.athleteId,
        programId: input.programId,
        startDate,
        currentWeek: 1,
        isActive: true,
      })
      .returning();
    return row!;
  },

  async unenroll(input: TUnenrollAthleteProgramInput): Promise<void> {
    await db
      .update(athleteProgram)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(athleteProgram.orgId, input.orgId),
          eq(athleteProgram.athleteId, input.athleteId),
          eq(athleteProgram.programId, input.programId)
        )
      );
  },

  async patch(input: TPatchAthleteProgramInput): Promise<TAthleteProgramRow> {
    const [row] = await db
      .update(athleteProgram)
      .set({
        ...(input.currentWeek !== undefined
          ? { currentWeek: input.currentWeek }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.startDate !== undefined
          ? { startDate: input.startDate }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(athleteProgram.orgId, input.orgId),
          eq(athleteProgram.id, input.athleteProgramId)
        )
      )
      .returning();

    return row!;
  },
};
